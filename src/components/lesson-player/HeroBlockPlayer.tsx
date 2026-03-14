import type { HeroBlock } from '@/types/lesson-blocks';

interface HeroBlockPlayerProps {
  block: HeroBlock;
}

export function HeroBlockPlayer({ block }: HeroBlockPlayerProps) {
  return (
    <div
      className="rounded-2xl pt-3 pb-1 px-6 text-white"
      style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #1e4080 100%)' }}
    >
      <h1 className="text-3xl font-bold leading-tight mb-3">{block.title}</h1>
    </div>
  );
}
