import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { LearningQuestion, LearningAnswer, QuestionAnswer } from '@/types/learning';
import { toast } from 'sonner';

// Fetch questions for a lesson — student-safe (no correct_answer/explanation)
export function useLessonQuestions(lessonId: string | undefined) {
  return useQuery({
    queryKey: ['lesson-questions', lessonId],
    queryFn: async () => {
      if (!lessonId) return [];
      
      const { data, error } = await supabase
        .rpc('get_lesson_questions_for_student', { p_lesson_id: lessonId });

      if (error) throw error;
      
      // RPC returns jsonb array — parse into typed objects
      const questions = (data || []) as Array<{
        id: string;
        lesson_id: string;
        question_type: string;
        question_text: string;
        question_config: unknown;
        points: number;
        order_index: number;
        is_required: boolean;
        org_id: string | null;
        created_at: string;
        updated_at: string;
      }>;

      return questions.map(q => ({
        ...q,
        question_config: q.question_config as unknown as LearningQuestion['question_config'],
        // correct_answer is intentionally omitted by the RPC
        correct_answer: undefined as unknown as LearningQuestion['correct_answer'],
      })) as LearningQuestion[];
    },
    enabled: !!lessonId,
  });
}

// Fetch user's answers for a lesson
export function useUserAnswers(lessonId: string | undefined, userId: string | null) {
  return useQuery({
    queryKey: ['user-answers', lessonId, userId],
    queryFn: async () => {
      if (!lessonId || !userId) return [];
      
      const { data, error } = await supabase
        .from('learning_answers')
        .select('*')
        .eq('lesson_id', lessonId)
        .eq('user_id', userId)
        .order('answered_at', { ascending: false });

      if (error) throw error;
      
      return (data || []).map(a => ({
        ...a,
        user_answer: a.user_answer as unknown as QuestionAnswer,
      })) as LearningAnswer[];
    },
    enabled: !!lessonId && !!userId,
  });
}

// Submit an answer — server-side validation via RPC
export function useSubmitAnswer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      questionId,
      lessonId,
      answer,
      question,
      timeSpent
    }: {
      questionId: string;
      lessonId: string;
      answer: QuestionAnswer;
      question: LearningQuestion;
      timeSpent?: number;
    }) => {
      const { data, error } = await supabase
        .rpc('check_quiz_answer', {
          p_question_id: questionId,
          p_lesson_id: lessonId,
          p_user_answer: answer as unknown as Json,
          p_time_spent: timeSpent ?? null,
        });

      if (error) throw error;
      
      // RPC returns: { is_correct, points_earned, correct_answer, explanation, attempt_number }
      const result = data as {
        is_correct: boolean | null;
        points_earned: number;
        correct_answer: unknown;
        explanation: string | null;
        attempt_number: number;
      };

      return {
        id: crypto.randomUUID(), // placeholder — actual ID created server-side
        user_id: '',
        question_id: questionId,
        lesson_id: lessonId,
        user_answer: answer,
        is_correct: result.is_correct,
        points_earned: result.points_earned,
        time_spent_seconds: timeSpent,
        attempt_number: result.attempt_number,
        answered_at: new Date().toISOString(),
      } as LearningAnswer;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user-answers', variables.lessonId] });
      
      if (variables.question.question_type === 'essay') {
        toast.success('Antwoord opgeslagen', {
          description: 'Je essay wordt later beoordeeld.'
        });
      } else if (data.is_correct) {
        toast.success('Correct!', {
          description: `Je hebt ${data.points_earned} ${data.points_earned === 1 ? 'punt' : 'punten'} verdiend!`
        });
      } else {
        toast.error('Helaas, dat is niet juist', {
          description: 'Probeer het opnieuw of ga naar de volgende vraag.'
        });
      }
    },
    onError: (error) => {
      console.error('Submit answer error:', error);
      toast.error('Fout bij opslaan', {
        description: 'Kon antwoord niet opslaan. Probeer opnieuw.'
      });
    }
  });
}

// Admin: Create a question
export function useCreateQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (question: Omit<LearningQuestion, 'id' | 'created_at' | 'updated_at'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Niet ingelogd');

      const insertData = {
        lesson_id: question.lesson_id,
        question_type: question.question_type,
        question_text: question.question_text,
        question_config: question.question_config as unknown as Record<string, unknown>,
        correct_answer: question.correct_answer as unknown as Record<string, unknown>,
        points: question.points,
        explanation: question.explanation,
        order_index: question.order_index,
        is_required: question.is_required,
        created_by: user.id
      };

      const { data, error } = await supabase
        .from('learning_questions')
        .insert(insertData as never)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lesson-questions', variables.lesson_id] });
      toast.success('Vraag aangemaakt');
    },
    onError: (error) => {
      console.error('Create question error:', error);
      toast.error('Kon vraag niet aanmaken');
    }
  });
}

// Admin: Update a question
export function useUpdateQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      lessonId: _lessonId,
      updates 
    }: { 
      id: string; 
      lessonId: string;
      updates: Partial<Omit<LearningQuestion, 'id' | 'created_at' | 'updated_at'>> 
    }) => {
      const updateData: Record<string, unknown> = { ...updates };
      if (updates.question_config) {
        updateData.question_config = updates.question_config as unknown as Record<string, unknown>;
      }
      if (updates.correct_answer) {
        updateData.correct_answer = updates.correct_answer as unknown as Record<string, unknown>;
      }

      const { data, error } = await supabase
        .from('learning_questions')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lesson-questions', variables.lessonId] });
      toast.success('Vraag bijgewerkt');
    },
    onError: (error) => {
      console.error('Update question error:', error);
      toast.error('Kon vraag niet bijwerken');
    }
  });
}

// Admin: Delete a question
export function useDeleteQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, lessonId: _lessonId }: { id: string; lessonId: string }) => {
      const { error } = await supabase
        .from('learning_questions')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lesson-questions', variables.lessonId] });
      toast.success('Vraag verwijderd');
    },
    onError: (error) => {
      console.error('Delete question error:', error);
      toast.error('Kon vraag niet verwijderen');
    }
  });
}
