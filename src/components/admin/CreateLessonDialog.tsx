import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from '@/hooks/useUserProfile';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface CreateLessonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface LessonFormData {
  title: string;
  description: string;
  lesson_type: 'standalone' | 'course_module';
  estimated_duration: number | null;
  passing_score: number;
}

export function CreateLessonDialog({ open, onOpenChange }: CreateLessonDialogProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { profile } = useUserProfile();
  
  const [formData, setFormData] = useState<LessonFormData>({
    title: '',
    description: '',
    lesson_type: 'standalone',
    estimated_duration: null,
    passing_score: 80,
  });

  const createMutation = useMutation({
    mutationFn: async (data: LessonFormData) => {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data: lesson, error } = await supabase
        .from('lessons')
        .insert({
          title: data.title,
          description: data.description || null,
          lesson_type: data.lesson_type,
          estimated_duration: data.estimated_duration,
          passing_score: data.passing_score,
          blocks: [],
          is_published: false,
          created_by: user?.id || null,
          org_id: profile?.org_id,
        })
        .select()
        .single();

      if (error) throw error;
      return lesson;
    },
    onSuccess: (lesson) => {
      queryClient.invalidateQueries({ queryKey: ['admin-lessons'] });
      toast.success('Les aangemaakt');
      onOpenChange(false);
      resetForm();
      navigate(`/admin/lessons/${lesson.id}/edit`);
    },
    onError: (error) => {
      toast.error('Fout bij aanmaken: ' + error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      lesson_type: 'standalone',
      estimated_duration: null,
      passing_score: 80,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Titel is verplicht');
      return;
    }
    createMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nieuwe Les Aanmaken</DialogTitle>
          <DialogDescription>
            Vul de basisgegevens in om een nieuwe les te maken. Je kunt daarna de inhoud toevoegen.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titel *</Label>
            <Input
              id="title"
              placeholder="Bijv. Wat is AI?"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Beschrijving</Label>
            <Textarea
              id="description"
              placeholder="Korte beschrijving van de les..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="lesson_type">Type</Label>
              <Select
                value={formData.lesson_type}
                onValueChange={(value: 'standalone' | 'course_module') =>
                  setFormData({ ...formData, lesson_type: value })
                }
              >
                <SelectTrigger id="lesson_type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standalone">Standalone</SelectItem>
                  <SelectItem value="course_module">Course Module</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duur (minuten)</Label>
              <Input
                id="duration"
                type="number"
                min={1}
                placeholder="15"
                value={formData.estimated_duration ?? ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    estimated_duration: e.target.value ? parseInt(e.target.value) : null,
                  })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="passing_score">Slaagpercentage (%)</Label>
            <Input
              id="passing_score"
              type="number"
              min={0}
              max={100}
              value={formData.passing_score}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  passing_score: parseInt(e.target.value) || 80,
                })
              }
            />
            <p className="text-xs text-muted-foreground">
              Minimaal percentage correcte antwoorden voor quiz-onderdelen
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Annuleren
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Aanmaken...' : 'Aanmaken & Bewerken'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
