import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Check, Loader2, Wrench } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ToolOption {
  name: string;
  vendor: string;
}

interface ToolCategory {
  label: string;
  tools: ToolOption[];
}

const TOOL_CATEGORIES: ToolCategory[] = [
  {
    label: "Conversatie & assistentie",
    tools: [
      { name: "ChatGPT", vendor: "OpenAI" },
      { name: "Claude", vendor: "Anthropic" },
      { name: "Gemini", vendor: "Google" },
      { name: "Copilot", vendor: "Microsoft" },
      { name: "Perplexity", vendor: "Perplexity" },
    ],
  },
  {
    label: "Schrijven & content",
    tools: [
      { name: "Grammarly", vendor: "Grammarly" },
      { name: "Jasper", vendor: "Jasper" },
      { name: "Notion AI", vendor: "Notion" },
      { name: "Otter.ai", vendor: "Otter.ai" },
      { name: "Fireflies", vendor: "Fireflies" },
      { name: "Fathom", vendor: "Fathom" },
    ],
  },
  {
    label: "Code & development",
    tools: [
      { name: "GitHub Copilot", vendor: "GitHub" },
      { name: "Cursor", vendor: "Cursor" },
      { name: "Tabnine", vendor: "Tabnine" },
    ],
  },
  {
    label: "Design & visueel",
    tools: [
      { name: "Midjourney", vendor: "Midjourney" },
      { name: "DALL-E", vendor: "OpenAI" },
      { name: "Canva AI", vendor: "Canva" },
      { name: "Adobe Firefly", vendor: "Adobe" },
    ],
  },
  {
    label: "Embedded in bestaande tools",
    tools: [
      { name: "Microsoft 365 Copilot", vendor: "Microsoft" },
      { name: "Google Workspace AI", vendor: "Google" },
      { name: "Salesforce Einstein", vendor: "Salesforce" },
      { name: "Zoom AI", vendor: "Zoom" },
      { name: "Slack AI", vendor: "Slack" },
    ],
  },
];

function getInitials(name: string) {
  return name
    .split(/[\s-]+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function KnownToolsStep() {
  const { profile } = useUserProfile();
  const { user } = useAuth();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [customTools, setCustomTools] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedCount, setSavedCount] = useState<number | null>(null);

  const orgId = profile?.org_id;

  const toggle = (toolName: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(toolName)) next.delete(toolName);
      else next.add(toolName);
      return next;
    });
  };

  const handleSave = async () => {
    if (!orgId || !user) return;
    setSaving(true);

    try {
      // Verzamel alle tool-namen
      const allTools: string[] = [...selected];

      // Parse vrij tekstveld
      const customLines = customTools
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.length > 0);
      allTools.push(...customLines);

      if (allTools.length === 0) {
        toast.info("Geen tools geselecteerd");
        setSaving(false);
        return;
      }

      // Upsert per tool
      const rows = allTools.map((toolName) => ({
        org_id: orgId,
        tool_name: toolName,
        status: "known_unconfigured" as const,
        added_by: user.id,
        added_at: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from("org_tools_catalog" as any)
        .upsert(rows, { onConflict: "org_id,tool_name", ignoreDuplicates: true });

      if (error) throw error;

      setSavedCount(allTools.length);
      toast.success(`${allTools.length} tool(s) opgeslagen`);
    } catch (err: any) {
      toast.error(`Fout bij opslaan: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (savedCount !== null) {
    return (
      <Card>
        <CardContent className="py-12 text-center space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
            <Check className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold">
            {savedCount} tool{savedCount !== 1 ? "s" : ""} opgeslagen
          </h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            De geselecteerde tools zijn opgeslagen. Je kunt dit later altijd
            aanpassen via deze pagina.
          </p>
          <Button variant="outline" size="sm" onClick={() => setSavedCount(null)}>
            Terug naar selectie
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Wrench className="h-5 w-5 text-primary" />
          Welke AI-tools zijn al bekend of in gebruik bij jullie organisatie?
        </CardTitle>
        <CardDescription>
          Dit helpt ons medewerkers direct te laten zien welke tools al in beeld
          zijn. Je kunt dit later altijd aanvullen.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {TOOL_CATEGORIES.map((cat) => (
          <div key={cat.label} className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">{cat.label}</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {cat.tools.map((tool) => {
                const isSelected = selected.has(tool.name);
                return (
                  <button
                    key={tool.name}
                    type="button"
                    onClick={() => toggle(tool.name)}
                    className={cn(
                      "relative flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all text-left",
                      "hover:border-primary/40 hover:bg-accent/50",
                      isSelected
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border bg-background"
                    )}
                  >
                    {isSelected && (
                      <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                        <Check className="h-3 w-3 text-primary-foreground" />
                      </div>
                    )}
                    <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center text-sm font-semibold text-muted-foreground">
                      {getInitials(tool.name)}
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium leading-tight">{tool.name}</p>
                      <p className="text-xs text-muted-foreground">{tool.vendor}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* Vrij tekstveld */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">
            Anders (vrij tekstveld, één tool per regel)
          </h4>
          <Textarea
            placeholder="Bijv. Synthesia, ElevenLabs..."
            value={customTools}
            onChange={(e) => setCustomTools(e.target.value)}
            rows={3}
          />
        </div>

        {/* Selectie-samenvatting */}
        {(selected.size > 0 || customTools.trim()) && (
          <div className="flex flex-wrap gap-1.5">
            {[...selected].map((t) => (
              <Badge key={t} variant="secondary" className="text-xs">
                {t}
              </Badge>
            ))}
            {customTools
              .split("\n")
              .map((l) => l.trim())
              .filter(Boolean)
              .map((t) => (
                <Badge key={`custom-${t}`} variant="outline" className="text-xs">
                  {t}
                </Badge>
              ))}
          </div>
        )}

        {/* Actie-knoppen */}
        <div className="flex items-center gap-3 pt-2">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Wrench className="h-4 w-4 mr-2" />
            )}
            Opslaan en doorgaan
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={() => toast.info("Stap overgeslagen — je kunt dit later invullen.")}
          >
            Overslaan
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
