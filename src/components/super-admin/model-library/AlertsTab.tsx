import { Card, CardContent } from '@/components/ui/card';
import { Bell } from 'lucide-react';

export function AlertsTab() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-16 space-y-4">
        <div className="rounded-full bg-muted p-4">
          <Bell className="h-8 w-8 text-muted-foreground" />
        </div>

        <div className="text-center space-y-1">
          <p className="font-medium">Automatische model-alerts</p>
          <p className="text-sm text-muted-foreground max-w-md">
            Nieuwe modellen gedetecteerd via RSS of model card adapters verschijnen hier.
            De RSS-adapter is een post-launch feature (Sprint 3g).
          </p>
        </div>

        <p className="text-xs text-muted-foreground">
          Voorlopig: voeg nieuwe typekaarten handmatig toe via het tabblad "Typekaarten".
        </p>
      </CardContent>
    </Card>
  );
}
