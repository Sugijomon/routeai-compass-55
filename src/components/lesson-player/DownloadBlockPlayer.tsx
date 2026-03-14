import { Download, FileText, FileImage, FileSpreadsheet, FileVideo, File } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { DownloadBlock } from '@/types/lesson-blocks';

function getFileIcon(fileType?: string) {
  if (!fileType) return File;
  if (fileType.includes('pdf')) return FileText;
  if (fileType.includes('image')) return FileImage;
  if (fileType.includes('sheet') || fileType.includes('excel') || fileType.includes('csv')) return FileSpreadsheet;
  if (fileType.includes('video')) return FileVideo;
  if (fileType.includes('word') || fileType.includes('document')) return FileText;
  return File;
}

function getFileColor(fileType?: string): string {
  if (!fileType) return 'bg-muted text-muted-foreground';
  if (fileType.includes('pdf')) return 'bg-red-100 text-red-600';
  if (fileType.includes('image')) return 'bg-blue-100 text-blue-600';
  if (fileType.includes('sheet') || fileType.includes('excel')) return 'bg-green-100 text-green-600';
  if (fileType.includes('word') || fileType.includes('document')) return 'bg-blue-100 text-blue-700';
  return 'bg-muted text-muted-foreground';
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DownloadBlockPlayer({ block }: { block: DownloadBlock }) {
  const Icon = getFileIcon(block.file_type);
  const colorClass = getFileColor(block.file_type);

  if (!block.file_url) return null;

  const handleDownload = async () => {
    try {
      const response = await fetch(block.file_url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = block.file_name || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch {
      // Fallback: open in new tab if fetch fails
      window.open(block.file_url, '_blank');
    }
  };

  return (
    <div className="flex items-center gap-4 rounded-lg border bg-card p-4 shadow-sm my-4">
      {/* File type icon */}
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${colorClass}`}>
        <Icon className="h-6 w-6" />
      </div>

      {/* File info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground truncate">{block.file_name}</p>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          {block.description && (
            <span>{block.description}</span>
          )}
          {block.file_size && (
            <span>
              {block.description && ' · '}{formatFileSize(block.file_size)}
            </span>
          )}
        </div>
      </div>

      {/* Download button */}
      <Button
        variant="outline"
        size="sm"
        className="shrink-0 gap-2 group-hover:border-primary group-hover:text-primary transition-colors"
        onClick={handleDownload}
      >
        <Download className="h-4 w-4" />
        {block.label || 'Download'}
      </Button>
    </div>
  );
}
