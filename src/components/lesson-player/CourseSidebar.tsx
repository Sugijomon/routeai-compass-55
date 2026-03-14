import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { 
  ChevronDown, 
  ChevronRight, 
  CheckCircle, 
  Circle, 
  GraduationCap,
  ArrowLeft,
} from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';
import { LessonTopic, parseLessonContent } from '@/types/lesson-blocks';

type Lesson = Tables<'lessons'>;

interface CourseLessonItem {
  id: string;
  lesson_id: string | null;
  sequence_order: number;
  lesson: Lesson;
}

interface CourseSidebarProps {
  courseId: string | null;
  currentLessonId: string;
  userId: string | null;
  currentBlockIndex: number; // now represents currentTopicIndex
  topics?: LessonTopic[];  // topics of the current lesson, passed from LessonPlayer
}

export function CourseSidebar({ courseId, currentLessonId, userId, currentBlockIndex, topics }: CourseSidebarProps) {
  const navigate = useNavigate();
  const [expandedUnits, setExpandedUnits] = useState<Set<string>>(new Set(['main']));
  const [expandedLessons, setExpandedLessons] = useState<Set<string>>(new Set());

  // Auto-expand the active lesson
  useEffect(() => {
    if (currentLessonId) {
      setExpandedLessons(prev => {
        const next = new Set(prev);
        next.add(currentLessonId);
        return next;
      });
    }
  }, [currentLessonId]);

  const { data: course } = useQuery({
    queryKey: ['sidebar-course', courseId],
    queryFn: async () => {
      if (!courseId) return null;
      const { data, error } = await supabase.from('courses').select('*').eq('id', courseId).single();
      if (error) throw error;
      return data;
    },
    enabled: !!courseId,
  });

  const { data: courseLessons = [] } = useQuery({
    queryKey: ['sidebar-course-lessons', courseId],
    queryFn: async () => {
      if (!courseId) return [];
      const { data, error } = await supabase
        .from('course_lessons')
        .select('*, lesson:lessons(*)')
        .eq('course_id', courseId)
        .order('sequence_order', { ascending: true });
      if (error) throw error;
      return (data || []).map(cl => ({ ...cl, lesson: cl.lesson as Lesson })) as CourseLessonItem[];
    },
    enabled: !!courseId,
  });

  const { data: completedLessonIds = [] } = useQuery({
    queryKey: ['sidebar-completions', courseId, userId],
    queryFn: async () => {
      if (!courseId || !userId || courseLessons.length === 0) return [];
      const lessonIds = courseLessons.map(cl => cl.lesson_id).filter(Boolean) as string[];
      if (lessonIds.length === 0) return [];
      const { data, error } = await supabase
        .from('user_lesson_completions')
        .select('lesson_id')
        .eq('user_id', userId)
        .in('lesson_id', lessonIds);
      if (error) throw error;
      return data?.map(c => c.lesson_id) ?? [];
    },
    enabled: !!courseId && !!userId && courseLessons.length > 0,
  });

  const totalLessons = courseLessons.length;
  const completedCount = completedLessonIds.length;
  const progressPercentage = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  const getLessonStatus = (_index: number, lessonId: string | null): 'completed' | 'active' => {
    if (!lessonId) return 'active';
    if (lessonId === currentLessonId) return 'active';
    if (completedLessonIds.includes(lessonId)) return 'completed';
    return 'active';
  };

  const toggleUnit = (unitId: string) => {
    setExpandedUnits(prev => {
      const next = new Set(prev);
      if (next.has(unitId)) next.delete(unitId);
      else next.add(unitId);
      return next;
    });
  };

  const toggleLesson = (lessonId: string) => {
    setExpandedLessons(prev => {
      const next = new Set(prev);
      if (next.has(lessonId)) next.delete(lessonId);
      else next.add(lessonId);
      return next;
    });
  };

  const handleLessonClick = (lessonId: string | null) => {
    if (!lessonId) return;
    navigate(`/learn/${lessonId}${courseId ? `?courseId=${courseId}` : ''}`);
  };

  if (!courseId || !course) {
    return (
      <aside className="w-[280px] shrink-0 flex flex-col overflow-hidden" style={{ backgroundColor: '#0f2744' }}>
        {/* Header */}
        <div className="p-4 border-b border-white/10">
          <button onClick={() => navigate('/learn')} className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-3">
            <ArrowLeft className="h-4 w-4" />
            Terug naar overzicht
          </button>
          <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wider">Losse les</h2>
        </div>

        {/* Topics list */}
        {topics && topics.length > 0 && (
          <div className="flex-1 overflow-y-auto py-2">
            <div className="px-4 py-2.5 text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Onderwerpen
            </div>
            <div className="space-y-0.5">
              {topics.map((topic, idx) => {
                const isActive = idx === currentBlockIndex;
                return (
                  <div
                    key={topic.id}
                    className={cn(
                      'flex items-center gap-2 pl-8 pr-4 py-2 text-sm',
                      isActive
                        ? 'text-white border-l-2 border-sky-400 bg-sky-500/10'
                        : 'text-white/50 border-l-2 border-transparent',
                    )}
                  >
                    <span className="shrink-0 w-4 text-center text-xs font-medium">
                      {idx + 1}
                    </span>
                    <span className="truncate">{topic.title}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </aside>
    );
  }

  const isMainExpanded = expandedUnits.has('main');

  return (
    <aside className="w-[280px] shrink-0 flex flex-col overflow-hidden" style={{ backgroundColor: '#0f2744' }}>
      {/* Course header */}
      <div className="p-4 border-b border-white/10">
        <button onClick={() => navigate(courseId ? `/learn/course/${courseId}` : '/learn')} className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-3">
          <ArrowLeft className="h-4 w-4" />
          Cursusoverzicht
        </button>
        <h2 className="text-white font-semibold text-sm leading-snug line-clamp-2">{course.title}</h2>
        <div className="mt-3 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Voortgang</span>
            <span className="text-white font-medium">{progressPercentage}%</span>
          </div>
          <Progress value={progressPercentage} className="h-1.5 bg-white/10 [&>div]:bg-sky-400" />
        </div>
      </div>

      {/* Lessons list */}
      <div className="flex-1 overflow-y-auto py-2">
        <div>
          <button
            onClick={() => toggleUnit('main')}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-300 uppercase tracking-wider hover:bg-white/5 transition-colors"
          >
            {isMainExpanded ? <ChevronDown className="h-3.5 w-3.5 shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0" />}
            <span className="truncate">Lessen</span>
            <span className="ml-auto text-slate-500 font-normal">{completedCount}/{totalLessons}</span>
          </button>

          {isMainExpanded && (
            <div className="space-y-0.5 pb-2">
              {courseLessons.map((cl, index) => {
                const status = getLessonStatus(index, cl.lesson_id);
                const isActive = cl.lesson_id === currentLessonId;
                const isLessonExpanded = cl.lesson_id ? expandedLessons.has(cl.lesson_id) : false;
                // Parse topics for this lesson
                const lessonTopics: LessonTopic[] = cl.lesson ? parseLessonContent(cl.lesson.blocks) : [];
                const isCompleted = status === 'completed';

                return (
                  <div key={cl.id}>
                    {/* Lesson row */}
                    <div
                      className={cn(
                        'w-full flex items-center gap-2 px-4 py-2.5 text-left transition-colors text-sm',
                        isActive && 'bg-sky-500/15 border-l-2 border-sky-400',
                        !isActive && 'hover:bg-white/5 border-l-2 border-transparent',
                      )}
                    >
                      {lessonTopics.length > 0 ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (cl.lesson_id) toggleLesson(cl.lesson_id);
                          }}
                          className="shrink-0 p-0.5 -ml-0.5 hover:bg-white/10 rounded transition-colors"
                        >
                          {isLessonExpanded ? <ChevronDown className="h-3.5 w-3.5 text-slate-400" /> : <ChevronRight className="h-3.5 w-3.5 text-slate-400" />}
                        </button>
                      ) : (
                        <span className="shrink-0 w-4.5" />
                      )}

                      <span className="shrink-0">
                        {isCompleted ? (
                          <CheckCircle className="h-4 w-4 text-sky-400 fill-sky-400" />
                        ) : isActive ? (
                          <span className="relative flex h-4 w-4">
                            <Circle className="h-4 w-4 text-sky-400" />
                            <span className="absolute inset-0 flex items-center justify-center">
                              <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
                            </span>
                          </span>
                        ) : (
                          <Circle className="h-4 w-4 text-slate-600" />
                        )}
                      </span>

                      <button
                        onClick={() => handleLessonClick(cl.lesson_id)}
                        className={cn(
                          'truncate leading-snug text-left flex-1 min-w-0 hover:text-white',
                          isActive ? 'text-white font-medium' : 'text-slate-300',
                        )}
                      >
                        {cl.lesson?.title || `Les ${index + 1}`}
                      </button>
                    </div>

                    {/* Expanded topics (instead of blocks) */}
                    {isLessonExpanded && lessonTopics.length > 0 && (
                      <div className="pb-1">
                        {lessonTopics.map((topic, topicIdx) => {
                          const isActiveTopic = isActive && topicIdx === currentBlockIndex;
                          const isTopicDone = isCompleted || (isActive && topicIdx < currentBlockIndex);

                          return (
                            <div
                              key={topic.id}
                              className={cn(
                                'flex items-center gap-2 pl-12 pr-4 py-1.5 text-xs',
                                isActiveTopic
                                  ? 'text-white border-l-2 border-sky-400 bg-sky-500/10'
                                  : 'text-white/50 border-l-2 border-transparent',
                              )}
                            >
                              {isTopicDone ? (
                                <CheckCircle className="h-3 w-3 text-sky-400 fill-sky-400 shrink-0" />
                              ) : (
                                <span className="text-white/30 shrink-0 w-3 text-center text-[10px] font-medium">
                                  {topicIdx + 1}
                                </span>
                              )}
                              <span className="truncate">{topic.title}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Bottom */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-sky-500/20 flex items-center justify-center shrink-0">
            <GraduationCap className="h-4 w-4 text-sky-400" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-400">AI Rijbewijs</p>
            <p className="text-sm text-white font-medium">{completedCount}/{totalLessons} lessen</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
