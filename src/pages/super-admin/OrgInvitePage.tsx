import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Search, Shield, Loader2, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const TEMPLATE_OPTIONS = [
  {
    value: 'shadow_only',
    icon: Search,
    title: 'Shadow AI Scan',
    description: 'Voor de DPO die de scan configureert en medewerkers uitnodigt.',
  },
  {
    value: 'routeai',
    icon: Shield,
    title: 'RouteAI Platform',
    description: 'Voor de Org Admin die het volledige platform beheert.',
  },
] as const;

export default function OrgInvitePage() {
  const { orgId } = useParams<{ orgId: string }>();
  const navigate = useNavigate();

  const { data: org, isLoading } = useQuery({
    queryKey: ['org-invite', orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name, plan_type, contact_person, contact_email')
        .eq('id', orgId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });

  const [template, setTemplate] = useState<string | null>(null);
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);

  // Initialiseer velden zodra org geladen is
  const [initialized, setInitialized] = useState(false);
  if (org && !initialized) {
    setTemplate(org.plan_type === 'shadow_only' ? 'shadow_only' : 'routeai');
    setContactName(org.contact_person || '');
    setContactEmail(org.contact_email || '');
    setInitialized(true);
  }

  const orgName = org?.name || '';
  const displayName = contactName || 'contactpersoon';

  const preview = useMemo(() => {
    const isShadow = template === 'shadow_only';
    const subject = isShadow
      ? `Uitnodiging: Shadow AI Scan — ${orgName}`
      : `Uitnodiging: RouteAI Platform — ${orgName}`;

    const noteBlock = note.trim()
      ? `\n─────────────────\n${note.trim()}\n─────────────────\n`
      : '';

    const body = isShadow
      ? `Beste ${displayName},

${orgName} start met de Shadow AI Scan — een inventarisatie van AI-gebruik binnen uw organisatie conform de EU AI Act.

U bent aangesteld als verantwoordelijke (DPO) voor dit traject. Via onderstaande link configureert u de scan en nodigt u medewerkers uit.
${noteBlock}
Klik op de knop hieronder om uw account te activeren en direct aan de slag te gaan.

Met vriendelijke groet,
Het RouteAI team`
      : `Beste ${displayName},

Uw organisatie is gekoppeld aan het RouteAI platform voor AI-governance.

Via onderstaande link beheert u AI-gebruik, trainingen en licenties voor uw team — conform de EU AI Act.
${noteBlock}
Klik op de knop hieronder om uw account te activeren.

Met vriendelijke groet,
Het RouteAI team`;

    return { subject, body };
  }, [template, orgName, displayName, note]);

  const handleSend = async () => {
    if (!contactEmail.trim()) return;
    setSending(true);
    try {
      const role = template === 'shadow_only' ? 'dpo' : 'org_admin';
      const { error } = await supabase.functions.invoke('invite-user', {
        body: {
          email: contactEmail.trim(),
          role,
          orgId,
          name: contactName.trim() || undefined,
        },
      });
      if (error) throw error;
      toast.success(`Uitnodiging verstuurd naar ${contactEmail.trim()}.`);
      navigate('/super-admin/organizations');
    } catch (err: any) {
      toast.error(`Uitnodiging mislukt: ${err.message || 'Onbekende fout'}`);
    } finally {
      setSending(false);
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 max-w-3xl">
        {/* Header */}
        <div className="space-y-1">
          <Button variant="ghost" size="sm" onClick={() => navigate('/super-admin/organizations')} className="mb-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Terug naar Organisaties
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Uitnodiging versturen</h1>
              <p className="text-muted-foreground">{orgName}</p>
            </div>
          </div>
        </div>

        {/* Sectie 1 — Template kiezen */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Template kiezen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {TEMPLATE_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const selected = template === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setTemplate(opt.value)}
                    className={cn(
                      'flex flex-col items-start gap-2 rounded-lg border p-4 text-left transition-colors',
                      selected
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-muted-foreground/30'
                    )}
                  >
                    <Icon className={cn('h-5 w-5', selected ? 'text-primary' : 'text-muted-foreground')} />
                    <span className="text-sm font-medium">{opt.title}</span>
                    <span className="text-xs text-muted-foreground">{opt.description}</span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Sectie 2 — Ontvanger */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Ontvanger</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="invite-name" className="text-xs">Naam</Label>
                <Input
                  id="invite-name"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Naam contactpersoon"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="invite-email" className="text-xs">E-mailadres *</Label>
                <Input
                  id="invite-email"
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="contact@bedrijf.nl"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Dit e-mailadres ontvangt de magic link.
            </p>
          </CardContent>
        </Card>

        {/* Sectie 3 — Persoonlijke noot */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Persoonlijke noot (optioneel)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="Voeg een persoonlijk bericht toe dat onder de standaardtekst wordt geplaatst."
            />
            <p className="text-xs text-muted-foreground">Max. 500 tekens</p>
          </CardContent>
        </Card>

        {/* Sectie 4 — Preview */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">E-mailpreview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg bg-muted/30 p-5 space-y-3">
              <p className="text-xs font-medium text-muted-foreground">
                Onderwerp: {preview.subject}
              </p>
              <div className="whitespace-pre-line text-sm leading-relaxed">
                {preview.body}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              De exacte opmaak wordt bepaald door de e-mailtemplate. Dit is een tekstpreview.
            </p>
          </CardContent>
        </Card>

        {/* Acties */}
        <div className="flex items-center justify-between">
          <div>
            <Button variant="ghost" onClick={() => navigate('/super-admin/organizations')}>
              Overslaan
            </Button>
            <p className="text-xs text-muted-foreground mt-1">
              Je kunt de uitnodiging later versturen via de organisatiepagina.
            </p>
          </div>
          <Button onClick={handleSend} disabled={!contactEmail.trim() || sending}>
            {sending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Verstuur uitnodiging →
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
