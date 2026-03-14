import ReactMarkdown from 'react-markdown';
import type { ParagraphBlock } from '@/types/lesson-blocks';

interface ParagraphBlockPlayerProps {
  block: ParagraphBlock;
}

function getImageStyles(block: ParagraphBlock): {
  wrapperClass: string;
  imgClass: string;
  imgStyle: React.CSSProperties;
} {
  const widthClass =
    block.image_width === 'small' ? 'max-w-xs' :
    block.image_width === 'full'  ? 'w-full' :
    'max-w-sm';

  const alignClass =
    block.image_align === 'left'  ? 'mr-auto' :
    block.image_align === 'right' ? 'ml-auto' :
    'mx-auto';

  const imgStyle: React.CSSProperties = {};
  const frameClass =
    block.image_frame === 'shadow'   ? 'shadow-lg' :
    block.image_frame === 'rounded'  ? 'rounded-xl' :
    block.image_frame === 'circle'   ? 'rounded-full object-cover aspect-square' :
    block.image_frame === 'border'   ? 'border-4 border-primary' :
    '';

  if (block.image_frame === 'polaroid') {
    imgStyle.padding = '10px';
    imgStyle.background = 'white';
    imgStyle.boxShadow = '2px 4px 12px rgba(0,0,0,0.15)';
    imgStyle.transform = 'rotate(-1deg)';
    imgStyle.display = 'inline-block';
  }

  return {
    wrapperClass: `${widthClass} ${alignClass} block`,
    imgClass: `w-full ${frameClass}`,
    imgStyle,
  };
}

export function ParagraphBlockPlayer({ block }: ParagraphBlockPlayerProps) {
  const styles = getImageStyles(block);

  return (
    <div className="space-y-6">
      <div className="prose prose-slate max-w-none">
        <ReactMarkdown
          components={{
            h1: ({ children }) => (
              <h1 className="text-3xl font-bold text-foreground mb-4">{children}</h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-2xl font-semibold text-foreground mb-3">{children}</h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-xl font-medium text-foreground mb-2">{children}</h3>
            ),
            p: ({ children }) => (
              <p className="text-muted-foreground leading-relaxed mb-4">{children}</p>
            ),
            ul: ({ children }) => (
              <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">{children}</ul>
            ),
            ol: ({ children }) => (
              <ol className="list-decimal list-inside space-y-2 text-muted-foreground mb-4">{children}</ol>
            ),
            li: ({ children }) => (
              <li className="text-muted-foreground">{children}</li>
            ),
            strong: ({ children }) => (
              <strong className="font-semibold text-foreground">{children}</strong>
            ),
            em: ({ children }) => (
              <em className="italic">{children}</em>
            ),
            blockquote: ({ children }) => (
              <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground my-4">
                {children}
              </blockquote>
            ),
            code: ({ children }) => (
              <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>
            ),
            pre: ({ children }) => (
              <pre className="bg-muted p-4 rounded-lg overflow-x-auto my-4">{children}</pre>
            ),
          }}
        >
          {block.content}
        </ReactMarkdown>
      </div>

      {block.image_url && (
        <figure className="my-4">
          <div
            className={styles.wrapperClass}
            style={block.image_frame === 'polaroid' ? styles.imgStyle : {}}
          >
            <img
              src={block.image_url}
              alt={block.image_caption || ''}
              className={styles.imgClass}
            />
          </div>
          {block.image_caption && (
            <figcaption className="text-center text-sm text-muted-foreground mt-2 italic">
              {block.image_caption}
            </figcaption>
          )}
        </figure>
      )}
    </div>
  );
}
