import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Shield, UserMinus, UserPlus, ShieldCheck, ShieldOff } from 'lucide-react';

type AuditEntry = {
  id: string;
  actor_id: string;
  action: string;
  target_table: string;
  target_id: string;
  target_user_id: string | null;
  org_id: string | null;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  reason: string | null;
  created_at: string;
};

type ProfileInfo = { id: string; full_name: string | null; email: string | null };
type OrgInfo = { id: string; name: string };

const ACTION_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  'role.assign': { label: 'Rol toegekend', variant: 'default' },
  'role.revoke': { label: 'Rol ingetrokken', variant: 'destructive' },
  'user.deactivate': { label: 'Gedeactiveerd', variant: 'destructive' },
  'user.reactivate': { label: 'Geactiveerd', variant: 'default' },
};

const ACTION_ICONS: Record<string, typeof Shield> = {
  'role.assign': ShieldCheck,
  'role.revoke': ShieldOff,
  'user.deactivate': UserMinus,
  'user.reactivate': UserPlus,
};

function formatChange(old_value: Record<string, unknown> | null, new_value: Record<string, unknown> | null): string {
  if (!old_value && new_value) return JSON.stringify(new_value);
  if (old_value && !new_value) return `verwijderd: ${JSON.stringify(old_value)}`;
  if (old_value && new_value) {
    const parts: string[] = [];
    for (const key of Object.keys({ ...old_value, ...new_value })) {
      const o = old_value[key];
      const n = new_value[key];
      if (o !== n) parts.push(`${key}: ${String(o ?? '–')} → ${String(n ?? '–')}`);
    }
    return parts.join(', ') || '–';
  }
  return '–';
}

export default function AuditLogPage() {
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');

  // Haal audit log op
  const { data: entries, isLoading } = useQuery({
    queryKey: ['admin-audit-log'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as AuditEntry[];
    },
  });

  // Haal profielen op voor actor/target namen
  const profileIds = [
    ...new Set(
      (entries ?? []).flatMap(e => [e.actor_id, e.target_user_id].filter(Boolean) as string[])
    ),
  ];

  const { data: profiles } = useQuery({
    queryKey: ['audit-profiles', profileIds.join(',')],
    enabled: profileIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', profileIds);
      return (data ?? []) as ProfileInfo[];
    },
  });

  // Haal organisaties op
  const orgIds = [...new Set((entries ?? []).map(e => e.org_id).filter(Boolean) as string[])];

  const { data: orgs } = useQuery({
    queryKey: ['audit-orgs', orgIds.join(',')],
    enabled: orgIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase.from('organizations').select('id, name').in('id', orgIds);
      return (data ?? []) as OrgInfo[];
    },
  });

  const profileMap = new Map((profiles ?? []).map(p => [p.id, p]));
  const orgMap = new Map((orgs ?? []).map(o => [o.id, o]));

  const getName = (id: string | null) => {
    if (!id) return '–';
    const p = profileMap.get(id);
    return p?.full_name || p?.email || id.slice(0, 8);
  };

  const getOrgName = (id: string | null) => {
    if (!id) return '–';
    return orgMap.get(id)?.name || id.slice(0, 8);
  };

  // Filteren
  const filtered = (entries ?? []).filter(e => {
    if (actionFilter !== 'all' && e.action !== actionFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const actorName = getName(e.actor_id).toLowerCase();
      const targetName = getName(e.target_user_id).toLowerCase();
      const orgName = getOrgName(e.org_id).toLowerCase();
      if (
        !actorName.includes(q) &&
        !targetName.includes(q) &&
        !orgName.includes(q) &&
        !e.action.toLowerCase().includes(q)
      )
        return false;
    }
    return true;
  });

  return (
    <AppLayout>
      <main className="container mx-auto px-4 py-8 space-y-6">
        <PageHeader title="Auditlog" description="Overzicht van alle beheeracties op het platform" />

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Zoek op naam, e-mail of organisatie..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Alle acties" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle acties</SelectItem>
              <SelectItem value="role.assign">Rol toegekend</SelectItem>
              <SelectItem value="role.revoke">Rol ingetrokken</SelectItem>
              <SelectItem value="user.deactivate">Gedeactiveerd</SelectItem>
              <SelectItem value="user.reactivate">Geactiveerd</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tabel */}
        <div className="border rounded-lg overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[160px]">Tijdstip</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Actie</TableHead>
                <TableHead>Betrokken gebruiker</TableHead>
                <TableHead>Organisatie</TableHead>
                <TableHead>Wijziging</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Geen audit-entries gevonden
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map(entry => {
                  const actionInfo = ACTION_LABELS[entry.action] ?? { label: entry.action, variant: 'outline' as const };
                  const Icon = ACTION_ICONS[entry.action] ?? Shield;
                  return (
                    <TableRow key={entry.id}>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(entry.created_at).toLocaleString('nl-NL', {
                          day: '2-digit', month: '2-digit', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </TableCell>
                      <TableCell className="font-medium text-sm">
                        {getName(entry.actor_id)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={actionInfo.variant} className="gap-1">
                          <Icon className="h-3 w-3" />
                          {actionInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {getName(entry.target_user_id)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {getOrgName(entry.org_id)}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[250px] truncate">
                        {formatChange(entry.old_value, entry.new_value)}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </main>
    </AppLayout>
  );
}
