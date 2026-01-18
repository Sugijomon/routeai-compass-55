// Block type definitions for lessons

export type BlockType = 'paragraph' | 'video' | 'quiz_mc';

export interface BaseBlock {
  id: string;
  type: BlockType;
  order: number;
}

export interface ParagraphBlock extends BaseBlock {
  type: 'paragraph';
  content: string;
  image_url?: string;
  image_caption?: string;
}

export interface VideoBlock extends BaseBlock {
  type: 'video';
  url: string;
  duration?: number; // seconds
  caption?: string;
  must_watch_full: boolean;
}

export interface QuizBlock extends BaseBlock {
  type: 'quiz_mc';
  question: string;
  options: [string, string, string, string]; // exactly 4 options
  correct_answer: number; // 0-based index
  explanation: string;
  points: number;
  max_attempts: number;
}

export type LessonBlock = ParagraphBlock | VideoBlock | QuizBlock;

// Helper to generate unique block IDs
export function generateBlockId(): string {
  return crypto.randomUUID();
}

// Helper to create new blocks with defaults
export function createBlock(type: BlockType, order: number): LessonBlock {
  const id = generateBlockId();
  
  switch (type) {
    case 'paragraph':
      return { id, type, order, content: '' };
    case 'video':
      return { id, type, order, url: '', must_watch_full: false };
    case 'quiz_mc':
      return {
        id,
        type,
        order,
        question: '',
        options: ['', '', '', ''],
        correct_answer: 0,
        explanation: '',
        points: 10,
        max_attempts: 3,
      };
  }
}

// Get block type label in Dutch
export function getBlockTypeLabel(type: BlockType): string {
  switch (type) {
    case 'paragraph':
      return 'Paragraaf';
    case 'video':
      return 'Video';
    case 'quiz_mc':
      return 'Quiz';
  }
}

// Get block type icon
export function getBlockTypeIcon(type: BlockType): string {
  switch (type) {
    case 'paragraph':
      return '📝';
    case 'video':
      return '🎥';
    case 'quiz_mc':
      return '❓';
  }
}

// Get preview text for a block
export function getBlockPreview(block: LessonBlock, maxLength = 50): string {
  let text = '';
  
  switch (block.type) {
    case 'paragraph':
      text = block.content;
      if (text && text.length > maxLength) {
        return text.substring(0, 100) + '...';
      }
      return text || '(Leeg)';
    case 'video':
      return `Video: ${block.caption || block.url || '(Geen URL)'}`;
    case 'quiz_mc':
      text = block.question;
      if (text && text.length > maxLength) {
        return `Quiz: ${text.substring(0, 50)}...`;
      }
      return text ? `Quiz: ${text}` : 'Quiz: (Geen vraag)';
  }
}
