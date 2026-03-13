import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CheckCircle2, BookOpen, Search, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

const SECTORS = [
  'Zorg',
  'Onderwijs',
  'Zakelijke dienstverlening',
  'Productie',
  'Overheid',
  'Overig',
];

const EMPLOYEE_RANGES = ['1-20', '21-50', '51-100', '101-250'];

export default function OrganisatieOnboarding() {
  const navigate = useNavigate();
  const { profile } = useUserProfile();
  const [step, setStep] = useState(1);
  const [selectedPath, setSelectedPath] = useState<'literacy' | 'shadow' | null>(null);
  const [sector, setSector] = useState('');
  const [employeeRange, setEmployeeRange] = useState('');
  const [country, setCountry] = useState('Nederland');
  const [aiActRole, setAiActRole] = useState('');
  const [saving, setSaving] = useState(false);

  const { data: org } = useQuery({
    queryKey: ['org-onboarding', profile?.org_id],
    queryFn: async () => {
      if (!profile?.org_id) return null;
      const { data, error } = await supabase
        .from('organizations')
        .select('name, sector, country')
        .eq('id', profile.org_id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.org_id,
  });

  const handleSaveOrgDetails = async () => {
    if (!profile?.org_id) return;
    setSaving(true);
    try {
      const settings = { employee_range: employeeRange, ai_act_role: aiActRole };
      const { error } = await supabase
        .from('organizations')
        .update({
          sector,
          country,
          settings,
        })
        .eq('id', profile.org_id);
      if (error) throw error;
      setStep(3);
    } catch (e: any) {
      toast.error('Opslaan mislukt: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-2 w-16 rounded-full transition-colors ${
                s <= step ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>

        {/* Step 1: Welcome & choice */}
        {step === 1 && (
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Welkom bij RouteAI</CardTitle>
              <CardDescription className="text-base">
                U bent aangesteld als AI Verantwoordelijke voor{' '}
                <span className="font-semibold text-foreground">{org?.name ?? 'uw organisatie'}</span>.
                Kies hoe u wilt beginnen:
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              {/* Option 1: AI Literacy */}
              <button
                type="button"
                onClick={() => {
                  setSelectedPath('literacy');
                  setStep(2);
                }}
                className="relative rounded-lg border-2 border-muted p-5 text-left transition-all hover:border-primary hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <Badge className="absolute top-3 right-3 bg-primary text-primary-foreground">
                  Aanbevolen
                </Badge>
                <BookOpen className="h-8 w-8 text-primary mb-3" />
                <h3 className="font-semibold text-foreground mb-1">Start met AI Literacy</h3>
                <p className="text-sm text-muted-foreground">
                  Medewerkers volgen eerst het AI rijbewijsexamen, daarna toegang tot RouteAI.
                </p>
              </button>

              {/* Option 2: Shadow AI Survey (disabled) */}
              <div className="relative rounded-lg border-2 border-muted p-5 text-left opacity-50 cursor-not-allowed">
                <Badge variant="secondary" className="absolute top-3 right-3">
                  Binnenkort beschikbaar
                </Badge>
                <Search className="h-8 w-8 text-muted-foreground mb-3" />
                <h3 className="font-semibold text-muted-foreground mb-1">Start met Shadow AI Survey</h3>
                <p className="text-sm text-muted-foreground">
                  Ontdek eerst welke AI tools al in gebruik zijn binnen uw organisatie.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Organisation details */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Organisatiegegevens aanvullen</CardTitle>
              <CardDescription>
                Vul de onderstaande gegevens aan voor uw organisatie.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label>Sector</Label>
                <Select value={sector} onValueChange={setSector}>
                  <SelectTrigger><SelectValue placeholder="Kies een sector" /></SelectTrigger>
                  <SelectContent>
                    {SECTORS.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Aantal medewerkers</Label>
                <Select value={employeeRange} onValueChange={setEmployeeRange}>
                  <SelectTrigger><SelectValue placeholder="Kies een bereik" /></SelectTrigger>
                  <SelectContent>
                    {EMPLOYEE_RANGES.map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Land</Label>
                <Select value={country} onValueChange={setCountry}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Nederland">Nederland</SelectItem>
                    <SelectItem value="België">België</SelectItem>
                    <SelectItem value="Duitsland">Duitsland</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <TooltipProvider>
                  <div className="flex items-center gap-1.5">
                    <Label>AI Act rol</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs text-sm">
                        <p><strong>Gebruiker/Deployer:</strong> Uw organisatie zet AI-systemen in die door derden zijn gebouwd.</p>
                        <p className="mt-1"><strong>Aanbieder/Provider:</strong> Uw organisatie ontwikkelt of traint eigen AI-modellen.</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </TooltipProvider>
                <Select value={aiActRole} onValueChange={setAiActRole}>
                  <SelectTrigger><SelectValue placeholder="Kies uw AI Act rol" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="deployer">Gebruiker / Deployer</SelectItem>
                    <SelectItem value="provider">Aanbieder / Provider</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-between pt-2">
                <Button variant="ghost" onClick={() => setStep(1)}>Terug</Button>
                <Button
                  onClick={handleSaveOrgDetails}
                  disabled={!sector || !employeeRange || !aiActRole || saving}
                >
                  {saving ? 'Opslaan…' : 'Volgende'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Done */}
        {step === 3 && (
          <Card className="text-center">
            <CardContent className="pt-10 pb-8 space-y-4">
              <CheckCircle2 className="h-16 w-16 text-primary mx-auto" />
              <h2 className="text-2xl font-semibold text-foreground">
                Uw organisatie is geconfigureerd
              </h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                U kunt nu medewerkers uitnodigen en het AI rijbewijsexamen activeren.
              </p>
              <Button size="lg" onClick={() => navigate('/admin')}>
                Ga naar dashboard
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
