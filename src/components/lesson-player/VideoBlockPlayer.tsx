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

  // Handle completion
  const handleVideoEnded = useCallback(() => {
    setIsCompleted(true);
    setIsPlaying(false);
    setProgress(100);
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
  }, []);

  // Update proceed permission based on must_watch_full setting
  useEffect(() => {
    if (!block.must_watch_full) {
      onCanProceed(true);
    } else {
      onCanProceed(isCompleted);
    }
  }, [block.must_watch_full, isCompleted, onCanProceed]);

  // Load YouTube API
  useEffect(() => {
    if (type !== 'youtube' || !id) return;

    const loadYouTubeAPI = () => {
      if (window.YT && window.YT.Player) {
        initYouTubePlayer();
        return;
      }

      // Check if script is already loading
      if (document.querySelector('script[src*="youtube.com/iframe_api"]')) {
        window.onYouTubeIframeAPIReady = initYouTubePlayer;
        return;
      }

      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = initYouTubePlayer;
    };

    const initYouTubePlayer = () => {
      if (!containerRef.current || youtubePlayerRef.current) return;
      
      // Create a div for the player
      const playerDiv = document.createElement('div');
      playerDiv.id = `youtube-player-${block.id}`;
      containerRef.current.innerHTML = '';
      containerRef.current.appendChild(playerDiv);

      youtubePlayerRef.current = new window.YT.Player(playerDiv.id, {
        videoId: id,
        playerVars: {
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
        },
        events: {
          onReady: () => {
            setIsLoading(false);
          },
          onStateChange: (event) => {
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
    };

    loadYouTubeAPI();

    return () => {
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

    // Create iframe for Vimeo
    const iframe = document.createElement('iframe');
    iframe.src = `https://player.vimeo.com/video/${id}`;
    iframe.className = 'absolute inset-0 w-full h-full';
    iframe.allow = 'autoplay; fullscreen; picture-in-picture';
    iframe.allowFullscreen = true;
    
    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(iframe);

    const player = new Player(iframe);
    vimeoPlayerRef.current = player;

    player.ready().then(() => {
      setIsLoading(false);
    });

    player.on('ended', () => {
      handleVideoEnded();
    });

    player.on('play', () => {
      setIsPlaying(true);
    });

    player.on('pause', () => {
      setIsPlaying(false);
    });

    player.on('timeupdate', (data) => {
      if (data.duration > 0) {
        setProgress((data.seconds / data.duration) * 100);
      }
    });

    return () => {
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
        <p className="text-lg text-muted-foreground text-center">{block.caption}</p>
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
