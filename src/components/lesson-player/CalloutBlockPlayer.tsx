import { AlertTriangle, Info, Lightbulb } from 'lucide-react';
import type { CalloutBlock } from '@/types/lesson-blocks';

const variantConfig = {
  green: {
    container: 'bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800',
    icon: 'text-emerald-600 dark:text-emerald-400',
    title: 'text-emerald-900 dark:text-emerald-100',
    body: 'text-emerald-800 dark:text-emerald-200',
    Icon: Lightbulb,
  },
  blue: {
    container: 'bg-blue-50 border border-blue-200 dark:bg-blue-950/30 dark:border-blue-800',
    icon: 'text-blue-600 dark:text-blue-400',
    title: 'text-blue-900 dark:text-blue-100',
    body: 'text-blue-800 dark:text-blue-200',
    Icon: Info,
  },
  yellow: {
    container: 'bg-amber-50 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-800',
    icon: 'text-amber-600 dark:text-amber-400',
    title: 'text-amber-900 dark:text-amber-100',
    body: 'text-amber-800 dark:text-amber-200',
    Icon: AlertTriangle,
  },
};

interface CalloutBlockPlayerProps {
  block: CalloutBlock;
}

export function CalloutBlockPlayer({ block }: CalloutBlockPlayerProps) {
  const config = variantConfig[block.variant] ?? variantConfig.blue;
  const { Icon } = config;

  return (
    <div className={`rounded-xl p-5 ${config.container}`}>
      <div className="flex items-start gap-3">
        <Icon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${config.icon}`} />
        <div className="space-y-1">
          {block.title && (
            <p className={`font-semibold text-sm ${config.title}`}>{block.title}</p>
          )}
          {block.body && (
            <p className={`text-sm leading-relaxed ${config.body}`}>{block.body}</p>
          )}
        </div>
      </div>
    </div>
  );
}
