import { useState } from 'react';
import { useTypekaartUpdates, useActionTypekaartUpdate } from '@/hooks/useModelTypekaarten';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

const CONFIDENCE_COLOR: Record<string, string> = {
  high: 'text-green-600',
  medium: 'text-yellow-600',
  low: 'text-red-600',
};

export function PendingUpdatesTab() {
  const { data: updates, isLoading } = useTypekaartUpdates('pending');
  const action = useActionTypekaartUpdate();
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectNotes, setRejectNotes] = useState('');

  const handleApprove = (id: string) => action.mutate({ id, action: 'approved' });

  const handleReject = (id: string) => {
    if (!rejectNotes.trim()) return;
    action.mutate({ id, action: 'rejected', notes: rejectNotes.trim() });
    setRejectId(null);
    setRejectNotes('');
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  if (!updates || updates.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
        <p>Geen openstaande updates.</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Model</TableHead>
            <TableHead>Veld</TableHead>
            <TableHead>Oude waarde</TableHead>
            <TableHead>Nieuwe waarde</TableHead>
            <TableHead>Bron</TableHead>
            <TableHead>Confidence</TableHead>
            <TableHead>Acties</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {updates.map(u => (
            <TableRow key={u.id}>
              <TableCell className="font-medium text-sm">{u.typekaart_display_name}</TableCell>
              <TableCell className="text-sm font-mono">{u.field_name}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{u.old_value ?? '—'}</TableCell>
              <TableCell className="text-sm font-medium">{u.new_value ?? '—'}</TableCell>
              <TableCell className="text-xs">{u.source ?? '—'}</TableCell>
              <TableCell>
                {u.confidence && (
                  <Badge variant="outline" className={`text-xs ${CONFIDENCE_COLOR[u.confidence] ?? ''}`}>
                    {u.confidence}
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                {rejectId === u.id ? (
                  <div className="space-y-2 min-w-[200px]">
                    <Textarea
                      value={rejectNotes}
                      onChange={e => setRejectNotes(e.target.value)}
                      placeholder="Reden voor afwijzing..."
                      rows={2}
                    />
                    <div className="flex gap-1">
                      <Button size="sm" variant="destructive" onClick={() => handleReject(u.id)} disabled={!rejectNotes.trim()}>
                        Bevestig
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => { setRejectId(null); setRejectNotes(''); }}>
                        Annuleer
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" onClick={() => handleApprove(u.id)} disabled={action.isPending}>
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Goedkeuren
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setRejectId(u.id)}>
                      <XCircle className="h-3.5 w-3.5 mr-1" /> Afwijzen
                    </Button>
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
