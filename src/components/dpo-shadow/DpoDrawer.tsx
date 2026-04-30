// Gedeelde drawer voor DPO Risicoprofiel met twee modi:
//   - mode="cluster"  → details van een matrixbol (cluster-aggregaat)
//   - mode="review"   → details van een individuele triagerij (anonieme case)
// Visueel consistent; inhoud verschilt per modus.
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import type { RiskCluster } from "@/hooks/useRiskClusters";
import { TIER_META, TRIGGER_META, triggerLabel, tierLabel } from "@/lib/dpoTriggerMeta";

export type DpoDrawerData =
  | { mode: "cluster"; cluster: RiskCluster }
  | {
      mode: "review";
      caseId: string;
      assignedTier: string;
      shadowScore: number;
      exposureScore: number;
      priorityScore: number;
      triggerCodes: string[];
      respondentCount?: number;
    };

interface DpoDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: DpoDrawerData | null;
}

export function DpoDrawer({ open, onOpenChange, data }: DpoDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        {data?.mode === "cluster" && <ClusterDetail cluster={data.cluster} />}
        {data?.mode === "review" && <ReviewDetail data={data} />}
      </SheetContent>
    </Sheet>
  );
}

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-muted-foreground">{label}</span>
        <span className="font-mono font-bold">{value.toFixed(2)}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full"
          style={{ width: `${Math.min(value, 100)}%`, background: color }}
        />
      </div>
    </div>
  );
}

function ClusterDetail({ cluster }: { cluster: RiskCluster }) {
  const tier = TIER_META[cluster.assigned_tier];
  return (
    <>
      <SheetHeader>
        <div className="flex items-center gap-2">
          {tier && <Badge className={`${tier.bg} ${tier.text} hover:${tier.bg}`}>{tier.label}</Badge>}
          <Badge variant="outline" className="font-mono text-xs">
            {cluster.cluster_id}
          </Badge>
        </div>
        <SheetTitle>Clusterdetail</SheetTitle>
        <SheetDescription>
          Aggregaat over {cluster.respondent_count} respondent{cluster.respondent_count !== 1 ? "en" : ""}.
          Individuele antwoorden zijn niet zichtbaar.
        </SheetDescription>
      </SheetHeader>

      <div className="mt-6 space-y-5">
        <ScoreBar label="Gem. shadow-score" value={cluster.avg_shadow} color="hsl(var(--destructive))" />
        <ScoreBar label="Gem. exposure-score" value={cluster.avg_exposure} color="hsl(35 92% 50%)" />
        <ScoreBar label="Gem. priority-score" value={cluster.avg_priority} color="hsl(var(--primary))" />

        <div>
          <h4 className="mb-2 text-sm font-semibold">Dominante trigger</h4>
          <p className="text-sm">
            {triggerLabel(cluster.dominant_trigger)}{" "}
            <span className="text-muted-foreground">({cluster.dominant_trigger})</span>
          </p>
        </div>

        {cluster.trigger_codes.length > 0 && (
          <div>
            <h4 className="mb-2 text-sm font-semibold">Alle triggers in dit cluster</h4>
            <div className="flex flex-wrap gap-2">
              {cluster.trigger_codes.map((code) => (
                <Badge key={code} variant="secondary" className="text-xs">
                  {triggerLabel(code)}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="rounded-md bg-muted p-3 text-xs text-muted-foreground">
          Indicatief op basis van zelfrapportage. Menselijk oordeel van de DPO blijft leidend.
        </div>
      </div>
    </>
  );
}

function ReviewDetail({
  data,
}: {
  data: Extract<DpoDrawerData, { mode: "review" }>;
}) {
  const tier = TIER_META[data.assignedTier];
  return (
    <>
      <SheetHeader>
        <div className="flex items-center gap-2">
          {tier && <Badge className={`${tier.bg} ${tier.text} hover:${tier.bg}`}>{tier.label}</Badge>}
          <Badge variant="outline" className="font-mono text-xs">
            {data.caseId}
          </Badge>
        </div>
        <SheetTitle>Reviewcase</SheetTitle>
        <SheetDescription>
          Anonieme case-ID. Geen persoonsgegevens zichtbaar; alleen scores en triggers.
        </SheetDescription>
      </SheetHeader>

      <div className="mt-6 space-y-5">
        <ScoreBar label="Shadow-score" value={data.shadowScore} color="hsl(var(--destructive))" />
        <ScoreBar label="Exposure-score" value={data.exposureScore} color="hsl(35 92% 50%)" />
        <ScoreBar label="Priority-score" value={data.priorityScore} color="hsl(var(--primary))" />

        <div>
          <h4 className="mb-2 text-sm font-semibold">Triggers</h4>
          {data.triggerCodes.length > 0 ? (
            <ul className="space-y-2">
              {data.triggerCodes.map((code) => {
                const meta = TRIGGER_META[code];
                return (
                  <li key={code} className="rounded-md border p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{meta?.label ?? code}</span>
                      <Badge variant="outline" className="font-mono text-[10px]">
                        {code}
                      </Badge>
                    </div>
                    {meta?.description && (
                      <p className="mt-1 text-xs text-muted-foreground">{meta.description}</p>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Geen specifieke triggers.</p>
          )}
        </div>

        <div className="rounded-md bg-muted p-3 text-xs text-muted-foreground">
          Triage vereist menselijke validatie door de DPO. Deze data is indicatief en mag niet als
          juridisch eindoordeel worden gebruikt.
        </div>
      </div>
    </>
  );
}
