import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { LessonTopic, flattenTopicBlocks } from '@/types/lesson-blocks';
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
  topics: LessonTopic[];
}

interface UseLessonProgressReturn {
  currentTopicIndex: number;
  blocksCompleted: string[];
  progressPercentage: number;
  quizAttempts: Record<string, number>;
  quizResults: Record<string, { correct: boolean; points: number }>;
  startedAt: string | null;
  isLoading: boolean;
  goToTopic: (index: number) => void;
  markBlockCompleted: (blockId: string) => void;
  goNext: () => void;
  goPrevious: () => void;
  canGoNext: boolean;
  canGoPrevious: boolean;
  isLastTopic: boolean;
  incrementQuizAttempt: (blockId: string) => void;
  recordQuizResult: (blockId: string, correct: boolean, points: number) => void;
  calculateFinalScore: () => { earnedPoints: number; maxPoints: number; percentage: number };
  // Legacy compat aliases
  currentBlockIndex: number;
  goToBlock: (index: number) => void;
  isLastBlock: boolean;
}

export function useLessonProgress({ lessonId, topics }: UseLessonProgressProps): UseLessonProgressReturn {
  const [userId, setUserId] = useState<string | null>(null);
  const [progressData, setProgressData] = useState<LessonProgressData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const initialLoadComplete = useRef(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSaveRef = useRef<Partial<LessonProgressData> | null>(null);

  // Flat blocks for progress tracking
  const allBlocks = flattenTopicBlocks(topics);
  const totalTopics = topics.length;

  // Get the actual authenticated user from Supabase
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id ?? null);
    };
    getUser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUserId(session?.user?.id ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);
  
  const [currentTopicIndex, setCurrentTopicIndex] = useState<number>(0);

  // Initialize currentTopicIndex from progressData ONCE when the record first loads
  useEffect(() => {
    if (progressData !== null && progressData !== undefined) {
      setCurrentTopicIndex(progressData.current_block_index ?? 0);
    }
  }, [progressData?.id]);

  const blocksCompleted = progressData?.blocks_completed ?? [];
  const quizAttempts = progressData?.quiz_attempts ?? {};
  const quizResults = progressData?.quiz_results ?? {};
  const startedAt = progressData?.started_at ?? null;
  const progressPercentage = allBlocks.length > 0 
    ? Math.round((blocksCompleted.length / allBlocks.length) * 100) 
    : 0;

  // Check if this is a retry
  const [isRetryHandled, setIsRetryHandled] = useState(false);
  const isRetry = typeof window !== 'undefined' && 
    new URLSearchParams(window.location.search).get('retry') === 'true' &&
    !isRetryHandled;

  // Load or create progress record
  useEffect(() => {
    async function loadProgress() {
      if (initialLoadComplete.current && !isRetry) return;
      if (!userId || !lessonId) {
        setIsLoading(false);
        return;
      }

      try {
        const { data: existing, error: fetchError } = await supabase
          .from('user_lesson_progress')
          .select('*')
          .eq('user_id', userId)
          .eq('lesson_id', lessonId)
          .maybeSingle();

        if (fetchError) throw fetchError;

        if (isRetry && existing) {
          const newStartedAt = new Date().toISOString();
          setProgressData({
            ...existing,
            current_block_index: 0,
            blocks_completed: [],
            progress_percentage: 0,
            quiz_attempts: {},
            quiz_results: {},
            started_at: newStartedAt,
          });
          await supabase
            .from('user_lesson_progress')
            .update({
              current_block_index: 0,
              blocks_completed: [],
              progress_percentage: 0,
              quiz_attempts: {},
              started_at: newStartedAt,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existing.id);
          setIsRetryHandled(true);
          const url = new URL(window.location.href);
          url.searchParams.delete('retry');
          window.history.replaceState({}, '', url.toString());
          initialLoadComplete.current = true;
          setIsLoading(false);
          return;
        }

        if (existing) {
          const rawQuizData = (existing.quiz_attempts as Record<string, unknown>) ?? {};
          const attempts: Record<string, number> = {};
          const results: Record<string, { correct: boolean; points: number }> = {};
          Object.entries(rawQuizData).forEach(([key, value]) => {
            if (key.startsWith('result_') && typeof value === 'object' && value !== null) {
              const blockId = key.replace('result_', '');
              results[blockId] = value as { correct: boolean; points: number };
            } else if (typeof value === 'number') {
              attempts[key] = value;
            }
          });
          setProgressData({
            ...existing,
            blocks_completed: Array.isArray(existing.blocks_completed) 
              ? existing.blocks_completed as string[]
              : [],
            quiz_attempts: attempts,
            quiz_results: results,
          });
        } else {
          const newProgress = {
            user_id: userId,
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
        initialLoadComplete.current = true;
      } catch (error) {
        console.error('Error loading lesson progress:', error);
        toast.error('Kon voortgang niet laden');
      } finally {
        setIsLoading(false);
      }
    }
    loadProgress();
  }, [userId, lessonId, isRetry]);

  // Handle tab visibility
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (pendingSaveRef.current && progressData?.id) {
          flushSave();
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [progressData?.id]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      if (pendingSaveRef.current && progressData?.id) flushSave();
    };
  }, [progressData?.id]);

  const buildCombinedQuizData = useCallback((
    attempts: Record<string, number>,
    results: Record<string, { correct: boolean; points: number }>
  ) => {
    const combined: Record<string, unknown> = { ...attempts };
    Object.entries(results).forEach(([blockId, result]) => {
      combined[`result_${blockId}`] = result;
    });
    return combined;
  }, []);

  const flushSave = useCallback(async () => {
    if (!userId || !lessonId || !pendingSaveRef.current) return;
    const updates = pendingSaveRef.current;
    pendingSaveRef.current = null;
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    try {
      const { error } = await supabase
        .from('user_lesson_progress')
        .upsert({
          user_id: userId,
          lesson_id: lessonId,
          ...updates,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id,lesson_id' });
      if (error) throw error;
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  }, [userId, lessonId]);

  const saveProgress = useCallback(async (updates: Partial<LessonProgressData>) => {
    if (!userId || !lessonId) return;
    pendingSaveRef.current = { ...pendingSaveRef.current, ...updates };
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      if (!pendingSaveRef.current) return;
      const toSave = pendingSaveRef.current;
      pendingSaveRef.current = null;
      try {
        const { error } = await supabase
          .from('user_lesson_progress')
          .upsert({
            user_id: userId,
            lesson_id: lessonId,
            ...toSave,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id,lesson_id' });
        if (error) throw error;
      } catch (error) {
        console.error('Error saving progress:', error);
      }
    }, 800);
  }, [userId, lessonId]);

  // Auto-save every 10 seconds
  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      if (pendingSaveRef.current && progressData?.id) flushSave();
    }, 10000);
    return () => clearInterval(autoSaveInterval);
  }, [progressData?.id, flushSave]);

  const goToTopic = useCallback((index: number) => {
    if (index < 0 || index >= totalTopics) return;
    setCurrentTopicIndex(index);
    setProgressData(prev => {
      if (!prev) {
        saveProgress({ current_block_index: index });
        return {
          id: '', user_id: '', lesson_id: lessonId,
          current_block_index: index, blocks_completed: [],
          progress_percentage: 0, quiz_attempts: {}, quiz_results: {},
          started_at: new Date().toISOString(), updated_at: new Date().toISOString(),
        };
      }
      saveProgress({ current_block_index: index });
      return { ...prev, current_block_index: index };
    });
  }, [totalTopics, lessonId, saveProgress]);

  const markBlockCompleted = useCallback((blockId: string) => {
    setProgressData(prev => {
      if (!prev) return prev;
      if (prev.blocks_completed.includes(blockId)) return prev;
      const newBlocksCompleted = [...prev.blocks_completed, blockId];
      const newPercentage = allBlocks.length > 0 
        ? Math.round((newBlocksCompleted.length / allBlocks.length) * 100) 
        : 0;
      saveProgress({ blocks_completed: newBlocksCompleted, progress_percentage: newPercentage });
      return { ...prev, blocks_completed: newBlocksCompleted, progress_percentage: newPercentage };
    });
  }, [allBlocks.length, saveProgress]);

  const incrementQuizAttempt = useCallback((blockId: string) => {
    setProgressData(prev => {
      if (!prev) return prev;
      const currentAttempts = prev.quiz_attempts[blockId] ?? 0;
      const newQuizAttempts = { ...prev.quiz_attempts, [blockId]: currentAttempts + 1 };
      const updated = { ...prev, quiz_attempts: newQuizAttempts };
      const combinedData = buildCombinedQuizData(newQuizAttempts, prev.quiz_results);
      saveProgress({ quiz_attempts: combinedData as unknown as Record<string, number> });
      return updated;
    });
  }, [saveProgress, buildCombinedQuizData]);

  const recordQuizResult = useCallback((blockId: string, correct: boolean, points: number) => {
    setProgressData(prev => {
      if (!prev) return prev;
      if (prev.quiz_results[blockId]) return prev;
      const newQuizResults = { ...prev.quiz_results, [blockId]: { correct, points } };
      const updated = { ...prev, quiz_results: newQuizResults };
      const combinedData = buildCombinedQuizData(prev.quiz_attempts, newQuizResults);
      saveProgress({ quiz_attempts: combinedData as unknown as Record<string, number> });
      return updated;
    });
  }, [saveProgress, buildCombinedQuizData]);

  const calculateFinalScore = useCallback(() => {
    const quizBlocks = allBlocks.filter(b => b.type.startsWith('quiz_'));
    if (quizBlocks.length === 0) return { earnedPoints: 0, maxPoints: 0, percentage: 100 };
    const maxPoints = quizBlocks.reduce((sum, block) => {
      if ('points' in block) return sum + (block as any).points;
      return sum;
    }, 0);
    const earnedPoints = Object.values(quizResults).reduce((sum, result) => sum + result.points, 0);
    const percentage = maxPoints > 0 ? Math.round((earnedPoints / maxPoints) * 100) : 100;
    return { earnedPoints, maxPoints, percentage };
  }, [allBlocks, quizResults]);

  const goNext = useCallback(() => {
    if (currentTopicIndex < totalTopics - 1) {
      // Mark all blocks in current topic as completed
      const currentTopic = topics[currentTopicIndex];
      if (currentTopic) {
        currentTopic.blocks.forEach(b => markBlockCompleted(b.id));
      }
      goToTopic(currentTopicIndex + 1);
    }
  }, [currentTopicIndex, totalTopics, topics, markBlockCompleted, goToTopic]);

  const goPrevious = useCallback(() => {
    if (currentTopicIndex > 0) {
      goToTopic(currentTopicIndex - 1);
    }
  }, [currentTopicIndex, goToTopic]);

  const canGoPrevious = currentTopicIndex > 0;
  const canGoNext = currentTopicIndex < totalTopics - 1;
  const isLastTopic = currentTopicIndex === totalTopics - 1;

  return {
    currentTopicIndex,
    blocksCompleted,
    progressPercentage,
    quizAttempts,
    quizResults,
    startedAt,
    isLoading,
    goToTopic,
    markBlockCompleted,
    goNext,
    goPrevious,
    canGoNext,
    canGoPrevious,
    isLastTopic,
    incrementQuizAttempt,
    recordQuizResult,
    calculateFinalScore,
    // Legacy compat
    currentBlockIndex: currentTopicIndex,
    goToBlock: goToTopic,
    isLastBlock: isLastTopic,
  };
}
