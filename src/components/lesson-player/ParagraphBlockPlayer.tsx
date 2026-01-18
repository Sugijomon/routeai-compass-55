import ReactMarkdown from 'react-markdown';
import { ParagraphBlock } from '@/types/lesson-blocks';

interface ParagraphBlockPlayerProps {
  block: ParagraphBlock;
}

export function ParagraphBlockPlayer({ block }: ParagraphBlockPlayerProps) {
  return (
    <div className="space-y-6">
      {/* Markdown content */}
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

      {/* Optional image */}
      {block.image_url && (
        <div className="space-y-2">
          <img
            src={block.image_url}
            alt={block.image_caption || 'Lesson image'}
            className="rounded-lg w-full max-w-2xl mx-auto shadow-md"
          />
          {block.image_caption && (
            <p className="text-center text-sm text-muted-foreground italic">
              {block.image_caption}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
