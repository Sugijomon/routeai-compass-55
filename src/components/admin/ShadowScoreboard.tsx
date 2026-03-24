import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Trophy, Copy, Check, ExternalLink, Eye, EyeOff,
  Loader2, ShieldCheck, BarChart3, Users, Wrench,
} from 'lucide-react';
import PublicScoreboardView from '@/components/admin/PublicScoreboardView';

// --- Types ---

interface ScoreboardConfig {
  show_tool_progress: boolean;
  show_use_cases: boolean;
  show_risk_categories: boolean;
  show_department_scores: boolean;
  show_individual: boolean;
}

const DEFAULT_CONFIG: ScoreboardConfig = {
  show_tool_progress: true,
  show_use_cases: true,
  show_risk_categories: true,
  show_department_scores: true,
  show_individual: false,
};

// --- Slug generator ---

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 40)
    + '-ai';
}

// --- Component ---

export default function ShadowScoreboard() {
  const { profile } = useUserProfile();
  const orgId = profile?.org_id;
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Haal org-data op
  const { data: org, isLoading } = useQuery({
    queryKey: ['scoreboard-org', orgId],
    queryFn: async () => {
      if (!orgId) return null;
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name, scoreboard_slug, scoreboard_enabled, scoreboard_config')
        .eq('id', orgId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });

  const [enabled, setEnabled] = useState(false);
  const [slug, setSlug] = useState('');
  const [config, setConfig] = useState<ScoreboardConfig>(DEFAULT_CONFIG);

  // Sync state from DB
  useEffect(() => {
    if (org) {
      setEnabled(org.scoreboard_enabled ?? false);
      setSlug(org.scoreboard_slug || generateSlug(org.name));
      setConfig({ ...DEFAULT_CONFIG, ...(org.scoreboard_config as unknown as Partial<ScoreboardConfig>) });
    }
  }, [org]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (updates: Record<string, unknown>) => {
      if (!orgId) throw new Error('Geen org');
      const { error } = await supabase
        .from('organizations')
        .update(updates as any)
        .eq('id', orgId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scoreboard-org'] });
      toast.success('Scoreboard-instellingen opgeslagen');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleSave = () => {
    saveMutation.mutate({
      scoreboard_enabled: enabled,
      scoreboard_slug: slug.trim() || null,
      scoreboard_config: config,
    });
  };

  const handleToggleConfig = (key: keyof ScoreboardConfig) => {
    setConfig(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const publicUrl = `${window.location.origin}/scoreboard/${slug}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const TOGGLE_ITEMS: { key: keyof ScoreboardConfig; label: string; description: string; icon: React.ElementType }[] = [
    {
      key: 'show_tool_progress',
      label: 'Tool-progressie',
      description: 'Goedgekeurde vs. shadow tools — als progressie-indicator, nooit als schuldvinger.',
      icon: Wrench,
    },
    {
      key: 'show_use_cases',
      label: 'Use-cases overzicht',
      description: 'Waarvoor wordt AI ingezet binnen de organisatie (top 5).',
      icon: BarChart3,
    },
    {
      key: 'show_risk_categories',
      label: 'Risicocategorieën',
      description: 'Verdeling van risicoklassen over alle ontdekte tools.',
      icon: ShieldCheck,
    },
    {
      key: 'show_department_scores',
      label: 'Teamscores per afdeling',
      description: 'Participatiegraad per afdeling als visuele ringen.',
      icon: Users,
    },
    {
      key: 'show_individual',
      label: 'Individueel scoreboard',
      description: 'Anoniem als default — naam alleen zichtbaar bij expliciete medewerker-opt-in.',
      icon: Trophy,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Hoofdschakelaar + slug */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Trophy className="h-5 w-5 text-primary" />
            Publiek Scoreboard
          </CardTitle>
          <CardDescription>
            Deel de voortgang van je organisatie op een publieke pagina — zonder gevoelige data.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Aan/uit schakelaar */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Scoreboard activeren</Label>
              <p className="text-xs text-muted-foreground">
                Maakt het scoreboard toegankelijk via de publieke URL.
              </p>
            </div>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>

          {/* Slug */}
          <div className="space-y-2">
            <Label htmlFor="slug">Publieke URL-slug</Label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  /scoreboard/
                </span>
                <Input
                  id="slug"
                  value={slug}
                  onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  className="pl-24"
                  placeholder="jouw-organisatie-ai"
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopy}
                title="Kopieer URL"
              >
                {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
              </Button>
              {enabled && slug && (
                <Button
                  variant="outline"
                  size="icon"
                  asChild
                  title="Open in nieuw tabblad"
                >
                  <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Volledige URL: {publicUrl}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Configureerbare elementen */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Zichtbare elementen</CardTitle>
          <CardDescription>
            Bepaal welke informatie op het publieke scoreboard wordt getoond.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-1">
          {TOGGLE_ITEMS.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={item.key}>
                {idx > 0 && <Separator className="my-3" />}
                <div className="flex items-start justify-between gap-4 py-1">
                  <div className="flex gap-3">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">{item.label}</Label>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                      {item.key === 'show_individual' && (
                        <Badge variant="outline" className="mt-1.5 text-xs">
                          AVG — opt-in vereist
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Switch
                    checked={config[item.key]}
                    onCheckedChange={() => handleToggleConfig(item.key)}
                  />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Opslaan + Preview */}
      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={saveMutation.isPending}>
          {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          Instellingen opslaan
        </Button>
        <Button
          variant="outline"
          onClick={() => setShowPreview(prev => !prev)}
          className="gap-2"
        >
          {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          {showPreview ? 'Verberg preview' : 'Toon preview'}
        </Button>
      </div>

      {/* Preview */}
      {showPreview && orgId && (
        <div className="rounded-xl border-2 border-dashed border-primary/20 p-6 bg-muted/20">
          <p className="text-xs text-muted-foreground mb-4 text-center uppercase tracking-wider font-medium">
            Preview — zo ziet het publieke scoreboard eruit
          </p>
          <PublicScoreboardView orgId={orgId} config={config} orgName={org?.name ?? ''} />
        </div>
      )}
    </div>
  );
}
