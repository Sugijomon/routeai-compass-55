import React, { useState, useRef, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Eye, ChevronDown, RotateCcw, Mail } from "lucide-react";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, addDays } from "date-fns";
import { nl } from "date-fns/locale";

const DEFAULT_SUBJECT = "Korte AI-inventarisatie voor [org_name] — 20 minuten";

const DEFAULT_BODY = `Hoi [voornaam],

[manager_naam] heeft je uitgenodigd voor een korte inventarisatie van de AI-tools die jij gebruikt in je werk.

Dit is geen controle. We willen een eerlijk beeld krijgen van welke tools er worden gebruikt, zodat we ze goed kunnen ondersteunen en officieel kunnen vastleggen. Alles wat je invult wordt vertrouwelijk behandeld — eerlijk antwoord heeft geen consequenties.

De inventarisatie duurt ongeveer 20 minuten en loopt tot [deadline].

Vragen? Mail naar [dpo_email]`;

const VARIABLES = [
  { key: "[voornaam]", label: "voornaam" },
  { key: "[manager_naam]", label: "manager_naam" },
  { key: "[org_name]", label: "org_name" },
  { key: "[deadline]", label: "deadline" },
  { key: "[dpo_email]", label: "dpo_email" },
] as const;

export interface InviteEmailTemplate {
  subject: string;
  body: string;
}

interface InviteEmailTemplateEditorProps {
  /** Callback die subject+body doorgeeft aan parent */
  onTemplateChange?: (template: InviteEmailTemplate) => void;
}

export default function InviteEmailTemplateEditor({
  onTemplateChange,
}: InviteEmailTemplateEditorProps) {
  const { profile } = useUserProfile();
  const queryClient = useQueryClient();
  const orgId = profile?.org_id;
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [subject, setSubject] = useState(DEFAULT_SUBJECT);
  const [body, setBody] = useState(DEFAULT_BODY);
  const [loaded, setLoaded] = useState(false);

  // Haal opgeslagen template op uit organizations.settings
  const { data: orgData } = useQuery({
    queryKey: ["org-invite-template", orgId],
    queryFn: async () => {
      if (!orgId) return null;
      const { data, error } = await supabase
        .from("organizations")
        .select("name, settings, contact_email")
        .eq("id", orgId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });

  // Laad opgeslagen template bij eerste data
  React.useEffect(() => {
    if (orgData && !loaded) {
      const settings = orgData.settings as Record<string, unknown> | null;
      const saved = settings?.invite_email_template as InviteEmailTemplate | undefined;
      if (saved) {
        setSubject(saved.subject || DEFAULT_SUBJECT);
        setBody(saved.body || DEFAULT_BODY);
      }
      setLoaded(true);
    }
  }, [orgData, loaded]);

  // Notify parent bij wijzigingen
  React.useEffect(() => {
    onTemplateChange?.({ subject, body });
  }, [subject, body, onTemplateChange]);

  const orgName = orgData?.name || "Mijn organisatie";

  // Opslaan in organizations.settings
  const saveMutation = useMutation({
    mutationFn: async (template: InviteEmailTemplate) => {
      if (!orgId) throw new Error("Geen organisatie");
      const currentSettings = (orgData?.settings as Record<string, unknown>) || {};
      const merged = {
        ...currentSettings,
        invite_email_template: template,
      };
      const { error } = await supabase
        .from("organizations")
        .update({ settings: merged as any })
        .eq("id", orgId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["org-invite-template"] });
      toast.success("Mailtemplate opgeslagen");
    },
    onError: (err: Error) => {
      toast.error(`Fout bij opslaan: ${err.message}`);
    },
  });

  const handleSave = () => {
    saveMutation.mutate({ subject, body });
  };

  const handleReset = () => {
    setSubject(DEFAULT_SUBJECT);
    setBody(DEFAULT_BODY);
    toast.info("Standaardtemplate hersteld — vergeet niet op te slaan.");
  };

  // Voeg variabele in op cursorpositie
  const insertVariable = useCallback(
    (variable: string) => {
      const textarea = textareaRef.current;
      if (!textarea) {
        setBody((prev) => prev + variable);
        return;
      }
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newBody = body.slice(0, start) + variable + body.slice(end);
      setBody(newBody);
      // Zet cursor na de ingevoegde variabele
      requestAnimationFrame(() => {
        textarea.focus();
        const newPos = start + variable.length;
        textarea.setSelectionRange(newPos, newPos);
      });
    },
    [body]
  );

  // Preview met ingevulde voorbeeldwaarden
  const previewSubject = subject
    .replace(/\[voornaam\]/g, "Jan")
    .replace(/\[manager_naam\]/g, profile?.full_name || "DPO")
    .replace(/\[org_name\]/g, orgName)
    .replace(/\[deadline\]/g, format(addDays(new Date(), 30), "d MMMM yyyy", { locale: nl }))
    .replace(/\[dpo_email\]/g, profile?.email || orgData?.contact_email || "dpo@organisatie.nl");

  const previewBody = body
    .replace(/\[voornaam\]/g, "Jan")
    .replace(/\[manager_naam\]/g, profile?.full_name || "DPO")
    .replace(/\[org_name\]/g, orgName)
    .replace(/\[deadline\]/g, format(addDays(new Date(), 30), "d MMMM yyyy", { locale: nl }))
    .replace(/\[dpo_email\]/g, profile?.email || orgData?.contact_email || "dpo@organisatie.nl");

  return (
    <>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="flex items-center justify-between">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
              <Eye className="h-4 w-4" />
              Bekijk en pas de uitnodigingsmail aan
              <ChevronDown
                className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
              />
            </Button>
          </CollapsibleTrigger>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(true)}
            className="gap-2"
          >
            <Mail className="h-4 w-4" />
            Preview
          </Button>
        </div>

        <CollapsibleContent className="mt-3">
          <Card>
            <CardContent className="pt-5 space-y-4">
              {/* Onderwerpregel */}
              <div className="space-y-2">
                <Label htmlFor="invite-subject">Onderwerpregel</Label>
                <Input
                  id="invite-subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Onderwerp van de uitnodigingsmail"
                />
              </div>

              {/* Berichttekst */}
              <div className="space-y-2">
                <Label htmlFor="invite-body">Berichttekst</Label>
                <Textarea
                  id="invite-body"
                  ref={textareaRef}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={6}
                  className="font-mono text-sm resize-none"
                  placeholder="Schrijf hier je uitnodigingsbericht..."
                />
              </div>

              {/* Variabele-chips */}
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {VARIABLES.map((v) => (
                    <Badge
                      key={v.key}
                      variant="secondary"
                      className="cursor-pointer hover:bg-primary/10 transition-colors select-none"
                      onClick={() => insertVariable(v.key)}
                    >
                      {v.key}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  De knop &apos;Start de inventarisatie&apos; en de magic link worden automatisch
                  toegevoegd aan de mail — je hoeft die niet zelf in te voegen.
                </p>
              </div>

              {/* Acties */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Herstel standaard
                </button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={saveMutation.isPending}
                >
                  Template opslaan
                </Button>
              </div>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>

      {/* Preview modal */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Voorbeeld uitnodigingsmail
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Gesimuleerde e-mail */}
            <div className="rounded-lg border bg-background">
              {/* Header */}
              <div className="border-b px-4 py-3 space-y-1">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground font-medium">Aan:</span>
                  <span>jan@voorbeeld.nl</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground font-medium">Onderwerp:</span>
                  <span className="font-medium">{previewSubject}</span>
                </div>
              </div>
              {/* Body */}
              <div className="px-4 py-4">
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {previewBody}
                </div>
                {/* Gesimuleerde CTA-knop */}
                <div className="mt-6 mb-2">
                  <div className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground">
                    Start de inventarisatie →
                  </div>
                </div>
              </div>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Dit is een voorbeeld. Variabelen worden automatisch ingevuld per medewerker bij verzending.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export { DEFAULT_SUBJECT, DEFAULT_BODY };
