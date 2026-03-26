import { useState, useMemo } from 'react';
import { useTypekaartUpdates, useModelTypekaarten } from '@/hooks/useModelTypekaarten';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2 } from 'lucide-react';

const CHANGE_TYPE_BADGE: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  major: { label: 'Major', variant: 'default' },
  minor: { label: 'Minor', variant: 'secondary' },
  patch: { label: 'Patch', variant: 'outline' },
};

const STATUS_BADGE: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  pending: { label: 'Pending', variant: 'secondary' },
  approved: { label: 'Goedgekeurd', variant: 'default' },
  rejected: { label: 'Afgewezen', variant: 'destructive' },
};

export function ChangelogTab() {
  const { data: updates, isLoading } = useTypekaartUpdates();
  const { data: typekaarten } = useModelTypekaarten();
  const [filterTypekaart, setFilterTypekaart] = useState('all');
  const [filterChangeType, setFilterChangeType] = useState('all');

  const filtered = useMemo(() => {
    if (!updates) return [];
    return updates.filter(u => {
      if (filterTypekaart !== 'all' && u.typekaart_id !== filterTypekaart) return false;
      if (filterChangeType !== 'all' && u.change_type !== filterChangeType) return false;
      return true;
    });
  }, [updates, filterTypekaart, filterChangeType]);

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-3">
        <Select value={filterTypekaart} onValueChange={setFilterTypekaart}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Filter op model" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle modellen</SelectItem>
            {(typekaarten ?? []).map(tk => (
              <SelectItem key={tk.id} value={tk.id}>{tk.display_name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterChangeType} onValueChange={setFilterChangeType}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Change type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle types</SelectItem>
            <SelectItem value="major">Major</SelectItem>
            <SelectItem value="minor">Minor</SelectItem>
            <SelectItem value="patch">Patch</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          Geen changelog-items gevonden.
        </div>
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Datum</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Veld</TableHead>
                <TableHead>Oud → Nieuw</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(u => {
                const ct = u.change_type ? CHANGE_TYPE_BADGE[u.change_type] : null;
                const st = STATUS_BADGE[u.status] ?? STATUS_BADGE.pending;
                return (
                  <TableRow key={u.id}>
                    <TableCell className="text-xs whitespace-nowrap">
                      {new Date(u.created_at).toLocaleDateString('nl-NL')}
                    </TableCell>
                    <TableCell className="font-medium text-sm">{u.typekaart_display_name}</TableCell>
                    <TableCell className="text-sm font-mono">{u.field_name}</TableCell>
                    <TableCell className="text-sm">
                      <span className="text-muted-foreground">{u.old_value ?? '—'}</span>
                      <span className="mx-1">→</span>
                      <span className="font-medium">{u.new_value ?? '—'}</span>
                    </TableCell>
                    <TableCell>
                      {ct && <Badge variant={ct.variant} className="text-xs">{ct.label}</Badge>}
                    </TableCell>
                    <TableCell>
                      <Badge variant={st.variant as 'default' | 'secondary' | 'outline' | 'destructive'} className="text-xs">{st.label}</Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
