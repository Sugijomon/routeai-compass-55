import { Button } from '@/components/ui/button';
import { Bell } from 'lucide-react';

interface Props {
  onSwitchToTypekaarten: () => void;
}

export function AlertsTab({ onSwitchToTypekaarten }: Props) {
  return (
    <div className="text-center py-16 space-y-4">
      <Bell className="h-10 w-10 mx-auto text-muted-foreground" />
      <p className="text-muted-foreground">
        Automatische model-alerts worden hier weergegeven zodra de RSS-adapter actief is.
      </p>
      <Button variant="outline" size="sm" onClick={onSwitchToTypekaarten}>
        Model handmatig toevoegen
      </Button>
    </div>
  );
}
