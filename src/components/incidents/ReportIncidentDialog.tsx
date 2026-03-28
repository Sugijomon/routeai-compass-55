import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import { useReportIncident } from '@/hooks/useIncidents';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assessmentId?: string;
  toolName?: string;
}

export function ReportIncidentDialog({ open, onOpenChange, assessmentId, toolName }: Props) {
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high' | ''>('');
  const [outputUsed, setOutputUsed] = useState<'yes_unchecked' | 'no_manual_check' | 'yes_after_correction' | ''>('');
  const { mutate: report, isPending } = useReportIncident();

  const isValid = description.trim().length > 10 && !!severity && !!outputUsed;

  const handleSubmit = () => {
    if (!isValid) return;
    report(
      {
        description,
        severity: severity as 'low' | 'medium' | 'high',
        output_used: outputUsed as 'yes_unchecked' | 'no_manual_check' | 'yes_after_correction',
        assessment_id: assessmentId,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          setDescription('');
          setSeverity('');
          setOutputUsed('');
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Incident melden</DialogTitle>
          <DialogDescription>
            {toolName ? `AI Check: ${toolName}` : 'Meld een onverwacht of ongewenst resultaat.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Melden is goed gedrag — geen aanklacht. Dit helpt de organisatie leren en voldoen aan de EU AI Act.
            </AlertDescription>
          </Alert>

          <div>
            <Label>Wat is er gebeurd? <span className="text-destructive">*</span></Label>
            <Textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Beschrijf kort wat er mis ging of onverwacht was…"
              rows={4}
              className="mt-1"
            />
          </div>

          <div>
            <Label className="mb-2 block">Ernst <span className="text-destructive">*</span></Label>
            <RadioGroup value={severity} onValueChange={v => setSeverity(v as typeof severity)} className="space-y-2">
              {[
                { value: 'low', label: 'Laag', desc: 'Kleine fout, geen externe gevolgen' },
                { value: 'medium', label: 'Middel', desc: 'Fout met mogelijke impact — DPO wordt geïnformeerd' },
                { value: 'high', label: 'Hoog', desc: 'Ernstige fout of mogelijke regelovertreding — DPO direct geïnformeerd' },
              ].map(opt => (
                <Label
                  key={opt.value}
                  htmlFor={`sev-${opt.value}`}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer text-sm transition-colors ${
                    severity === opt.value ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                  }`}
                >
                  <RadioGroupItem value={opt.value} id={`sev-${opt.value}`} className="mt-0.5" />
                  <div>
                    <span className="font-medium">{opt.label}</span>
                    <p className="text-muted-foreground text-xs mt-0.5">{opt.desc}</p>
                  </div>
                </Label>
              ))}
            </RadioGroup>
          </div>

          <div>
            <Label className="mb-2 block">Wat deed je met de AI-output? <span className="text-destructive">*</span></Label>
            <RadioGroup value={outputUsed} onValueChange={v => setOutputUsed(v as typeof outputUsed)} className="space-y-2">
              {[
                { value: 'yes_unchecked', label: 'Gebruikt zonder te controleren' },
                { value: 'no_manual_check', label: 'Gecontroleerd en niet gebruikt' },
                { value: 'yes_after_correction', label: 'Gecorrigeerd en daarna gebruikt' },
              ].map(opt => (
                <Label
                  key={opt.value}
                  htmlFor={`out-${opt.value}`}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer text-sm transition-colors ${
                    outputUsed === opt.value ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                  }`}
                >
                  <RadioGroupItem value={opt.value} id={`out-${opt.value}`} />
                  <span className="font-medium">{opt.label}</span>
                </Label>
              ))}
            </RadioGroup>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!isValid || isPending}
            className="w-full"
          >
            {isPending ? 'Bezig...' : 'Incident melden'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
