import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, AlertTriangle, XCircle, Info, Clock } from 'lucide-react';
import { ROUTE_CONFIG } from '@/types/assessment';
import { supabase } from '@/integrations/supabase/client';
import type { DpoDecision } from '@/hooks/useAssessmentReviewQueue';

const V3_LABELS: Record<string, string> = {
  self: 'Alleen ikzelf', internal: 'Intern (collega\'s)',
  external: 'Extern (klanten/partners)', vulnerable: 'Kwetsbare groepen',
};
const V4_LABELS: Record<string, string> = {
  public: 'Openbare informatie', confidential: 'Bedrijfsvertrouwelijk',
  personal: 'Persoonsgegevens (regulier)', sensitive: 'Bijzondere persoonsgegevens',
};
const V5_LABELS: Record<string, string> = {
  hitl_strict: 'Menselijk toezicht (strikt)', hitl_alert: 'Toezicht met alertheid',
  automated: 'Geautomatiseerd',
};

// Inline component: ML-voltooiingsstatus voor DPO-review
function MlCompletionStatus({ assessmentId }: { assessmentId: string }) {
  const { data: completions } = useQuery({
    queryKey: ['ml-completion-dpo', assessmentId],
    queryFn: async () => {
      const { data } = await supabase
        .from('assessment_ml_completions')
        .select('completed_at, library_item_id')
        .eq('assessment_id', assessmentId);
      return data ?? [];
    },
  });

  const { data: assignment } = useQuery({
    queryKey: ['ml-assignment-dpo', assessmentId],
    queryFn: async () => {
      const { data } = await supabase
        .from('assessment_ml_assignments')
        .select('is_required, learning_library!assessment_ml_assignments_library_item_id_fkey(title)')
        .eq('assessment_id', assessmentId)
        .maybeSingle();
      return data;
    },
  });

  if (!assignment) return null;

  const isCompleted = completions && completions.length > 0;
  const mlTitle = (assignment.learning_library as Record<string, unknown> | null)?.title as string ?? 'Micro-learning';

  return (
    <div className="space-y-2">
      <Separator />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium">Micro-learning status</p>
          <p className="text-xs text-muted-foreground">{mlTitle}</p>
        </div>
        {isCompleted ? (
          <Badge className="bg-green-100 text-green-800 border-0 gap-1">
            <CheckCircle className="h-3 w-3" />
            Afgerond
          </Badge>
        ) : (
          <Badge variant="outline" className="gap-1 text-amber-700 border-amber-300">
            <Clock className="h-3 w-3" />
            Nog niet gestart
          </Badge>
        )}
      </div>
      {!isCompleted && assignment.is_required && (
        <p className="text-xs text-amber-700 bg-amber-50 rounded-md p-2">
          ⚠ Medewerker heeft de micro-learning nog niet voltooid. Na jouw goedkeuring wordt het assessment pas actief zodra dit is afgerond.
        </p>
      )}
    </div>
  );
}

interface Props {
  assessment: Record<string, unknown> | null;
  notificationId: string | null;
  onClose: () => void;
  onDecide: (params: { assessmentId: string; notificationId: string; decision: DpoDecision; notes?: string }) => void;
  isPending: boolean;
}

export function AssessmentReviewSheet({ assessment, notificationId, onClose, onDecide, isPending }: Props) {
  const [notes, setNotes] = useState('');
  const [selectedDecision, setSelectedDecision] = useState<DpoDecision | null>(null);

  if (!assessment) return null;

  const route = assessment.route as string;
  const config = ROUTE_CONFIG[route as keyof typeof ROUTE_CONFIG];
  const answers = assessment.survey_answers as Record<string, string> ?? {};

  const handleDecide = (decision: DpoDecision) => {
    if (!notificationId) return;
    if (decision === 'approve_with_conditions' && !notes.trim()) return;
    onDecide({
      assessmentId: assessment.id as string,
      notificationId,
      decision,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <Sheet open={!!assessment} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>AI Check beoordelen</SheetTitle>
          <SheetDescription>
            Beoordeel de use-case en kies een actie. Escalatie is onomkeerbaar.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {/* Tool + route */}
          <div>
            <p className="text-sm text-muted-foreground">Tool</p>
            <p className="font-semibold text-lg">{assessment.tool_name_raw as string}</p>
            <Badge className={`${config?.bg ?? ''} ${config?.text ?? ''} mt-1`}>
              {config?.label ?? route}
            </Badge>
          </div>

          {/* Plain language */}
          <div>
            <p className="text-sm text-muted-foreground">Beoordeling systeem</p>
            <p className="text-sm">{assessment.plain_language as string}</p>
            {assessment.reason_filtered && (
              <p className="text-xs text-muted-foreground mt-1">
                Claude-toelichting: {assessment.reason_filtered as string}
              </p>
            )}
          </div>

          <Separator />

          {/* Survey-samenvatting */}
          <div>
            <p className="text-sm font-medium mb-2">Survey-antwoorden</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">Archetype</span>
                <p className="font-medium">{assessment.primary_archetype as string}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Doelgroep</span>
                <p className="font-medium">{V3_LABELS[answers.V3] ?? answers.V3 ?? '—'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Data</span>
                <p className="font-medium">{V4_LABELS[answers.V4] ?? answers.V4 ?? '—'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Toezicht</span>
                <p className="font-medium">{V5_LABELS[answers.V5] ?? answers.V5 ?? '—'}</p>
              </div>
            </div>
          </div>

          {/* ML-voltooiingsstatus */}
          {(assessment.status as string) === 'pending_dpo' && (
            <MlCompletionStatus assessmentId={assessment.id as string} />
          )}

          {/* Compliance-flags */}
          {(assessment.dpia_required || assessment.fria_required) && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {assessment.dpia_required && 'DPIA vereist. '}
                {assessment.fria_required && 'FRIA vereist. '}
                Controleer dit vóór goedkeuring.
              </AlertDescription>
            </Alert>
          )}

          {/* DPO-instructies */}
          {Array.isArray(assessment.dpo_instructions) && (assessment.dpo_instructions as string[]).length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Instructies voor jou</p>
              <div className="space-y-1">
                {(assessment.dpo_instructions as string[]).map((instr, i) => (
                  <div key={i} className="flex gap-2 text-sm">
                    <span className="text-muted-foreground shrink-0">{i + 1}.</span>
                    <span>{instr}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Notities */}
          <div>
            <div className="flex items-center gap-1 mb-1.5">
              <label className="text-sm font-medium">Notities / aanvullende voorwaarden</label>
              {selectedDecision === 'approve_with_conditions' && (
                <span className="text-destructive">*</span>
              )}
            </div>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Beschrijf eventuele voorwaarden of opmerkingen…"
              rows={4}
            />
          </div>

          {/* Actieknoppen */}
          <div className="space-y-2">
            <Button
              className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white"
              onClick={() => handleDecide('approve')}
              disabled={isPending}
            >
              <CheckCircle className="h-4 w-4" />
              Akkoord — assessment activeren
            </Button>
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => {
                setSelectedDecision('approve_with_conditions');
                if (notes.trim()) handleDecide('approve_with_conditions');
              }}
              disabled={isPending}
            >
              <Info className="h-4 w-4" />
              Akkoord met extra voorwaarden
            </Button>
            <Button
              variant="outline"
              className="w-full gap-2 text-destructive border-destructive/30 hover:bg-destructive/10"
              onClick={() => handleDecide('escalate')}
              disabled={isPending}
            >
              <XCircle className="h-4 w-4" />
              Escaleer / Stop — assessment pauzeren
            </Button>
          </div>

          {selectedDecision === 'approve_with_conditions' && !notes.trim() && (
            <p className="text-xs text-destructive">Vul aanvullende voorwaarden in vóór je akkoord geeft.</p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
