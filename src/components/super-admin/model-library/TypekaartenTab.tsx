import { useState } from 'react';
import { useModelTypekaarten } from '@/hooks/useModelTypekaarten';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Loader2 } from 'lucide-react';
import { CreateTypekaartDialog } from './CreateTypekaartDialog';

const STATUS_BADGE: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  draft: { label: 'Draft', variant: 'secondary' },
  published: { label: 'Published', variant: 'default' },
  deprecated: { label: 'Deprecated', variant: 'outline' },
};

export function TypekaartenTab() {
  const { data: typekaarten, isLoading } = useModelTypekaarten();
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Typekaarten</h3>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> Nieuwe typekaart
        </Button>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isLoading && typekaarten && typekaarten.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>Nog geen typekaarten aangemaakt.</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => setDialogOpen(true)}>
            Eerste typekaart aanmaken
          </Button>
        </div>
      )}

      {!isLoading && typekaarten && typekaarten.length > 0 && (
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Naam</TableHead>
                <TableHead>Aanbieder</TableHead>
                <TableHead>GPAI</TableHead>
                <TableHead>EU-licentie</TableHead>
                <TableHead>Laatste controle</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {typekaarten.map(tk => {
                const badge = STATUS_BADGE[tk.status] ?? STATUS_BADGE.draft;
                return (
                  <TableRow key={tk.id}>
                    <TableCell>
                      <div>
                        <span className="font-medium">{tk.display_name}</span>
                        <p className="text-xs text-muted-foreground font-mono">{tk.canonical_id}</p>
                      </div>
                    </TableCell>
                    <TableCell>{tk.provider}</TableCell>
                    <TableCell>{tk.gpai_designated ? '✅' : '—'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs capitalize">{tk.eu_license_status}</Badge>
                    </TableCell>
                    <TableCell className="text-xs">
                      {tk.last_verified_at
                        ? new Date(tk.last_verified_at).toLocaleDateString('nl-NL')
                        : <span className="text-muted-foreground">—</span>
                      }
                    </TableCell>
                    <TableCell>
                      <Badge variant={badge.variant} className="text-xs">{badge.label}</Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <CreateTypekaartDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
