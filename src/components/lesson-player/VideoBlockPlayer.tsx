import { useState, useEffect, useRef, useCallback } from 'react';
import { VideoBlock } from '@/types/lesson-blocks';
import { Clock, Play, CheckCircle2, Loader2 } from 'lucide-react';
import Player from '@vimeo/player';

interface VideoBlockPlayerProps {
  block: VideoBlock;
  onCanProceed: (canProceed: boolean) => void;
}

type VideoType = 'youtube' | 'vimeo' | 'unknown';

// Extract video ID and type from URL
function parseVideoUrl(url: string): { type: VideoType; id: string | null } {
  // YouTube patterns
  const youtubeMatch = url.match(
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
  );
  if (youtubeMatch) {
    return { type: 'youtube', id: youtubeMatch[1] };
  }

  // Vimeo patterns
  const vimeoMatch = url.match(/(?:vimeo\.com\/)(\d+)/);
  if (vimeoMatch) {
    return { type: 'vimeo', id: vimeoMatch[1] };
  }

  return { type: 'unknown', id: null };
}

// Declare YouTube types
declare global {
  interface Window {
    YT: {
      Player: new (elementId: string, config: {
        videoId: string;
        width?: string | number;
        height?: string | number;
        playerVars?: Record<string, number | string>;
        events?: {
          onReady?: (event: { target: YTPlayer }) => void;
          onStateChange?: (event: { data: number; target: YTPlayer }) => void;
        };
      }) => YTPlayer;
      PlayerState: {
        ENDED: number;
        PLAYING: number;
        PAUSED: number;
        BUFFERING: number;
        CUED: number;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface YTPlayer {
  destroy: () => void;
  getCurrentTime: () => number;
  getDuration: () => number;
}

export function VideoBlockPlayer({ block, onCanProceed }: VideoBlockPlayerProps) {
  const [isCompleted, setIsCompleted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  const youtubePlayerRef = useRef<YTPlayer | null>(null);
  const vimeoPlayerRef = useRef<Player | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressIntervalRef = useRef<number | null>(null);
  
  const { type, id } = parseVideoUrl(block.url);

  const debugPrefix = `[VideoBlockPlayer:${block.id}]`;

  // Debug: component mount/unmount + block config
  useEffect(() => {
    console.log(`${debugPrefix} mount`, {
      url: block.url,
      parsed: { type, id },
      must_watch_full: (block as any).must_watch_full,
      requireFullWatch: (block as any).requireFullWatch,
      caption: block.caption,
    });
    return () => {
      console.log(`${debugPrefix} unmount`);
    };
    // NOTE: intentionally only on initial mount/unmount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle completion
  const handleVideoEnded = useCallback(() => {
    console.log(`${debugPrefix} handleVideoEnded -> setIsCompleted(true)`);
    setIsCompleted(true);
    setIsPlaying(false);
    setProgress(100);
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
  }, []);

  // Always allow proceeding — no gating on video completion
  useEffect(() => {
    onCanProceed(true);
  }, [onCanProceed]);

  // Load YouTube API
  useEffect(() => {
    if (type !== 'youtube' || !id) return;

    console.log(`${debugPrefix} init YouTube flow`, { type, id });

    const loadYouTubeAPI = () => {
      if (window.YT && window.YT.Player) {
        console.log(`${debugPrefix} YouTube API already available`);
        initYouTubePlayer();
        return;
      }

      // Check if script is already loading
      if (document.querySelector('script[src*="youtube.com/iframe_api"]')) {
        console.log(`${debugPrefix} YouTube API script tag already exists; waiting for onYouTubeIframeAPIReady`);
        window.onYouTubeIframeAPIReady = initYouTubePlayer;
        return;
      }

      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      console.log(`${debugPrefix} injecting YouTube iframe_api script`);
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = initYouTubePlayer;
    };

    const initYouTubePlayer = () => {
      if (!containerRef.current || youtubePlayerRef.current) return;

      console.log(`${debugPrefix} creating YouTube player`, { playerDivId: `youtube-player-${block.id}` });
      
      // Create a div for the player
      const playerDiv = document.createElement('div');
      playerDiv.id = `youtube-player-${block.id}`;
      containerRef.current.innerHTML = '';
      containerRef.current.appendChild(playerDiv);

      youtubePlayerRef.current = new window.YT.Player(playerDiv.id, {
        videoId: id,
        width: '100%',
        height: '100%',
        playerVars: {
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
        },
        events: {
          onReady: () => {
            console.log(`${debugPrefix} YouTube onReady`);
            setIsLoading(false);
          },
          onStateChange: (event) => {
            console.log(`${debugPrefix} YouTube onStateChange`, { state: event.data });
            if (event.data === window.YT.PlayerState.ENDED) {
              handleVideoEnded();
            } else if (event.data === window.YT.PlayerState.PLAYING) {
              setIsPlaying(true);
              // Start progress tracking
              if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current);
              }
              progressIntervalRef.current = window.setInterval(() => {
                if (youtubePlayerRef.current) {
                  const currentTime = youtubePlayerRef.current.getCurrentTime();
                  const duration = youtubePlayerRef.current.getDuration();
                  if (duration > 0) {
                    setProgress((currentTime / duration) * 100);
                  }
                }
              }, 500);
            } else if (event.data === window.YT.PlayerState.PAUSED) {
              setIsPlaying(false);
            }
          },
        },
      });

      setTimeout(() => {
        const iframe = containerRef.current?.querySelector('iframe');
        if (iframe) {
          iframe.style.width = '100%';
          iframe.style.height = '100%';
          iframe.style.position = 'absolute';
          iframe.style.top = '0';
          iframe.style.left = '0';
        }
      }, 500);
    };

    loadYouTubeAPI();

    return () => {
      console.log(`${debugPrefix} cleanup YouTube`);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      if (youtubePlayerRef.current) {
        youtubePlayerRef.current.destroy();
        youtubePlayerRef.current = null;
      }
    };
  }, [type, id, block.id, handleVideoEnded]);

  // Initialize Vimeo player
  useEffect(() => {
    if (type !== 'vimeo' || !id || !containerRef.current) return;

    console.log(`${debugPrefix} init Vimeo flow`, { type, id });

    // Create iframe for Vimeo with URL parameters to hide end screen suggestions
    const iframe = document.createElement('iframe');
    iframe.src = `https://player.vimeo.com/video/${id}?outro=nothing&title=0&byline=0&portrait=0&controls=1`;
    iframe.className = 'absolute inset-0 w-full h-full';
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture');
    iframe.setAttribute('allowfullscreen', '');
    
    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(iframe);

    const player = new Player(iframe);
    vimeoPlayerRef.current = player;

    player.ready().then(() => {
      console.log(`${debugPrefix} Vimeo ready()`);
      setIsLoading(false);
    });

    player.on('ended', () => {
      console.log(`${debugPrefix} Vimeo ended`);
      handleVideoEnded();
    });

    player.on('play', () => {
      console.log(`${debugPrefix} Vimeo play`);
      setIsPlaying(true);
    });

    player.on('pause', () => {
      console.log(`${debugPrefix} Vimeo pause`);
      setIsPlaying(false);
    });

    player.on('timeupdate', (data) => {
      // noisy, but useful while debugging
      console.log(`${debugPrefix} Vimeo timeupdate`, { seconds: data.seconds, duration: data.duration });
      if (data.duration > 0) {
        setProgress((data.seconds / data.duration) * 100);
      }
    });

    return () => {
      console.log(`${debugPrefix} cleanup Vimeo`);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      if (vimeoPlayerRef.current) {
        vimeoPlayerRef.current.destroy();
        vimeoPlayerRef.current = null;
      }
    };
  }, [type, id, handleVideoEnded]);

  const showProgressIndicator = block.must_watch_full && !isCompleted;

  return (
    <div className="space-y-4">
      {/* Caption */}
      {block.caption && (
        <p className="text-lg text-muted-foreground text-left">{block.caption}</p>
      )}

      {/* Video container */}
      <div className="relative w-full aspect-video bg-muted rounded-lg overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted z-10">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}
        
        {type === 'unknown' ? (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
            <p>Video URL niet herkend: {block.url}</p>
          </div>
        ) : (
          <div 
            ref={containerRef} 
            className="absolute inset-0 w-full h-full"
          />
        )}
      </div>

      {/* Progress indicator */}
      {showProgressIndicator && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              {isPlaying ? (
                <Play className="h-4 w-4 text-primary animate-pulse" />
              ) : (
                <Clock className="h-4 w-4" />
              )}
              <span>
                {isPlaying 
                  ? 'Video wordt afgespeeld...' 
                  : 'Bekijk de volledige video om door te gaan'}
              </span>
            </div>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Completion indicator */}
      {isCompleted && block.must_watch_full && (
        <div className="flex items-center justify-center gap-2 text-green-600 bg-green-50 dark:bg-green-950/30 rounded-lg p-3">
          <CheckCircle2 className="h-5 w-5" />
          <span className="text-sm font-medium">Video bekeken - je kunt doorgaan</span>
        </div>
      )}
    </div>
  );
}
