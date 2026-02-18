import type { SectionHeaderBlock } from '@/types/lesson-blocks';

interface SectionHeaderBlockPlayerProps {
  block: SectionHeaderBlock;
}

export function SectionHeaderBlockPlayer({ block }: SectionHeaderBlockPlayerProps) {
  return (
    <div className="border-b border-border pb-4">
      <h2 className="text-2xl font-bold text-foreground">{block.title}</h2>
      {block.subtitle && (
        <p className="mt-1 text-muted-foreground">{block.subtitle}</p>
      )}
    </div>
  );
}
