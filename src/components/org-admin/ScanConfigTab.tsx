import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Settings, Shield, CalendarDays, Check, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format, addDays } from "date-fns";
import { nl } from "date-fns/locale";
import KnownToolsStep from "./KnownToolsStep";
import ScanEmployeeTable from "./ScanEmployeeTable";

interface ScanSettings {
  shadow_survey_sector?: string;
  shadow_survey_org_size?: string;
  shadow_survey_goal?: string;
  shadow_survey_goal_other?: string;
  amnesty_manager_name?: string;
  amnesty_valid_days?: number;
  amnesty_text?: string;
  amnesty_activated_at?: string;
}

const SECTOR_OPTIONS = [
  { value: "zorg", label: "Zorg" },
  { value: "onderwijs", label: "Onderwijs" },
  { value: "zakelijke_dienstverlening", label: "Zakelijke dienstverlening" },
  { value: "overheid", label: "Overheid" },
  { value: "retail", label: "Retail" },
  { value: "anders", label: "Anders" },
];

const ORG_SIZE_OPTIONS = [
  { value: "1-25", label: "1–25 medewerkers" },
  { value: "26-100", label: "26–100 medewerkers" },
  { value: "101-250", label: "101–250 medewerkers" },
];

const GOAL_OPTIONS = [
  { value: "eu_ai_act_compliance", label: "EU AI Act compliance" },
  { value: "inzicht_beleid", label: "Inzicht in AI-gebruik voor beleidsontwikkeling" },
  { value: "voorbereiding_routeai", label: "Voorbereiding op RouteAI-platform" },
  { value: "anders", label: "Anders" },
];

export default function ScanConfigTab() {
  const { profile } = useUserProfile();
  const queryClient = useQueryClient();

  const { data: organization, isLoading } = useQuery({
    queryKey: ["organization-settings", profile?.org_id],
    queryFn: async () => {
      if (!profile?.org_id) return null;
      const { data, error } = await supabase
        .from("organizations")
        .select("id, settings, sector")
        .eq("id", profile.org_id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.org_id,
  });

  const settings = (organization?.settings as ScanSettings) || {};

  const [sector, setSector] = useState("");
  const [orgSize, setOrgSize] = useState("");
  const [goal, setGoal] = useState("");
  const [goalOther, setGoalOther] = useState("");
  const [managerName, setManagerName] = useState("");
  const [validDays, setValidDays] = useState(30);
  const [amnestyText, setAmnestyText] = useState("");

  // Sync state from DB
  useEffect(() => {
    if (organization) {
      setSector(organization.sector || settings.shadow_survey_sector || "");
      setOrgSize(settings.shadow_survey_org_size || "");
      setGoal(settings.shadow_survey_goal || "");
      setGoalOther(settings.shadow_survey_goal_other || "");
      setManagerName(settings.amnesty_manager_name || "");
      setValidDays(settings.amnesty_valid_days || 30);
      setAmnestyText(settings.amnesty_text || "");
    }
  }, [organization]);

  const saveMutation = useMutation({
    mutationFn: async (newSettings: Partial<ScanSettings>) => {
      if (!profile?.org_id) throw new Error("Geen organisatie gevonden");
      const merged = { ...settings, ...newSettings };
      const { error } = await supabase
        .from("organizations")
        .update({ settings: merged as any })
        .eq("id", profile.org_id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization-settings"] });
      toast.success("Instellingen opgeslagen");
    },
    onError: (err: Error) => {
      toast.error(`Fout bij opslaan: ${err.message}`);
    },
  });

  const saveContextMutation = useMutation({
    mutationFn: async () => {
      if (!profile?.org_id) throw new Error("Geen organisatie gevonden");
      const newSettings = {
        ...settings,
        shadow_survey_org_size: orgSize,
        shadow_survey_goal: goal,
        shadow_survey_goal_other: goal === "anders" ? goalOther : undefined,
      };
      const { error } = await supabase
        .from("organizations")
        .update({ sector: sector || null, settings: newSettings as any })
        .eq("id", profile.org_id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization-settings"] });
      queryClient.invalidateQueries({ queryKey: ["organization"] });
      toast.success("Context opgeslagen");
    },
    onError: (err: Error) => {
      toast.error(`Fout bij opslaan: ${err.message}`);
    },
  });

  const handleSaveContext = () => {
    saveContextMutation.mutate();
  };

  const handleSaveAmnesty = () => {
    saveMutation.mutate({
      amnesty_manager_name: managerName,
      amnesty_valid_days: validDays,
      amnesty_text: amnestyText || undefined,
    });
  };

  const handleActivateAmnesty = () => {
    saveMutation.mutate({
      amnesty_manager_name: managerName,
      amnesty_valid_days: validDays,
      amnesty_text: amnestyText || undefined,
      amnesty_activated_at: new Date().toISOString(),
    });
  };

  const amnestyActivatedAt = settings.amnesty_activated_at
    ? new Date(settings.amnesty_activated_at)
    : null;
  const amnestyExpiry = amnestyActivatedAt
    ? addDays(amnestyActivatedAt, settings.amnesty_valid_days || 30)
    : null;
  const amnestyActive = amnestyExpiry ? new Date() < amnestyExpiry : false;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sectie 1 — Organisatiecontext */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Settings className="h-5 w-5 text-primary" />
            Organisatiecontext
          </CardTitle>
          <CardDescription>
            Optionele context voor de Shadow AI Scan. Helpt bij het interpreteren van resultaten.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="sector">Sector</Label>
              <Select value={sector} onValueChange={setSector}>
                <SelectTrigger id="sector">
                  <SelectValue placeholder="Selecteer sector" />
                </SelectTrigger>
                <SelectContent>
                  {SECTOR_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="orgSize">Organisatiegrootte</Label>
              <Select value={orgSize} onValueChange={setOrgSize}>
                <SelectTrigger id="orgSize">
                  <SelectValue placeholder="Selecteer grootte" />
                </SelectTrigger>
                <SelectContent>
                  {ORG_SIZE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Doel van de scan</Label>
            <RadioGroup value={goal} onValueChange={setGoal} className="space-y-2">
              {GOAL_OPTIONS.map((opt) => (
                <div key={opt.value} className="flex items-center gap-2">
                  <RadioGroupItem value={opt.value} id={`goal-${opt.value}`} />
                  <Label htmlFor={`goal-${opt.value}`} className="font-normal cursor-pointer">
                    {opt.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
            {goal === "anders" && (
              <Input
                placeholder="Beschrijf het doel..."
                value={goalOther}
                onChange={(e) => setGoalOther(e.target.value)}
                className="mt-2"
              />
            )}
          </div>

          <Button
            onClick={handleSaveContext}
            disabled={saveContextMutation.isPending}
            variant="outline"
            size="sm"
          >
            {saveContextMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Context opslaan
          </Button>
        </CardContent>
      </Card>

      {/* Sectie 2 — Amnestievenster */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5 text-primary" />
            Amnestievenster configureren
          </CardTitle>
          <CardDescription>
            Het amnestievenster garandeert medewerkers dat eerlijk melden geen consequenties heeft.
            Verplicht voor activatie van de scan.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Status banner */}
          {amnestyActivatedAt && (
            <div className={`rounded-lg border p-4 ${amnestyActive ? "border-green-200 bg-green-50" : "border-amber-200 bg-amber-50"}`}>
              <div className="flex items-center gap-2 mb-1">
                {amnestyActive ? (
                  <Badge variant="default" className="bg-green-600 hover:bg-green-600">
                    <Check className="h-3 w-3 mr-1" /> Actief
                  </Badge>
                ) : (
                  <Badge variant="secondary">Verlopen</Badge>
                )}
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <CalendarDays className="h-3.5 w-3.5" />
                  Vervalt {amnestyExpiry ? format(amnestyExpiry, "d MMMM yyyy", { locale: nl }) : "—"}
                </span>
              </div>
              {amnestyActive && (
                <p className="text-sm text-green-800 mt-1">
                  Uitnodigingen kunnen nu verstuurd worden.
                </p>
              )}
            </div>
          )}

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="managerName">
                Naam verantwoordelijke <span className="text-destructive">*</span>
              </Label>
              <Input
                id="managerName"
                placeholder="Bijv. Jan de Vries, DPO"
                value={managerName}
                onChange={(e) => setManagerName(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Wordt getoond in de amnestieverkaring aan medewerkers.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="validDays">Geldigheid (dagen)</Label>
              <Input
                id="validDays"
                type="number"
                min={7}
                max={365}
                value={validDays}
                onChange={(e) => setValidDays(Number(e.target.value) || 30)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amnestyText">Aangepaste amnestietekst (optioneel)</Label>
            <Textarea
              id="amnestyText"
              placeholder="Laat leeg voor de standaardtekst..."
              value={amnestyText}
              onChange={(e) => setAmnestyText(e.target.value)}
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              Als dit veld leeg blijft, wordt de standaardtekst van het platform gebruikt.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={handleSaveAmnesty}
              disabled={saveMutation.isPending}
              variant="outline"
              size="sm"
            >
              Instellingen opslaan
            </Button>
            <Button
              onClick={handleActivateAmnesty}
              disabled={!managerName.trim() || saveMutation.isPending}
            >
              {saveMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Shield className="h-4 w-4 mr-2" />
              )}
              {amnestyActivatedAt ? "Heractiveer amnestievenster" : "Activeer amnestievenster"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sectie 3 — Bekende tools */}
      <KnownToolsStep />

      {/* Sectie 4 — Medewerkers */}
      <ScanEmployeeTable />
    </div>
  );
}
