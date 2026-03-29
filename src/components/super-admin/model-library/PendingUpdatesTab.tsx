import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Check, X } from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { toast } from 'sonner';
import { useUserProfile } from '@/hooks/useUserProfile';

export function PendingUpdatesTab() {
  const qc = useQueryClient();
  const { profile } = useUserProfile();

  const { data: updates = [], isLoading } = useQuery({
    queryKey: ['typekaart-updates-pending'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('model_typekaart_updates')
        .select(`*, model_typekaarten(display_name, provider)`)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const decide = useMutation({
    mutationFn: async ({ id, decision }: { id: string; decision: 'approved' | 'rejected' }) => {
      const { error } = await supabase
        .from('model_typekaart_updates')
        .update({
          status: decision,
          approved_by: profile?.id,
          approved_at: new Date().toISOString(),
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['typekaart-updates-pending'] });
      toast.success('Beslissing opgeslagen.');
    },
    onError: () => toast.error('Opslaan mislukt.'),
  });

  const CHANGE_LABELS: Record<string, string> = { major: 'Major', minor: 'Minor', patch: 'Patch' };
  const CONFIDENCE_LABELS: Record<string, string> = { high: 'Hoog', medium: 'Middel', low: 'Laag' };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Openstaande updates ({updates.length})</h3>
        <p className="text-sm text-muted-foreground">Wijzigingen wachten op goedkeuring vóór ze gepubliceerd worden.</p>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      ) : updates.length === 0 ? (
        <p className="text-center py-12 text-muted-foreground">Geen openstaande updates.</p>
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Model</TableHead>
                <TableHead>Veld</TableHead>
                <TableHead>Oud</TableHead>
                <TableHead>Nieuw</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Bron</TableHead>
                <TableHead>Zekerheid</TableHead>
                <TableHead>Datum</TableHead>
                <TableHead>Actie</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {updates.map(u => {
                const tk = u.model_typekaarten as Record<string, string> | null;
                return (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium text-sm">{tk?.display_name ?? '—'}</TableCell>
                    <TableCell className="text-sm font-mono">{u.field_name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{u.old_value ?? '—'}</TableCell>
                    <TableCell className="text-sm font-medium">{u.new_value ?? '—'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{CHANGE_LABELS[u.change_type ?? ''] ?? u.change_type}</Badge>
                    </TableCell>
                    <TableCell className="text-xs">{u.source ?? '—'}</TableCell>
                    <TableCell className="text-xs">{CONFIDENCE_LABELS[u.confidence ?? ''] ?? '—'}</TableCell>
                    <TableCell className="text-xs">
                      {u.created_at ? format(new Date(u.created_at), 'd MMM', { locale: nl }) : '—'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-green-700"
                          onClick={() => decide.mutate({ id: u.id, decision: 'approved' })}
                          disabled={decide.isPending}>
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-600"
                          onClick={() => decide.mutate({ id: u.id, decision: 'rejected' })}
                          disabled={decide.isPending}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
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
