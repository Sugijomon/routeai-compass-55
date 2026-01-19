import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { GraduationCap, Clock, BookOpen, ArrowRight } from 'lucide-react';

interface WelcomeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string | null;
}

export function WelcomeModal({ open, onOpenChange, courseId }: WelcomeModalProps) {
  const navigate = useNavigate();

  const handleStartTraining = () => {
    onOpenChange(false);
    if (courseId) {
      navigate(`/learn/course/${courseId}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/70">
            <GraduationCap className="h-8 w-8 text-primary-foreground" />
          </div>
          <DialogTitle className="text-2xl">Welkom bij RouteAI! 👋</DialogTitle>
          <DialogDescription className="text-base">
            Voordat je aan de slag kunt, moet je eerst de AI Rijbewijs training afronden.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-4">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">AI Rijbewijs Cursus</p>
              <p className="text-sm text-muted-foreground">
                Leer verantwoord AI gebruiken in je werk
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-4">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">Geschatte tijd</p>
              <p className="text-sm text-muted-foreground">
                Ongeveer 60 minuten om te voltooien
              </p>
            </div>
          </div>
        </div>

        <Button onClick={handleStartTraining} className="w-full gap-2" size="lg">
          Start Training
          <ArrowRight className="h-4 w-4" />
        </Button>
      </DialogContent>
    </Dialog>
  );
}
