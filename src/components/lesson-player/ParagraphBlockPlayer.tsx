import { generateHTML } from '@tiptap/html';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import type { ParagraphBlock } from '@/types/lesson-blocks';

interface ParagraphBlockPlayerProps {
  block: ParagraphBlock;
}

function renderContent(content: string): string {
  if (!content) return '';
  try {
    const json = JSON.parse(content);
    if (json && json.type === 'doc') {
      return generateHTML(json, [
        StarterKit.configure({ heading: { levels: [2, 3] } }),
        Underline,
        Link.configure({ HTMLAttributes: { target: '_blank', rel: 'noopener noreferrer' } }),
        Image,
      ]);
    }
  } catch { /* not JSON */ }
  // Fallback: treat as plain text / legacy Markdown
  return `<p>${content.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>')}</p>`;
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
      <div
        className="prose prose-slate max-w-none [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:text-foreground [&_h2]:mb-3 [&_h3]:text-xl [&_h3]:font-medium [&_h3]:text-foreground [&_h3]:mb-2 [&_p]:text-muted-foreground [&_p]:leading-relaxed [&_p]:mb-4 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-outside [&_ol]:list-outside [&_li]:pl-1 [&_li]:my-0 [&_li>p]:leading-snug [&_li_p]:inline [&_li_p]:m-0 [&_ul]:list-inside [&_ol]:list-inside [&_ul]:space-y-2 [&_ol]:space-y-2 [&_ul]:text-muted-foreground [&_ol]:text-muted-foreground [&_ul]:mb-4 [&_ol]:mb-4 [&_li]:text-muted-foreground [&_strong]:font-semibold [&_strong]:text-foreground [&_em]:italic [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground [&_blockquote]:my-4 [&_a]:text-primary [&_a]:underline [&_img]:rounded-lg [&_img]:my-4"
        dangerouslySetInnerHTML={{ __html: renderContent(block.content) }}
      />

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
