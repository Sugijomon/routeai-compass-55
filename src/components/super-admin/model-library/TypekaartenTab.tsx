import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { CreateTypekaartDialog } from './CreateTypekaartDialog';
import { Plus, Search, Edit2, Archive } from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { toast } from 'sonner';

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    published: 'bg-green-100 text-green-800',
    draft: 'bg-amber-100 text-amber-800',
    deprecated: 'bg-gray-100 text-gray-600',
  };
  const labels: Record<string, string> = { published: 'Gepubliceerd', draft: 'Draft', deprecated: 'Gearchiveerd' };
  return <Badge className={`text-xs ${map[status] ?? ''}`}>{labels[status] ?? status}</Badge>;
}

export function TypekaartenTab() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: typekaarten = [], isLoading } = useQuery({
    queryKey: ['typekaarten-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('model_typekaarten')
        .select('*')
        .order('provider', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const archive = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('model_typekaarten')
        .update({ status: 'deprecated' })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['typekaarten-all'] });
      toast.success('Typekaart gearchiveerd.');
    },
    onError: () => toast.error('Archiveren mislukt.'),
  });

  const filtered = typekaarten.filter(t =>
    t.display_name.toLowerCase().includes(search.toLowerCase()) ||
    t.provider.toLowerCase().includes(search.toLowerCase()) ||
    t.canonical_id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Zoek op naam, aanbieder of ID…" value={search}
            onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nieuwe typekaart
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Model</TableHead>
                <TableHead>Aanbieder</TableHead>
                <TableHead>GPAI</TableHead>
                <TableHead>Syst. risico</TableHead>
                <TableHead>EU-licentie</TableHead>
                <TableHead>Dataopslag</TableHead>
                <TableHead>DPA</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Versie</TableHead>
                <TableHead>Gecontroleerd</TableHead>
                <TableHead>Acties</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                    {search ? 'Geen typekaarten gevonden.' : 'Nog geen typekaarten aangemaakt.'}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map(t => (
                  <TableRow key={t.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{t.display_name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{t.canonical_id}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{t.provider}</TableCell>
                    <TableCell>
                      {t.gpai_designated
                        ? <Badge variant="default" className="text-xs">Ja</Badge>
                        : <span className="text-xs text-muted-foreground">Nee</span>}
                    </TableCell>
                    <TableCell>
                      {t.systemic_risk
                        ? <Badge variant="destructive" className="text-xs">Ja</Badge>
                        : <span className="text-xs text-muted-foreground">Nee</span>}
                    </TableCell>
                    <TableCell className="text-sm">{t.eu_license_status ?? '—'}</TableCell>
                    <TableCell>
                      <span className="text-xs">{t.data_storage_region ?? '—'}</span>
                    </TableCell>
                    <TableCell>
                      {t.dpa_available
                        ? <Badge variant="outline" className="text-xs text-green-700">Ja</Badge>
                        : <span className="text-xs text-muted-foreground">Nee</span>}
                    </TableCell>
                    <TableCell><StatusBadge status={t.status ?? 'draft'} /></TableCell>
                    <TableCell className="text-xs">{t.typekaart_version ?? '—'}</TableCell>
                    <TableCell className="text-xs">
                      {t.last_verified_at ? format(new Date(t.last_verified_at), 'd MMM yyyy', { locale: nl }) : '—'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7"
                          onClick={() => setEditingId(t.id)} title="Bewerken">
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        {t.status !== 'deprecated' && (
                          <Button variant="ghost" size="icon" className="h-7 w-7"
                            onClick={() => archive.mutate(t.id)} title="Archiveren">
                            <Archive className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <CreateTypekaartDialog
        open={createOpen || !!editingId}
        onOpenChange={(open) => { if (!open) { setCreateOpen(false); setEditingId(null); } }}
        editId={editingId}
      />
    </div>
  );
}
