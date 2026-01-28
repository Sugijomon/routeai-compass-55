import { 
  LearningQuestion, 
  QuestionAnswer, 
  MultipleChoiceAnswer, 
  MultipleSelectAnswer, 
  TrueFalseAnswer, 
  FillInAnswer, 
  FillInConfig 
} from '@/types/learning';

export interface ValidationResult {
  isCorrect: boolean;
  pointsEarned: number;
}

export function validateAnswer(
  question: LearningQuestion,
  userAnswer: QuestionAnswer
): ValidationResult {
  let isCorrect = false;

  switch (question.question_type) {
    case 'multiple_choice':
      isCorrect = validateMultipleChoice(
        question.correct_answer as MultipleChoiceAnswer,
        userAnswer as MultipleChoiceAnswer
      );
      break;

    case 'multiple_select':
      isCorrect = validateMultipleSelect(
        question.correct_answer as MultipleSelectAnswer,
        userAnswer as MultipleSelectAnswer
      );
      break;

    case 'true_false':
      isCorrect = validateTrueFalse(
        question.correct_answer as TrueFalseAnswer,
        userAnswer as TrueFalseAnswer
      );
      break;

    case 'fill_in':
      isCorrect = validateFillIn(
        question.correct_answer as FillInAnswer,
        userAnswer as FillInAnswer,
        question.question_config as FillInConfig
      );
      break;

    case 'essay':
      // Essays require manual grading - always return false initially
      // Will be set by instructor during review
      isCorrect = false;
      break;
  }

  const pointsEarned = isCorrect ? question.points : 0;

  return { isCorrect, pointsEarned };
}

function validateMultipleChoice(
  correct: MultipleChoiceAnswer,
  user: MultipleChoiceAnswer
): boolean {
  return correct.selected === user.selected;
}

function validateMultipleSelect(
  correct: MultipleSelectAnswer,
  user: MultipleSelectAnswer
): boolean {
  if (!correct.selected || !user.selected) return false;
  if (correct.selected.length !== user.selected.length) return false;
  
  const sortedCorrect = [...correct.selected].sort();
  const sortedUser = [...user.selected].sort();
  
  return sortedCorrect.every((val, index) => val === sortedUser[index]);
}

function validateTrueFalse(
  correct: TrueFalseAnswer,
  user: TrueFalseAnswer
): boolean {
  return correct.selected === user.selected;
}

function validateFillIn(
  correct: FillInAnswer,
  user: FillInAnswer,
  config: FillInConfig
): boolean {
  if (!correct.text || !user.text) return false;
  
  let correctText = correct.text;
  let userText = user.text;

  // Handle case sensitivity
  if (!config?.case_sensitive) {
    correctText = correctText.toLowerCase().trim();
    userText = userText.toLowerCase().trim();
  } else {
    correctText = correctText.trim();
    userText = userText.trim();
  }

  // Check exact match
  if (correctText === userText) return true;

  // Check variations
  if (config?.accept_variations && Array.isArray(config.accept_variations)) {
    const variations = config.accept_variations.map(v => 
      config.case_sensitive ? v.trim() : v.toLowerCase().trim()
    );
    return variations.includes(userText);
  }

  return false;
}

// Utility function to check if an essay meets word count requirements
export function validateEssayWordCount(
  text: string,
  minWords?: number,
  maxWords?: number
): { isValid: boolean; wordCount: number; error?: string } {
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  
  if (minWords && wordCount < minWords) {
    return { 
      isValid: false, 
      wordCount, 
      error: `Minimaal ${minWords} woorden vereist` 
    };
  }
  
  if (maxWords && wordCount > maxWords) {
    return { 
      isValid: false, 
      wordCount, 
      error: `Maximaal ${maxWords} woorden toegestaan` 
    };
  }
  
  return { isValid: true, wordCount };
}
