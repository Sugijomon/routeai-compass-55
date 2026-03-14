// Block type definitions for lessons

export type BlockType = 
  | 'paragraph' 
  | 'video' 
  | 'quiz_mc' 
  | 'quiz_ms' 
  | 'quiz_tf' 
  | 'quiz_fill' 
  | 'quiz_essay'
  | 'hero'
  | 'callout'
  | 'key_takeaways'
  | 'section_header'
  | 'download';

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
  image_width?: 'small' | 'medium' | 'full';
  image_align?: 'left' | 'center' | 'right';
  image_frame?: 'none' | 'shadow' | 'rounded' | 'polaroid' | 'border' | 'circle';
}

export interface VideoBlock extends BaseBlock {
  type: 'video';
  url: string;
  duration?: number; // seconds
  caption?: string;
  must_watch_full: boolean;
}

// Quiz - Multiple Choice (single answer)
export interface QuizMCBlock extends BaseBlock {
  type: 'quiz_mc';
  question: string;
  options: [string, string, string, string]; // exactly 4 options
  correct_answer: number; // 0-based index
  explanation: string;
  points: number;
  max_attempts: number;
}

// Quiz - Multiple Select (multiple answers)
export interface QuizMSBlock extends BaseBlock {
  type: 'quiz_ms';
  question: string;
  options: [string, string, string, string]; // exactly 4 options
  correct_answers: number[]; // array of 0-based indices
  explanation: string;
  points: number;
  max_attempts: number;
}

// Quiz - True/False
export interface QuizTFBlock extends BaseBlock {
  type: 'quiz_tf';
  question: string;
  correct_answer: boolean; // true or false
  explanation: string;
  points: number;
  max_attempts: number;
}

// Quiz - Fill-in-the-blank
export interface QuizFillBlock extends BaseBlock {
  type: 'quiz_fill';
  question: string;
  correct_answer: string;
  accept_variations: string[]; // alternative correct answers
  case_sensitive: boolean;
  placeholder: string;
  explanation: string;
  points: number;
  max_attempts: number;
}

// Quiz - Essay (open-ended)
export interface QuizEssayBlock extends BaseBlock {
  type: 'quiz_essay';
  question: string;
  min_words?: number;
  max_words?: number;
  placeholder: string;
  points: number;
  // Essays don't have max_attempts or correct_answer - graded manually
}

// Hero Block - big intro card
export interface HeroBlock extends BaseBlock {
  type: 'hero';
  title: string;
  subtitle?: string;
}

// Callout Block - colored info/warning box
export type CalloutVariant = 'green' | 'blue' | 'yellow';
export interface CalloutBlock extends BaseBlock {
  type: 'callout';
  variant: CalloutVariant;
  title?: string;
  body: string;
}

// Key Takeaways Block - closing bullet card
export interface KeyTakeawaysBlock extends BaseBlock {
  type: 'key_takeaways';
  items: string[];
}

// Section Header Block - visual hierarchy divider
export interface SectionHeaderBlock extends BaseBlock {
  type: 'section_header';
  title: string;
  subtitle?: string;
}

// Download Block - attachable file
export interface DownloadBlock extends BaseBlock {
  type: 'download';
  file_url: string;
  file_name: string;
  file_size?: number;
  file_type?: string;
  label?: string;
  description?: string;
}

// Legacy alias for backward compatibility
export type QuizBlock = QuizMCBlock;

export type LessonBlock = 
  | ParagraphBlock 
  | VideoBlock 
  | QuizMCBlock 
  | QuizMSBlock 
  | QuizTFBlock 
  | QuizFillBlock 
  | QuizEssayBlock
  | HeroBlock
  | CalloutBlock
  | KeyTakeawaysBlock
  | SectionHeaderBlock
  | DownloadBlock;

// ── Topic-based lesson structure (v2) ──

export interface LessonTopic {
  id: string;           // uuid, generated client-side
  title: string;        // displayed as tab label
  order: number;        // 0-based
  blocks: LessonBlock[]; // all existing block types
}

export interface LessonContent {
  version: 2;
  topics: LessonTopic[];
}

// Parse lesson content safely — handles both legacy flat arrays and new topic structure
export function parseLessonContent(raw: unknown): LessonTopic[] {
  // New format: { version: 2, topics: [...] }
  if (raw && typeof raw === 'object' && 'topics' in (raw as object)) {
    const content = raw as LessonContent;
    return content.topics || [];
  }

  // Legacy format: flat array of blocks → migrate on the fly
  if (Array.isArray(raw)) {
    return (raw as LessonBlock[]).map((block, index) => ({
      id: `migrated-${block.id || index}`,
      title: getLegacyTopicTitle(block, index),
      order: index,
      blocks: [block],
    }));
  }

  return [];
}

function getLegacyTopicTitle(block: LessonBlock, index: number): string {
  switch (block.type) {
    case 'section_header': return (block as any).title || `Onderwerp ${index + 1}`;
    case 'hero': return (block as any).title || `Onderwerp ${index + 1}`;
    case 'quiz_mc':
    case 'quiz_ms':
    case 'quiz_tf':
    case 'quiz_fill':
    case 'quiz_essay': return 'Oefenvraag';
    case 'video': return 'Video';
    default: return `Onderwerp ${index + 1}`;
  }
}

export function serializeLessonContent(topics: LessonTopic[]): object {
  return { version: 2, topics };
}

export function flattenTopicBlocks(topics: LessonTopic[]): LessonBlock[] {
  return topics.flatMap(t => t.blocks);
}

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
    case 'quiz_ms':
      return {
        id,
        type,
        order,
        question: '',
        options: ['', '', '', ''],
        correct_answers: [0],
        explanation: '',
        points: 10,
        max_attempts: 3,
      };
    case 'quiz_tf':
      return {
        id,
        type,
        order,
        question: '',
        correct_answer: true,
        explanation: '',
        points: 10,
        max_attempts: 3,
      };
    case 'quiz_fill':
      return {
        id,
        type,
        order,
        question: '',
        correct_answer: '',
        accept_variations: [],
        case_sensitive: false,
        placeholder: 'Vul hier je antwoord in...',
        explanation: '',
        points: 10,
        max_attempts: 3,
      };
    case 'quiz_essay':
      return {
        id,
        type,
        order,
        question: '',
        min_words: undefined,
        max_words: undefined,
        placeholder: 'Schrijf hier je antwoord...',
        points: 20,
      };
    case 'hero':
      return { id, type, order, title: '', subtitle: '' };
    case 'callout':
      return { id, type, order, variant: 'blue', title: '', body: '' };
    case 'key_takeaways':
      return { id, type, order, items: [''] };
    case 'section_header':
      return { id, type, order, title: '', subtitle: '' };
  }
}

// Get block type label in Dutch
export function getBlockTypeLabel(type: BlockType): string {
  switch (type) {
    case 'paragraph': return 'Paragraaf';
    case 'video': return 'Video';
    case 'quiz_mc': return 'Quiz - Multiple Choice';
    case 'quiz_ms': return 'Quiz - Multiple Select';
    case 'quiz_tf': return 'Quiz - Waar/Onwaar';
    case 'quiz_fill': return 'Quiz - Invulvraag';
    case 'quiz_essay': return 'Quiz - Essay';
    case 'hero': return 'Hero';
    case 'callout': return 'Callout';
    case 'key_takeaways': return 'Kernpunten';
    case 'section_header': return 'Sectietitel';
  }
}

// Get block type icon
export function getBlockTypeIcon(type: BlockType): string {
  switch (type) {
    case 'paragraph': return '📝';
    case 'video': return '🎥';
    case 'quiz_mc': return '🔘';
    case 'quiz_ms': return '☑️';
    case 'quiz_tf': return '✅';
    case 'quiz_fill': return '✏️';
    case 'quiz_essay': return '📄';
    case 'hero': return '🌟';
    case 'callout': return '💡';
    case 'key_takeaways': return '📌';
    case 'section_header': return '📋';
  }
}

// Check if block type is a quiz
export function isQuizBlock(type: BlockType): boolean {
  return type.startsWith('quiz_');
}

// Get preview text for a block
export function getBlockPreview(block: LessonBlock, maxLength = 50): string {
  switch (block.type) {
    case 'paragraph': {
      const text = block.content;
      return text && text.length > maxLength ? text.substring(0, 100) + '...' : text || '(Leeg)';
    }
    case 'video':
      return `Video: ${block.caption || block.url || '(Geen URL)'}`;
    case 'quiz_mc':
    case 'quiz_ms':
    case 'quiz_tf':
    case 'quiz_fill':
    case 'quiz_essay': {
      const text = block.question;
      const label = getBlockTypeLabel(block.type);
      return text && text.length > maxLength
        ? `${label}: ${text.substring(0, 50)}...`
        : text ? `${label}: ${text}` : `${label}: (Geen vraag)`;
    }
    case 'hero':
      return `Hero: ${block.title || '(Geen titel)'}`;
    case 'callout':
      return `Callout [${block.variant}]: ${block.title || block.body || '(Leeg)'}`;
    case 'key_takeaways':
      return `Kernpunten: ${block.items.length} item(s)`;
    case 'section_header':
      return `Sectietitel: ${block.title || '(Geen titel)'}`;
  }
}
