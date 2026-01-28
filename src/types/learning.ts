// Question Type Enum (matches database)
export type QuestionType = 
  | 'multiple_choice'
  | 'multiple_select'
  | 'true_false'
  | 'fill_in'
  | 'essay';

// Question Configuration Types
export interface MultipleChoiceOption {
  id: string;
  text: string;
}

export interface MultipleChoiceConfig {
  options: MultipleChoiceOption[];
  shuffle?: boolean; // Shuffle options for each user
}

export interface MultipleSelectConfig {
  options: MultipleChoiceOption[];
  min_selections?: number;
  max_selections?: number;
  shuffle?: boolean;
}

export interface TrueFalseConfig {
  // No additional config needed
}

export interface FillInConfig {
  placeholder?: string;
  case_sensitive?: boolean;
  accept_variations?: string[]; // Alternative correct answers
}

export interface EssayConfig {
  min_words?: number;
  max_words?: number;
  placeholder?: string;
}

export type QuestionConfig = 
  | MultipleChoiceConfig
  | MultipleSelectConfig
  | TrueFalseConfig
  | FillInConfig
  | EssayConfig;

// Question Answer Types
export interface MultipleChoiceAnswer {
  selected: string; // option id
}

export interface MultipleSelectAnswer {
  selected: string[]; // array of option ids
}

export interface TrueFalseAnswer {
  selected: boolean;
}

export interface FillInAnswer {
  text: string;
}

export interface EssayAnswer {
  text: string;
}

export type QuestionAnswer = 
  | MultipleChoiceAnswer
  | MultipleSelectAnswer
  | TrueFalseAnswer
  | FillInAnswer
  | EssayAnswer;

// Database Models
export interface LearningQuestion {
  id: string;
  lesson_id: string;
  question_type: QuestionType;
  question_text: string;
  question_config: QuestionConfig;
  correct_answer: QuestionAnswer;
  points: number;
  explanation?: string;
  order_index: number;
  is_required: boolean;
  org_id?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface LearningAnswer {
  id: string;
  user_id: string;
  question_id: string;
  lesson_id: string;
  user_answer: QuestionAnswer;
  is_correct?: boolean;
  points_earned: number;
  time_spent_seconds?: number;
  attempt_number: number;
  org_id?: string;
  answered_at: string;
}

// UI Props Types
export interface BaseQuestionProps {
  question: LearningQuestion;
  userAnswer?: QuestionAnswer;
  onAnswer: (answer: QuestionAnswer) => void;
  disabled?: boolean;
  showFeedback?: boolean;
}

// Helper type guards
export function isMultipleChoiceConfig(config: QuestionConfig): config is MultipleChoiceConfig {
  return 'options' in config && !('min_selections' in config);
}

export function isMultipleSelectConfig(config: QuestionConfig): config is MultipleSelectConfig {
  return 'options' in config && 'min_selections' in config || 'max_selections' in config;
}

export function isFillInConfig(config: QuestionConfig): config is FillInConfig {
  return 'placeholder' in config || 'case_sensitive' in config || 'accept_variations' in config;
}

export function isEssayConfig(config: QuestionConfig): config is EssayConfig {
  return 'min_words' in config || 'max_words' in config;
}

// Answer type guards
export function isMultipleChoiceAnswer(answer: QuestionAnswer): answer is MultipleChoiceAnswer {
  return 'selected' in answer && typeof answer.selected === 'string';
}

export function isMultipleSelectAnswer(answer: QuestionAnswer): answer is MultipleSelectAnswer {
  return 'selected' in answer && Array.isArray(answer.selected);
}

export function isTrueFalseAnswer(answer: QuestionAnswer): answer is TrueFalseAnswer {
  return 'selected' in answer && typeof answer.selected === 'boolean';
}

export function isFillInAnswer(answer: QuestionAnswer): answer is FillInAnswer {
  return 'text' in answer;
}

export function isEssayAnswer(answer: QuestionAnswer): answer is EssayAnswer {
  return 'text' in answer;
}
