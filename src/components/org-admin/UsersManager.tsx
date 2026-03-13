import React, { useState } from "react";
import { Search, UserPlus, Shield, Award, Users, Edit2, Eye, UserX, FileSpreadsheet } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/ui/stat-card";
import { EmptyState } from "@/components/ui/empty-state";
import { useOrgUsers, useOrgUserStats, OrgUser } from "@/hooks/useOrgUsers";
import EditRolesDialog from "./EditRolesDialog";
import InviteUserDialog from "./InviteUserDialog";
import BulkImportDialog from "./BulkImportDialog";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

const ROLE_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  super_admin: { label: "Super Admin", variant: "destructive" },
  org_admin: { label: "AI Verantwoordelijke", variant: "default" },
  content_editor: { label: "Content Editor", variant: "secondary" },
  manager: { label: "Team Manager", variant: "secondary" },
  moderator: { label: "Moderator", variant: "outline" },
  user: { label: "Gebruiker", variant: "outline" },
};

export default function UsersManager() {
  const { data: users, isLoading, error } = useOrgUsers();
  const stats = useOrgUserStats();
  const [searchTerm, setSearchTerm] = useState("");
  const [editingUser, setEditingUser] = useState<OrgUser | null>(null);
  const [showInviteDialog, setShowInviteDialog] = useState(false);

  // Filter users by search
  const filteredUsers = users?.filter(user => {
    const matchesSearch = 
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.department?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  }) || [];

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <p className="text-destructive">Error loading users: {error.message}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <StatCard
          title="Totaal Gebruikers"
          value={stats.totalUsers}
          icon={Users}
          tooltip="Alle gebruikers in je organisatie"
        />
        <StatCard
          title="Met AI-Rijbewijs"
          value={stats.usersWithRijbewijs}
          subtitle={`${stats.totalUsers > 0 ? Math.round((stats.usersWithRijbewijs / stats.totalUsers) * 100) : 0}% voltooid`}
          icon={Award}
          valueClassName="text-success"
          tooltip="Gebruikers die hun AI-Rijbewijs hebben behaald"
        />
        <StatCard
          title="AI Verantwoordelijken"
          value={stats.roleBreakdown['org_admin'] || 0}
          icon={Shield}
          tooltip="Gebruikers met AI Verantwoordelijke rol"
        />
        <StatCard
          title="Team Managers"
          value={stats.roleBreakdown['manager'] || 0}
          icon={Users}
          tooltip="Gebruikers met Team Manager rol"
        />
      </div>

      {/* Users Table Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Gebruikers</CardTitle>
              <CardDescription>Beheer gebruikers en hun rollen</CardDescription>
            </div>
            <Button onClick={() => setShowInviteDialog(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Uitnodigen
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="mb-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Zoek op naam, email of afdeling..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredUsers.length === 0 ? (
            <EmptyState
              icon={Users}
              title={searchTerm ? "Geen gebruikers gevonden" : "Nog geen gebruikers"}
              description={searchTerm 
                ? "Probeer een andere zoekterm" 
                : "Nodig teamleden uit om te beginnen"
              }
              action={!searchTerm ? {
                label: "Gebruiker uitnodigen",
                onClick: () => setShowInviteDialog(true)
              } : undefined}
            />
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Naam</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Afdeling</TableHead>
                    <TableHead>Rollen</TableHead>
                    <TableHead>AI-Rijbewijs</TableHead>
                    <TableHead>Lid sinds</TableHead>
                    <TableHead className="text-right">Acties</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.full_name || "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {user.email || "—"}
                      </TableCell>
                      <TableCell>
                        {user.department || "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {user.roles.map((role) => {
                            const roleInfo = ROLE_LABELS[role] || { label: role, variant: "outline" as const };
                            return (
                              <Badge key={role} variant={roleInfo.variant} className="text-xs">
                                {roleInfo.label}
                              </Badge>
                            );
                          })}
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.has_ai_rijbewijs ? (
                          <Badge variant="default" className="bg-green-500/10 text-green-600 border-green-500/20">
                            <Award className="h-3 w-3 mr-1" />
                            Behaald
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            Niet behaald
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {user.created_at 
                          ? format(new Date(user.created_at), "d MMM yyyy", { locale: nl })
                          : "—"
                        }
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              •••
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setEditingUser(user)}>
                              <Edit2 className="h-4 w-4 mr-2" />
                              Rollen bewerken
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              Details bekijken
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              <UserX className="h-4 w-4 mr-2" />
                              Deactiveren
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <EditRolesDialog
        user={editingUser}
        open={!!editingUser}
        onOpenChange={(open) => !open && setEditingUser(null)}
      />

      <InviteUserDialog
        open={showInviteDialog}
        onOpenChange={setShowInviteDialog}
      />
    </div>
  );
}
