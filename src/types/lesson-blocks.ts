// Block type definitions for lessons

export type BlockType = 'paragraph' | 'video' | 'quiz';

export interface BaseBlock {
  id: string;
  type: BlockType;
  order: number;
}

export interface ParagraphBlock extends BaseBlock {
  type: 'paragraph';
  content: string;
  imageUrl?: string;
}

export interface VideoBlock extends BaseBlock {
  type: 'video';
  videoUrl: string;
  title?: string;
}

export interface QuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
  explanation?: string;
}

export interface QuizBlock extends BaseBlock {
  type: 'quiz';
  question: string;
  options: QuizOption[];
}

export type LessonBlock = ParagraphBlock | VideoBlock | QuizBlock;

// Helper to generate unique block IDs
export function generateBlockId(): string {
  return `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Helper to create new blocks with defaults
export function createBlock(type: BlockType, order: number): LessonBlock {
  const id = generateBlockId();
  
  switch (type) {
    case 'paragraph':
      return { id, type, order, content: '' };
    case 'video':
      return { id, type, order, videoUrl: '', title: '' };
    case 'quiz':
      return {
        id,
        type,
        order,
        question: '',
        options: [
          { id: `opt_1`, text: '', isCorrect: true, explanation: '' },
          { id: `opt_2`, text: '', isCorrect: false, explanation: '' },
        ],
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
    case 'quiz':
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
    case 'quiz':
      return '❓';
  }
}

// Get preview text for a block
export function getBlockPreview(block: LessonBlock, maxLength = 50): string {
  let text = '';
  
  switch (block.type) {
    case 'paragraph':
      text = block.content;
      break;
    case 'video':
      text = block.title || block.videoUrl;
      break;
    case 'quiz':
      text = block.question;
      break;
  }
  
  if (!text) return '(Leeg)';
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}
