import type { KeyTakeawaysBlock } from '@/types/lesson-blocks';

interface KeyTakeawaysBlockPlayerProps {
  block: KeyTakeawaysBlock;
}

export function KeyTakeawaysBlockPlayer({ block }: KeyTakeawaysBlockPlayerProps) {
  if (!block.items || block.items.length === 0) return null;

  return (
    <div
      className="rounded-2xl px-8 py-8 text-white"
      style={{ background: 'linear-gradient(135deg, #0f2744 0%, #1a3560 100%)' }}
    >
      <h3 className="text-lg font-bold mb-5 tracking-wide uppercase" style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem', letterSpacing: '0.1em' }}>
        Kernpunten
      </h3>
      <ul className="space-y-3">
        {block.items.map((item, idx) => (
          <li key={idx} className="flex items-start gap-3">
            <span
              className="mt-1.5 h-2 w-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: '#3b82f6' }}
            />
            <span className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.9)' }}>
              {item}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
