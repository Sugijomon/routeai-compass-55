import { useState, useEffect, useCallback, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';
import type { LessonBlock, BlockType, LessonTopic } from '@/types/lesson-blocks';
import { createBlock, parseLessonContent, serializeLessonContent, generateBlockId } from '@/types/lesson-blocks';

type Lesson = Tables<'lessons'>;

interface UseLessonEditorProps {
  lesson: Lesson | null;
}

interface UseLessonEditorReturn {
  // State
  topics: LessonTopic[];
  blocks: LessonBlock[]; // flat view for backward compat
  title: string;
  description: string;
  lessonType: string;
  estimatedDuration: number | null;
  passingScore: number;
  isPublished: boolean;
  isSaving: boolean;
  lastSaved: Date | null;
  
  // Topic actions
  addTopic: (topicTitle?: string) => LessonTopic;
  updateTopicTitle: (topicId: string, title: string) => void;
  deleteTopic: (topicId: string) => void;
  moveTopicUp: (topicId: string) => void;
  moveTopicDown: (topicId: string) => void;
  
  // Metadata actions
  setTitle: (title: string) => void;
  setDescription: (description: string) => void;
  setLessonType: (type: string) => void;
  setEstimatedDuration: (duration: number | null) => void;
  setPassingScore: (score: number) => void;
  setIsPublished: (published: boolean) => void;

  // Block actions (operate within the first topic for backward compat)
  addBlock: (type: BlockType, topicId?: string) => LessonBlock;
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
  const [topics, setTopics] = useState<LessonTopic[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [lessonType, setLessonType] = useState('standalone');
  const [estimatedDuration, setEstimatedDuration] = useState<number | null>(null);
  const [passingScore, setPassingScore] = useState(80);
  const [isPublished, setIsPublished] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Flat blocks view for backward compat
  const blocks = topics.flatMap(t => t.blocks);

  // Initialize from lesson
  useEffect(() => {
    if (lesson) {
      const parsed = parseLessonContent(lesson.blocks);
      setTopics(parsed);
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
      blocks: serializeLessonContent(topics) as unknown as any,
    });
  }, [title, description, lessonType, estimatedDuration, passingScore, isPublished, topics, debouncedSave]);

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
        blocks: serializeLessonContent(topics) as unknown as any,
      });
    } finally {
      setIsSaving(false);
    }
  }, [lesson, title, description, lessonType, estimatedDuration, passingScore, isPublished, topics, saveMutation]);

  // Metadata handlers
  const handleSetTitle = useCallback((v: string) => setTitle(v), []);
  const handleSetDescription = useCallback((v: string) => setDescription(v), []);
  const handleSetLessonType = useCallback((v: string) => setLessonType(v), []);
  const handleSetEstimatedDuration = useCallback((v: number | null) => setEstimatedDuration(v), []);
  const handleSetPassingScore = useCallback((v: number) => setPassingScore(v), []);
  const handleSetIsPublished = useCallback((v: boolean) => setIsPublished(v), []);

  // Topic operations
  const addTopic = useCallback((topicTitle?: string): LessonTopic => {
    const newTopic: LessonTopic = {
      id: generateBlockId(),
      title: topicTitle || `Onderwerp ${topics.length + 1}`,
      order: topics.length,
      blocks: [],
    };
    setTopics(prev => [...prev, newTopic]);
    return newTopic;
  }, [topics.length]);

  const updateTopicTitle = useCallback((topicId: string, newTitle: string) => {
    setTopics(prev => prev.map(t => t.id === topicId ? { ...t, title: newTitle } : t));
  }, []);

  const deleteTopic = useCallback((topicId: string) => {
    setTopics(prev => prev.filter(t => t.id !== topicId).map((t, i) => ({ ...t, order: i })));
  }, []);

  const moveTopicUp = useCallback((topicId: string) => {
    setTopics(prev => {
      const idx = prev.findIndex(t => t.id === topicId);
      if (idx <= 0) return prev;
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next.map((t, i) => ({ ...t, order: i }));
    });
  }, []);

  const moveTopicDown = useCallback((topicId: string) => {
    setTopics(prev => {
      const idx = prev.findIndex(t => t.id === topicId);
      if (idx < 0 || idx >= prev.length - 1) return prev;
      const next = [...prev];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return next.map((t, i) => ({ ...t, order: i }));
    });
  }, []);

  // Block operations — find block's topic, or use first/specified topic
  const addBlock = useCallback((type: BlockType, topicId?: string): LessonBlock => {
    let targetTopicId = topicId;
    
    // If no topic exists, create one
    if (topics.length === 0) {
      const newTopic: LessonTopic = {
        id: generateBlockId(),
        title: 'Onderwerp 1',
        order: 0,
        blocks: [],
      };
      setTopics([newTopic]);
      targetTopicId = newTopic.id;
    } else if (!targetTopicId) {
      targetTopicId = topics[topics.length - 1].id; // add to last topic
    }

    const finalTopicId = targetTopicId!;
    const topic = topics.find(t => t.id === finalTopicId);
    const blockCount = topic ? topic.blocks.length : 0;
    const newBlock = createBlock(type, blockCount);

    setTopics(prev => prev.map(t =>
      t.id === finalTopicId
        ? { ...t, blocks: [...t.blocks, newBlock] }
        : t
    ));
    return newBlock;
  }, [topics]);

  const updateBlock = useCallback((blockId: string, updates: Partial<LessonBlock>) => {
    setTopics(prev => prev.map(t => ({
      ...t,
      blocks: t.blocks.map(b => b.id === blockId ? { ...b, ...updates } as LessonBlock : b),
    })));
  }, []);

  const deleteBlock = useCallback((blockId: string) => {
    setTopics(prev => prev.map(t => ({
      ...t,
      blocks: t.blocks.filter(b => b.id !== blockId).map((b, i) => ({ ...b, order: i })),
    })));
  }, []);

  const moveBlockUp = useCallback((blockId: string) => {
    setTopics(prev => prev.map(t => {
      const idx = t.blocks.findIndex(b => b.id === blockId);
      if (idx <= 0) return t;
      const newBlocks = [...t.blocks];
      [newBlocks[idx - 1], newBlocks[idx]] = [newBlocks[idx], newBlocks[idx - 1]];
      return { ...t, blocks: newBlocks.map((b, i) => ({ ...b, order: i })) };
    }));
  }, []);

  const moveBlockDown = useCallback((blockId: string) => {
    setTopics(prev => prev.map(t => {
      const idx = t.blocks.findIndex(b => b.id === blockId);
      if (idx < 0 || idx >= t.blocks.length - 1) return t;
      const newBlocks = [...t.blocks];
      [newBlocks[idx], newBlocks[idx + 1]] = [newBlocks[idx + 1], newBlocks[idx]];
      return { ...t, blocks: newBlocks.map((b, i) => ({ ...b, order: i })) };
    }));
  }, []);

  // Auto-save when state changes
  useEffect(() => {
    if (lesson) {
      saveAll();
    }
  }, [title, description, lessonType, estimatedDuration, passingScore, isPublished, topics]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return {
    topics,
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
    addTopic,
    updateTopicTitle,
    deleteTopic,
    moveTopicUp,
    moveTopicDown,
    addBlock,
    updateBlock,
    deleteBlock,
    moveBlockUp,
    moveBlockDown,
    saveNow,
  };
}
