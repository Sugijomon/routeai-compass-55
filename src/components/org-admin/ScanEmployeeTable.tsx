import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Users, Send, Loader2, UserPlus } from "lucide-react";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import BulkImportDialog from "./BulkImportDialog";


type EmployeeStatus = "uitgenodigd" | "ingelogd" | "scan_voltooid" | "heeft_al_account";

interface ScanEmployee {
  id: string;
  email: string | null;
  full_name: string | null;
  department: string | null;
  created_at: string | null;
  status: EmployeeStatus;
}

const STATUS_CONFIG: Record<EmployeeStatus, { label: string; className: string }> = {
  uitgenodigd: {
    label: "Uitgenodigd",
    className: "bg-yellow-100 text-yellow-800 border-yellow-200",
  },
  ingelogd: {
    label: "Ingelogd",
    className: "bg-blue-100 text-blue-800 border-blue-200",
  },
  scan_voltooid: {
    label: "Scan voltooid",
    className: "bg-green-100 text-green-800 border-green-200",
  },
  heeft_al_account: {
    label: "Heeft al account",
    className: "bg-muted text-muted-foreground border-border",
  },
};

export default function ScanEmployeeTable() {
  
  const { profile } = useUserProfile();
  const queryClient = useQueryClient();
  const orgId = profile?.org_id;

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSending, setIsSending] = useState(false);
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  

  // Haal profielen op voor deze organisatie (alleen user-rollen)
  const { data: profiles, isLoading: profilesLoading } = useQuery({
    queryKey: ["scan-employees-profiles", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, full_name, department, created_at")
        .eq("org_id", orgId)
        .order("full_name", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId,
  });

  // Haal shadow_survey_runs op voor de org
  const { data: surveyRuns, isLoading: runsLoading } = useQuery({
    queryKey: ["scan-employees-runs", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from("shadow_survey_runs")
        .select("user_id, survey_completed_at")
        .eq("org_id", orgId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId,
  });

  // Filter admin/dpo rollen eruit — toon alleen reguliere medewerkers
  const { data: adminUserIds } = useQuery({
    queryKey: ["scan-employees-admins", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .eq("org_id", orgId)
        .in("role", ["org_admin", "super_admin", "dpo"]);
      if (error) throw error;
      return [...new Set((data || []).map((r) => r.user_id))];
    },
    enabled: !!orgId,
  });

  // Bereken status per medewerker
  const employees: ScanEmployee[] = useMemo(() => {
    if (!profiles || !surveyRuns) return [];

    const adminSet = new Set(adminUserIds || []);
    const runMap = new Map<string, { completed: boolean }>();
    surveyRuns.forEach((r) => {
      if (r.user_id) {
        const existing = runMap.get(r.user_id);
        // Als er al een voltooide run is, houd die aan
        if (!existing || r.survey_completed_at) {
          runMap.set(r.user_id, { completed: !!r.survey_completed_at });
        }
      }
    });

    return profiles
      .filter((p) => !adminSet.has(p.id))
      .map((p) => {
        const run = runMap.get(p.id);
        let status: EmployeeStatus = "uitgenodigd";
        if (run) {
          status = run.completed ? "scan_voltooid" : "ingelogd";
        }
        return {
          id: p.id,
          email: p.email,
          full_name: p.full_name,
          department: p.department,
          created_at: p.created_at,
          status,
        };
      });
  }, [profiles, surveyRuns, adminUserIds]);

  const invitableEmployees = employees.filter((e) => e.status === "uitgenodigd");
  const allInvitableSelected =
    invitableEmployees.length > 0 &&
    invitableEmployees.every((e) => selectedIds.has(e.id));

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (allInvitableSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(invitableEmployees.map((e) => e.id)));
    }
  };

  const handleSendReminders = async () => {
    if (!orgId || selectedIds.size === 0) return;
    setIsSending(true);

    const selected = employees.filter((e) => selectedIds.has(e.id) && e.email);
    let sentCount = 0;
    const alreadyExisting: { name: string; email: string; date: string }[] = [];

    for (const emp of selected) {
      try {
        const { data, error } = await supabase.functions.invoke("invite-user", {
          body: {
            email: emp.email,
            role: "user",
            orgId,
          },
        });

        if (error) {
          // Als de fout aangeeft dat het account al bestaat
          const errMsg = error.message || "";
          if (errMsg.includes("already") || errMsg.includes("exists") || errMsg.includes("already been registered")) {
            alreadyExisting.push({
              name: emp.full_name || emp.email || "Onbekend",
              email: emp.email || "",
              date: emp.created_at || "",
            });
            continue;
          }
          console.error(`Fout bij herinnering voor ${emp.email}:`, error);
          continue;
        }

        // Check response body voor "already registered" fout
        if (data && !data.success) {
          const msg = data.error || "";
          if (msg.includes("already") || msg.includes("exists") || msg.includes("already been registered")) {
            alreadyExisting.push({
              name: emp.full_name || emp.email || "Onbekend",
              email: emp.email || "",
              date: emp.created_at || "",
            });
            continue;
          }
          console.error(`Fout bij herinnering voor ${emp.email}:`, msg);
          continue;
        }

        sentCount++;
      } catch (err) {
        console.error(`Fout bij herinnering voor ${emp.email}:`, err);
      }
    }

    if (sentCount > 0) {
      toast.success(`Herinnering verstuurd naar ${sentCount} medewerker${sentCount > 1 ? "s" : ""}`);
    }

    if (alreadyExisting.length > 0) {
      alreadyExisting.forEach((user) => {
        const dateStr = user.date
          ? format(new Date(user.date), "d MMMM yyyy", { locale: nl })
          : "onbekend";
        toast.warning(
          `${user.name} (${user.email}) heeft al een account — aangemaakt op ${dateStr}. Er is geen nieuwe uitnodiging verstuurd.`,
          { duration: 8000 }
        );
      });
    }

    // Invalideer queries en reset selectie
    queryClient.invalidateQueries({ queryKey: ["scan-employees-profiles"] });
    queryClient.invalidateQueries({ queryKey: ["scan-employees-runs"] });
    setSelectedIds(new Set());
    setIsSending(false);
  };

  const isLoading = profilesLoading || runsLoading;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div className="space-y-1.5">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5 text-primary" />
            Medewerkers
          </CardTitle>
          <CardDescription>
            Overzicht van uitgenodigde medewerkers en hun scanstatus. Selecteer medewerkers om een herinnering te sturen.
          </CardDescription>
        </div>
        <Button size="sm" onClick={() => setInviteOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Medewerkers uitnodigen
        </Button>
      </CardHeader>
      <CardContent>
        {/* Actiebalk bij selectie */}
        {selectedIds.size > 0 && (
          <div className="mb-4 flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
            <span className="text-sm font-medium">
              {selectedIds.size} medewerker{selectedIds.size > 1 ? "s" : ""} geselecteerd
            </span>
            <Button
              size="sm"
              onClick={handleSendReminders}
              disabled={isSending}
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Stuur herinnering
            </Button>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : employees.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Nog geen medewerkers"
            description="Nodig medewerkers uit via de bulk-import knop rechtsboven."
          />
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    {invitableEmployees.length > 0 && (
                      <Checkbox
                        checked={allInvitableSelected}
                        onCheckedChange={toggleAll}
                        aria-label="Selecteer alle uitgenodigde medewerkers"
                      />
                    )}
                  </TableHead>
                  <TableHead>Naam</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Afdeling</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Uitgenodigd op</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((emp) => {
                  const cfg = STATUS_CONFIG[emp.status];
                  const isInvitable = emp.status === "uitgenodigd";
                  return (
                    <TableRow key={emp.id}>
                      <TableCell>
                        {isInvitable ? (
                          <Checkbox
                            checked={selectedIds.has(emp.id)}
                            onCheckedChange={() => toggleSelect(emp.id)}
                            aria-label={`Selecteer ${emp.full_name || emp.email}`}
                          />
                        ) : null}
                      </TableCell>
                      <TableCell className="font-medium">
                        {emp.full_name || "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {emp.email || "—"}
                      </TableCell>
                      <TableCell>{emp.department || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cfg.className}>
                          {cfg.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {emp.created_at
                          ? format(new Date(emp.created_at), "d MMM yyyy", { locale: nl })
                          : "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <BulkImportDialog
        open={bulkImportOpen}
        onOpenChange={setBulkImportOpen}
      />
      <InviteUserDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
      />
    </Card>
  );
}
