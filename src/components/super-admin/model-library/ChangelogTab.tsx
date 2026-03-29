import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

export function ChangelogTab() {
  const { data: log = [], isLoading } = useQuery({
    queryKey: ['typekaart-changelog'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('model_typekaart_updates')
        .select(`*, model_typekaarten(display_name)`)
        .in('status', ['approved', 'rejected'])
        .order('approved_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data ?? [];
    },
  });

  const STATUS_COLORS: Record<string, string> = {
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
  };
  const STATUS_LABELS: Record<string, string> = { approved: 'Goedgekeurd', rejected: 'Afgewezen' };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Laatste 100 afgehandelde wijzigingen.</p>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
        </div>
      ) : log.length === 0 ? (
        <p className="text-center py-12 text-muted-foreground">Nog geen afgehandelde wijzigingen.</p>
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Model</TableHead>
                <TableHead>Veld</TableHead>
                <TableHead>Nieuwe waarde</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Datum</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {log.map(entry => {
                const tk = entry.model_typekaarten as Record<string, string> | null;
                return (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium text-sm">{tk?.display_name ?? '—'}</TableCell>
                    <TableCell className="text-sm font-mono">{entry.field_name}</TableCell>
                    <TableCell className="text-sm">{entry.new_value ?? '—'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{entry.change_type ?? '—'}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={`text-xs ${STATUS_COLORS[entry.status ?? ''] ?? ''}`}>
                        {STATUS_LABELS[entry.status ?? ''] ?? entry.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">
                      {entry.approved_at ? format(new Date(entry.approved_at), 'd MMM yyyy', { locale: nl }) : '—'}
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
