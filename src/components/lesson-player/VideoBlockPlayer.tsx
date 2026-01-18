import { useState, useEffect } from 'react';
import { VideoBlock } from '@/types/lesson-blocks';
import { Clock } from 'lucide-react';

interface VideoBlockPlayerProps {
  block: VideoBlock;
  onCanProceed: (canProceed: boolean) => void;
}

// Extract video ID and type from URL
function parseVideoUrl(url: string): { type: 'youtube' | 'vimeo' | 'unknown'; id: string | null } {
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

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function VideoBlockPlayer({ block, onCanProceed }: VideoBlockPlayerProps) {
  const [timeRemaining, setTimeRemaining] = useState(block.duration || 0);
  const [hasStartedWatching, setHasStartedWatching] = useState(false);

  const { type, id } = parseVideoUrl(block.url);

  // Handle watch requirement
  useEffect(() => {
    if (!block.must_watch_full) {
      onCanProceed(true);
      return;
    }

    // If must watch full and has duration, start countdown when user starts watching
    if (block.duration && block.duration > 0 && hasStartedWatching && timeRemaining > 0) {
      const interval = setInterval(() => {
        setTimeRemaining(prev => {
          const newTime = prev - 1;
          if (newTime <= 0) {
            onCanProceed(true);
            clearInterval(interval);
            return 0;
          }
          return newTime;
        });
      }, 1000);

      return () => clearInterval(interval);
    } else if (!block.duration || block.duration <= 0) {
      // No duration specified, allow proceed after 30 seconds
      onCanProceed(true);
    }
  }, [block.must_watch_full, block.duration, hasStartedWatching, timeRemaining, onCanProceed]);

  // Generate embed URL
  const getEmbedUrl = () => {
    if (type === 'youtube' && id) {
      return `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1`;
    }
    if (type === 'vimeo' && id) {
      return `https://player.vimeo.com/video/${id}`;
    }
    return null;
  };

  const embedUrl = getEmbedUrl();

  return (
    <div className="space-y-4">
      {/* Caption */}
      {block.caption && (
        <p className="text-lg text-muted-foreground text-center">{block.caption}</p>
      )}

      {/* Video embed */}
      <div 
        className="relative w-full aspect-video bg-muted rounded-lg overflow-hidden"
        onClick={() => !hasStartedWatching && setHasStartedWatching(true)}
      >
        {embedUrl ? (
          <iframe
            src={embedUrl}
            title={block.caption || 'Video'}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            onLoad={() => setHasStartedWatching(true)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
            <p>Video URL niet herkend: {block.url}</p>
          </div>
        )}
      </div>

      {/* Watch timer indicator */}
      {block.must_watch_full && timeRemaining > 0 && (
        <div className="flex items-center justify-center gap-2 text-muted-foreground bg-muted/50 rounded-lg p-3">
          <Clock className="h-4 w-4" />
          <span className="text-sm">
            Bekijk de video om door te gaan ({formatTime(timeRemaining)} resterend)
          </span>
        </div>
      )}

      {block.must_watch_full && timeRemaining <= 0 && (
        <div className="flex items-center justify-center gap-2 text-green-600 bg-green-50 rounded-lg p-3">
          <span className="text-sm">✓ Video bekeken - je kunt doorgaan</span>
        </div>
      )}
    </div>
  );
}
