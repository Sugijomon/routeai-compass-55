import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Shield, ShieldAlert, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface TypekaartData {
  id: string;
  display_name: string;
  provider: string;
  gpai_designated: boolean;
  systemic_risk: boolean;
  eu_license_status: string;
  data_storage_region: string | null;
  dpa_available: boolean;
  trains_on_input: boolean;
  contractual_restrictions: Array<{ restriction: string; source: string }>;
}

interface Props {
  typekaart: TypekaartData | null;
  onUnlink?: () => void;
}

export function TypekaartBadge({ typekaart, onUnlink }: Props) {
  if (!typekaart) {
    return (
      <Badge variant="outline" className="text-xs text-muted-foreground gap-1">
        <Shield className="h-3 w-3" />
        Geen typekaart
      </Badge>
    );
  }

  // Bepaal risico-indicator op basis van metadata
  const hasRisk = typekaart.systemic_risk || !typekaart.dpa_available || typekaart.trains_on_input;
  const RiskIcon = typekaart.systemic_risk ? ShieldAlert : hasRisk ? Shield : ShieldCheck;
  const badgeColor = typekaart.systemic_risk
    ? 'bg-red-50 text-red-700 border-red-200'
    : hasRisk
    ? 'bg-amber-50 text-amber-700 border-amber-200'
    : 'bg-green-50 text-green-700 border-green-200';

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Badge className={`text-xs cursor-pointer gap-1 ${badgeColor}`} variant="outline">
          <RiskIcon className="h-3 w-3" />
          {typekaart.display_name}
        </Badge>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="p-4 space-y-3">
          {/* Header */}
          <div>
            <p className="font-semibold text-sm">{typekaart.display_name}</p>
            <p className="text-xs text-muted-foreground">{typekaart.provider}</p>
          </div>

          <Separator />

          {/* Key properties */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-muted-foreground">GPAI</span>
              <p className="font-medium">
                {typekaart.gpai_designated ? 'Ja — GPAI model' : 'Nee'}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Systemisch risico</span>
              <p className="font-medium">
                {typekaart.systemic_risk ? 'Ja' : 'Nee'}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Dataopslag</span>
              <p className="font-medium">
                {typekaart.data_storage_region ?? 'Onbekend'}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">DPA beschikbaar</span>
              <p className="font-medium">
                {typekaart.dpa_available ? 'Ja' : 'Nee — let op'}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Training op input</span>
              <p className="font-medium">
                {typekaart.trains_on_input ? 'Ja' : 'Nee'}
              </p>
            </div>
          </div>

          {/* Restricties */}
          {(typekaart.contractual_restrictions as Array<{ restriction: string; source: string }> | null)?.length ? (
            <>
              <Separator />
              <div>
                <p className="text-xs font-medium mb-1">Licentie-opmerkingen</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  {(typekaart.contractual_restrictions as Array<{ restriction: string; source: string }>).slice(0, 2).map((r, i) => (
                    <li key={i}>• {r.restriction}</li>
                  ))}
                </ul>
              </div>
            </>
          ) : null}

          {onUnlink && (
            <>
              <Separator />
              <Button variant="ghost" size="sm" className="w-full text-destructive" onClick={onUnlink}>
                Typekaart ontkoppelen
              </Button>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
