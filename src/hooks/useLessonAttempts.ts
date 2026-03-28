import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface LessonAttempt {
  id: string;
  user_id: string;
  lesson_id: string;
  attempt_number: number;
  score: number | null;
  max_score: number | null;
  percentage: number | null;
  passed: boolean;
  time_spent: number | null;
  started_at: string;
  completed_at: string | null;
}

interface UseLessonAttemptsProps {
  lessonId: string;
  userId: string | null;
}

export function useLessonAttempts({ lessonId, userId }: UseLessonAttemptsProps) {
  const queryClient = useQueryClient();
  const [currentAttemptId, setCurrentAttemptId] = useState<string | null>(null);

  // Fetch all attempts for this lesson
  const { data: attempts = [], isLoading } = useQuery({
    queryKey: ['lesson-attempts', lessonId, userId],
    queryFn: async () => {
      if (!userId || !lessonId) return [];
      
      const { data, error } = await supabase
        .from('lesson_attempts')
        .select('*')
        .eq('user_id', userId)
        .eq('lesson_id', lessonId)
        .order('attempt_number', { ascending: true });

      if (error) throw error;
      return data as LessonAttempt[];
    },
    enabled: !!userId && !!lessonId,
  });

  // Get current attempt number (highest + 1 if no current active, or current active)
  const currentAttemptNumber = attempts.length > 0 
    ? (attempts.find(a => !a.completed_at)?.attempt_number ?? attempts.length + 1)
    : 1;

  // Get the active (incomplete) attempt
  const activeAttempt = attempts.find(a => !a.completed_at);

  // Start a new attempt
  const startAttemptMutation = useMutation({
    mutationFn: async () => {
      if (!userId || !lessonId) throw new Error('Missing user or lesson ID');

      const attemptNumber = attempts.filter(a => a.completed_at).length + 1;
      
      console.log('Starting new attempt:', { attemptNumber, lessonId, userId });

      const { data, error } = await supabase
        .from('lesson_attempts')
        .insert({
          user_id: userId,
          lesson_id: lessonId,
          attempt_number: attemptNumber,
          started_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data as LessonAttempt;
    },
    onSuccess: (data) => {
      setCurrentAttemptId(data.id);
      queryClient.invalidateQueries({ queryKey: ['lesson-attempts', lessonId, userId] });
    },
  });

  // Complete current attempt
  const completeAttemptMutation = useMutation({
    mutationFn: async (params: {
      attemptId: string;
      score: number;
      maxScore: number;
      percentage: number;
      passed: boolean;
      timeSpent: number;
    }) => {
      console.log('Completing attempt:', params);

      const { data, error } = await supabase
        .from('lesson_attempts')
        .update({
          score: params.score,
          max_score: params.maxScore,
          percentage: params.percentage,
          passed: params.passed,
          time_spent: params.timeSpent,
          completed_at: new Date().toISOString(),
        })
        .eq('id', params.attemptId)
        .select()
        .single();

      if (error) throw error;
      return data as LessonAttempt;
    },
    onSuccess: () => {
      setCurrentAttemptId(null);
      queryClient.invalidateQueries({ queryKey: ['lesson-attempts', lessonId, userId] });
    },
  });

  // Start new attempt (for retries)
  const startNewAttempt = useCallback(async () => {
    const result = await startAttemptMutation.mutateAsync();
    return result;
  }, [startAttemptMutation]);

  // Complete current attempt
  const completeCurrentAttempt = useCallback(async (params: {
    score: number;
    maxScore: number;
    percentage: number;
    passed: boolean;
    timeSpent: number;
  }) => {
    const attemptId = currentAttemptId || activeAttempt?.id;
    if (!attemptId) {
      console.error('No active attempt to complete');
      return null;
    }

    const result = await completeAttemptMutation.mutateAsync({
      attemptId,
      ...params,
    });
    return result;
  }, [currentAttemptId, activeAttempt, completeAttemptMutation]);

  // Initialize: start attempt if none exists or all are completed
  useEffect(() => {
    if (!userId || !lessonId || isLoading) return;

    // If no active attempt exists and we haven't started one yet
    if (!activeAttempt && !currentAttemptId && !startAttemptMutation.isPending) {
      console.log('No active attempt, starting new one...');
      startAttemptMutation.mutate();
    } else if (activeAttempt && !currentAttemptId) {
      // Resume existing attempt
      console.log('Resuming existing attempt:', activeAttempt.attempt_number);
      setCurrentAttemptId(activeAttempt.id);
    }
  }, [userId, lessonId, isLoading, activeAttempt, currentAttemptId, startAttemptMutation]);

  // Get completed attempts only
  const completedAttempts = attempts.filter(a => a.completed_at);

  // Failed attempts (completed but not passed)
  const failedAttempts = completedAttempts.filter(a => !a.passed);

  // Has user ever passed?
  const hasPassedBefore = completedAttempts.some(a => a.passed);

  // Blocked after 3 failed attempts without ever passing
  const isBlocked = !hasPassedBefore && failedAttempts.length >= 3;

  // Best attempt (highest percentage)
  const bestAttempt = completedAttempts.length > 0
    ? completedAttempts.reduce((best, current) => 
        (current.percentage ?? 0) > (best.percentage ?? 0) ? current : best
      )
    : null;

  // Passing attempt (first one that passed)
  const passingAttempt = completedAttempts.find(a => a.passed);

  return {
    attempts,
    completedAttempts,
    failedAttempts,
    activeAttempt,
    currentAttemptId,
    currentAttemptNumber: activeAttempt?.attempt_number ?? currentAttemptNumber,
    bestAttempt,
    passingAttempt,
    hasPassedBefore,
    isBlocked,
    attemptCount: completedAttempts.length,
    isLoading,
    startNewAttempt,
    completeCurrentAttempt,
    isStarting: startAttemptMutation.isPending,
    isCompleting: completeAttemptMutation.isPending,
  };
}
