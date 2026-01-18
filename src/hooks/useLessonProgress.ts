import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAppStore } from '@/stores/useAppStore';
import { LessonBlock } from '@/types/lesson-blocks';
import { toast } from 'sonner';

interface LessonProgressData {
  id: string;
  user_id: string;
  lesson_id: string;
  current_block_index: number;
  blocks_completed: string[];
  progress_percentage: number;
  quiz_attempts: Record<string, number>;
  quiz_results: Record<string, { correct: boolean; points: number }>;
  started_at: string;
  updated_at: string;
}

interface UseLessonProgressProps {
  lessonId: string;
  blocks: LessonBlock[];
}

interface UseLessonProgressReturn {
  currentBlockIndex: number;
  blocksCompleted: string[];
  progressPercentage: number;
  quizAttempts: Record<string, number>;
  quizResults: Record<string, { correct: boolean; points: number }>;
  isLoading: boolean;
  goToBlock: (index: number) => void;
  markBlockCompleted: (blockId: string) => void;
  goNext: () => void;
  goPrevious: () => void;
  canGoNext: boolean;
  canGoPrevious: boolean;
  isLastBlock: boolean;
  incrementQuizAttempt: (blockId: string) => void;
  recordQuizResult: (blockId: string, correct: boolean, points: number) => void;
  calculateFinalScore: () => { earnedPoints: number; maxPoints: number; percentage: number };
}

export function useLessonProgress({ lessonId, blocks }: UseLessonProgressProps): UseLessonProgressReturn {
  const getCurrentUser = useAppStore(state => state.getCurrentUser);
  const currentUser = getCurrentUser();
  const [progressData, setProgressData] = useState<LessonProgressData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const totalBlocks = blocks.length;
  const currentBlockIndex = progressData?.current_block_index ?? 0;
  const blocksCompleted = progressData?.blocks_completed ?? [];
  const quizAttempts = progressData?.quiz_attempts ?? {};
  const quizResults = progressData?.quiz_results ?? {};
  const progressPercentage = totalBlocks > 0 
    ? Math.round((blocksCompleted.length / totalBlocks) * 100) 
    : 0;

  // Load or create progress record
  useEffect(() => {
    async function loadProgress() {
      if (!currentUser?.id || !lessonId) {
        setIsLoading(false);
        return;
      }

      try {
        // Try to fetch existing progress
        const { data: existing, error: fetchError } = await supabase
          .from('user_lesson_progress')
          .select('*')
          .eq('user_id', currentUser.id)
          .eq('lesson_id', lessonId)
          .maybeSingle();

        if (fetchError) throw fetchError;

        if (existing) {
          setProgressData({
            ...existing,
            blocks_completed: Array.isArray(existing.blocks_completed) 
              ? existing.blocks_completed as string[]
              : [],
            quiz_attempts: (existing.quiz_attempts as Record<string, number>) ?? {},
            quiz_results: (existing.quiz_attempts as Record<string, { correct: boolean; points: number }>) ?? {},
          });
        } else {
          // Create new progress record
          const newProgress = {
            user_id: currentUser.id,
            lesson_id: lessonId,
            current_block_index: 0,
            blocks_completed: [],
            progress_percentage: 0,
            quiz_attempts: {},
          };

          const { data: created, error: createError } = await supabase
            .from('user_lesson_progress')
            .insert(newProgress)
            .select()
            .single();

          if (createError) throw createError;

          setProgressData({
            ...created,
            blocks_completed: [],
            quiz_attempts: {},
            quiz_results: {},
          });
        }
      } catch (error) {
        console.error('Error loading lesson progress:', error);
        toast.error('Kon voortgang niet laden');
      } finally {
        setIsLoading(false);
      }
    }

    loadProgress();
  }, [currentUser?.id, lessonId]);

  // Save progress to database
  const saveProgress = useCallback(async (updates: Partial<LessonProgressData>) => {
    if (!progressData?.id) return;

    try {
      const { error } = await supabase
        .from('user_lesson_progress')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', progressData.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  }, [progressData?.id]);

  const goToBlock = useCallback((index: number) => {
    if (index < 0 || index >= totalBlocks) return;
    
    setProgressData(prev => {
      if (!prev) return prev;
      const updated = { ...prev, current_block_index: index };
      saveProgress({ current_block_index: index });
      return updated;
    });
  }, [totalBlocks, saveProgress]);

  const markBlockCompleted = useCallback((blockId: string) => {
    setProgressData(prev => {
      if (!prev) return prev;
      
      // Don't add duplicates
      if (prev.blocks_completed.includes(blockId)) return prev;
      
      const newBlocksCompleted = [...prev.blocks_completed, blockId];
      const newPercentage = Math.round((newBlocksCompleted.length / totalBlocks) * 100);
      
      const updated = {
        ...prev,
        blocks_completed: newBlocksCompleted,
        progress_percentage: newPercentage,
      };
      
      saveProgress({ 
        blocks_completed: newBlocksCompleted,
        progress_percentage: newPercentage,
      });
      
      return updated;
    });
  }, [totalBlocks, saveProgress]);

  const incrementQuizAttempt = useCallback((blockId: string) => {
    setProgressData(prev => {
      if (!prev) return prev;
      
      const currentAttempts = prev.quiz_attempts[blockId] ?? 0;
      const newQuizAttempts = {
        ...prev.quiz_attempts,
        [blockId]: currentAttempts + 1,
      };
      
      const updated = { ...prev, quiz_attempts: newQuizAttempts };
      saveProgress({ quiz_attempts: newQuizAttempts });
      return updated;
    });
  }, [saveProgress]);

  const recordQuizResult = useCallback((blockId: string, correct: boolean, points: number) => {
    setProgressData(prev => {
      if (!prev) return prev;
      
      // Don't overwrite existing results
      if (prev.quiz_results[blockId]) return prev;
      
      const newQuizResults = {
        ...prev.quiz_results,
        [blockId]: { correct, points },
      };
      
      const updated = { ...prev, quiz_results: newQuizResults };
      // Store quiz results in quiz_attempts field (we're reusing the JSONB field)
      return updated;
    });
  }, []);

  const calculateFinalScore = useCallback(() => {
    // Find all quiz blocks
    const quizBlocks = blocks.filter(b => b.type === 'quiz_mc');
    
    if (quizBlocks.length === 0) {
      return { earnedPoints: 0, maxPoints: 0, percentage: 100 };
    }
    
    const maxPoints = quizBlocks.reduce((sum, block) => {
      if (block.type === 'quiz_mc') {
        return sum + block.points;
      }
      return sum;
    }, 0);
    
    const earnedPoints = Object.values(quizResults).reduce((sum, result) => {
      return sum + result.points;
    }, 0);
    
    const percentage = maxPoints > 0 ? Math.round((earnedPoints / maxPoints) * 100) : 100;
    
    return { earnedPoints, maxPoints, percentage };
  }, [blocks, quizResults]);

  const goNext = useCallback(() => {
    const currentBlock = blocks[currentBlockIndex];
    if (currentBlock) {
      markBlockCompleted(currentBlock.id);
    }
    goToBlock(currentBlockIndex + 1);
  }, [currentBlockIndex, blocks, markBlockCompleted, goToBlock]);

  const goPrevious = useCallback(() => {
    goToBlock(currentBlockIndex - 1);
  }, [currentBlockIndex, goToBlock]);

  const canGoPrevious = currentBlockIndex > 0;
  const canGoNext = currentBlockIndex < totalBlocks - 1;
  const isLastBlock = currentBlockIndex === totalBlocks - 1;

  return {
    currentBlockIndex,
    blocksCompleted,
    progressPercentage,
    quizAttempts,
    quizResults,
    isLoading,
    goToBlock,
    markBlockCompleted,
    goNext,
    goPrevious,
    canGoNext,
    canGoPrevious,
    isLastBlock,
    incrementQuizAttempt,
    recordQuizResult,
    calculateFinalScore,
  };
}
