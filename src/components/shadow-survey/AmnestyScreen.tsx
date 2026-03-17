import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Shield, ShieldAlert, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface AmnestyScreenProps {
  orgId: string;
  userId: string;
  settings: Record<string, unknown>;
  onAccepted: (runId: string) => void;
}

function getDefaultAmnestyText(managerName: string, validDays: number): string {
  return `De komende ${validDays} dagen zijn beschermd. Alles wat je deelt tijdens deze inventarisatie leidt niet tot blokkades of gevolgen. ${managerName} heeft deze bescherming goedgekeurd.`;
}

export default function AmnestyScreen({ orgId, userId, settings, onAccepted }: AmnestyScreenProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const managerName = (settings.amnesty_manager_name as string) || '';
  const validDays = (settings.amnesty_valid_days as number) || 30;
  const activatedAt = settings.amnesty_activated_at as string | undefined;
  const customText = settings.amnesty_text as string | undefined;

  // Bereken vervaldatum
  const expiryDate = activatedAt
    ? new Date(new Date(activatedAt).getTime() + validDays * 24 * 60 * 60 * 1000)
    : null;

  const isExpired = expiryDate ? new Date() > expiryDate : false;
  const isConfigured = !!managerName && !!activatedAt;

  const amnestyText = customText || (isConfigured ? getDefaultAmnestyText(managerName, validDays) : '');

  const handleAccept = async () => {
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('shadow_survey_runs')
        .insert({
          org_id: orgId,
          user_id: userId,
          amnesty_acknowledged: true,
        })
        .select('id')
        .single();

      if (error) throw error;

      onAccepted(data.id);
    } catch (err) {
      console.error('Amnesty insert mislukt:', err);
      toast({
        title: 'Fout',
        description: 'Kon de survey niet starten. Probeer het opnieuw.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Amnesty niet geconfigureerd
  if (!isConfigured) {
    return (
      <Alert variant="destructive" className="mt-6">
        <ShieldAlert className="h-5 w-5" />
        <AlertTitle>Amnesty nog niet geactiveerd</AlertTitle>
        <AlertDescription>
          Je organisatie heeft de amnesty-periode nog niet geconfigureerd. 
          Neem contact op met je beheerder om de Shadow AI Survey te activeren.
        </AlertDescription>
      </Alert>
    );
  }

  // Amnesty verlopen
  if (isExpired) {
    return (
      <Alert variant="destructive" className="mt-6">
        <ShieldAlert className="h-5 w-5" />
        <AlertTitle>Amnesty-periode verlopen</AlertTitle>
        <AlertDescription>
          De amnesty-periode is verlopen op{' '}
          <strong>{expiryDate!.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>.
          De survey is niet meer beschikbaar. Neem contact op met je beheerder.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="mt-6 border-primary/20">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-primary/10 p-3">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-xl">Amnesty-verklaring</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Amnesty-tekst */}
        <div className="bg-muted/50 rounded-lg p-5 border border-border">
          <p className="text-sm leading-relaxed">{amnestyText}</p>
        </div>

        {/* Details */}
        <div className="grid gap-3 text-sm">
          <div className="flex justify-between items-center py-2 border-b border-border">
            <span className="text-muted-foreground">Goedgekeurd door</span>
            <span className="font-medium">{managerName}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-border">
            <span className="text-muted-foreground">Geldig tot</span>
            <span className="font-medium">
              {expiryDate!.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-muted-foreground">Beschermingsduur</span>
            <span className="font-medium">{validDays} dagen</span>
          </div>
        </div>

        {/* Accepteerknop */}
        <Button
          size="lg"
          className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white"
          onClick={handleAccept}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <CheckCircle2 className="h-5 w-5" />
          )}
          Ik begrijp de voorwaarden en begin
        </Button>
      </CardContent>
    </Card>
  );
}
