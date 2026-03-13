import { useState, useEffect, useCallback, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';
import type { LessonBlock, BlockType } from '@/types/lesson-blocks';
import { createBlock } from '@/types/lesson-blocks';

type Lesson = Tables<'lessons'>;

interface UseLessonEditorProps {
  lesson: Lesson | null;
}

interface UseLessonEditorReturn {
  // State
  blocks: LessonBlock[];
  title: string;
  description: string;
  lessonType: string;
  estimatedDuration: number | null;
  passingScore: number;
  isPublished: boolean;
  isSaving: boolean;
  lastSaved: Date | null;
  
  // Actions
  setTitle: (title: string) => void;
  setDescription: (description: string) => void;
  setLessonType: (type: string) => void;
  setEstimatedDuration: (duration: number | null) => void;
  setPassingScore: (score: number) => void;
  setIsPublished: (published: boolean) => void;
  addBlock: (type: BlockType) => LessonBlock;
  updateBlock: (blockId: string, updates: Partial<LessonBlock>) => void;
  deleteBlock: (blockId: string) => void;
  moveBlockUp: (blockId: string) => void;
  moveBlockDown: (blockId: string) => void;
  saveNow: () => Promise<void>;
}

export function useLessonEditor({ lesson }: UseLessonEditorProps): UseLessonEditorReturn {
  const queryClient = useQueryClient();
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Local state
  const [blocks, setBlocks] = useState<LessonBlock[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [lessonType, setLessonType] = useState('standalone');
  const [estimatedDuration, setEstimatedDuration] = useState<number | null>(null);
  const [passingScore, setPassingScore] = useState(80);
  const [isPublished, setIsPublished] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Initialize from lesson
  useEffect(() => {
    if (lesson) {
      const lessonBlocks = Array.isArray(lesson.blocks) 
        ? (lesson.blocks as unknown as LessonBlock[])
        : [];
      setBlocks(lessonBlocks);
      setTitle(lesson.title);
      setDescription(lesson.description || '');
      setLessonType(lesson.lesson_type);
      setEstimatedDuration(lesson.estimated_duration);
      setPassingScore(lesson.passing_score ?? 80);
      setIsPublished(lesson.is_published ?? false);
    }
  }, [lesson]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (data: Partial<Lesson>) => {
      if (!lesson) throw new Error('No lesson to save');
      
      const { error } = await supabase
        .from('lessons')
        .update(data)
        .eq('id', lesson.id);

      if (error) throw error;
    },
    onSuccess: () => {
      setLastSaved(new Date());
      queryClient.invalidateQueries({ queryKey: ['lesson', lesson?.id] });
    },
    onError: (error) => {
      toast.error('Fout bij opslaan: ' + error.message);
    },
  });

  // Debounced save
  const debouncedSave = useCallback((data: Partial<Lesson>) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    setIsSaving(true);
    saveTimeoutRef.current = setTimeout(() => {
      saveMutation.mutate(data, {
        onSettled: () => setIsSaving(false),
      });
    }, 800);
  }, [saveMutation]);

  // Save all current state
  const saveAll = useCallback(() => {
    debouncedSave({
      title,
      description: description || null,
      lesson_type: lessonType,
      estimated_duration: estimatedDuration,
      passing_score: passingScore,
      is_published: isPublished,
      blocks: blocks as unknown as any,
    });
  }, [title, description, lessonType, estimatedDuration, passingScore, isPublished, blocks, debouncedSave]);

  // Immediate save
  const saveNow = useCallback(async () => {
    if (!lesson) return;
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    setIsSaving(true);
    try {
      await saveMutation.mutateAsync({
        title,
        description: description || null,
        lesson_type: lessonType,
        estimated_duration: estimatedDuration,
        passing_score: passingScore,
        is_published: isPublished,
        blocks: blocks as unknown as any,
      });
    } finally {
      setIsSaving(false);
    }
  }, [lesson, title, description, lessonType, estimatedDuration, passingScore, isPublished, blocks, saveMutation]);

  // Update handlers that trigger auto-save
  const handleSetTitle = useCallback((newTitle: string) => {
    setTitle(newTitle);
  }, []);

  const handleSetDescription = useCallback((newDescription: string) => {
    setDescription(newDescription);
  }, []);

  const handleSetLessonType = useCallback((newType: string) => {
    setLessonType(newType);
  }, []);

  const handleSetEstimatedDuration = useCallback((newDuration: number | null) => {
    setEstimatedDuration(newDuration);
  }, []);

  const handleSetPassingScore = useCallback((newScore: number) => {
    setPassingScore(newScore);
  }, []);

  const handleSetIsPublished = useCallback((newPublished: boolean) => {
    setIsPublished(newPublished);
  }, []);

  // Block operations
  const addBlock = useCallback((type: BlockType): LessonBlock => {
    const newBlock = createBlock(type, blocks.length);
    setBlocks(prev => [...prev, newBlock]);
    return newBlock;
  }, [blocks.length]);

  const updateBlock = useCallback((blockId: string, updates: Partial<LessonBlock>) => {
    setBlocks(prev => prev.map(block => 
      block.id === blockId ? { ...block, ...updates } as LessonBlock : block
    ));
  }, []);

  const deleteBlock = useCallback((blockId: string) => {
    setBlocks(prev => {
      const filtered = prev.filter(block => block.id !== blockId);
      // Re-order remaining blocks
      return filtered.map((block, index) => ({ ...block, order: index }));
    });
  }, []);

  const moveBlockUp = useCallback((blockId: string) => {
    setBlocks(prev => {
      const index = prev.findIndex(b => b.id === blockId);
      if (index <= 0) return prev;
      
      const newBlocks = [...prev];
      [newBlocks[index - 1], newBlocks[index]] = [newBlocks[index], newBlocks[index - 1]];
      // Update order property
      return newBlocks.map((block, i) => ({ ...block, order: i }));
    });
  }, []);

  const moveBlockDown = useCallback((blockId: string) => {
    setBlocks(prev => {
      const index = prev.findIndex(b => b.id === blockId);
      if (index < 0 || index >= prev.length - 1) return prev;
      
      const newBlocks = [...prev];
      [newBlocks[index], newBlocks[index + 1]] = [newBlocks[index + 1], newBlocks[index]];
      // Update order property
      return newBlocks.map((block, i) => ({ ...block, order: i }));
    });
  }, []);

  // Auto-save when state changes
  useEffect(() => {
    if (lesson) {
      saveAll();
    }
  }, [title, description, lessonType, estimatedDuration, passingScore, isPublished, blocks]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return {
    blocks,
    title,
    description,
    lessonType,
    estimatedDuration,
    passingScore,
    isPublished,
    isSaving,
    lastSaved,
    setTitle: handleSetTitle,
    setDescription: handleSetDescription,
    setLessonType: handleSetLessonType,
    setEstimatedDuration: handleSetEstimatedDuration,
    setPassingScore: handleSetPassingScore,
    setIsPublished: handleSetIsPublished,
    addBlock,
    updateBlock,
    deleteBlock,
    moveBlockUp,
    moveBlockDown,
    saveNow,
  };
}
