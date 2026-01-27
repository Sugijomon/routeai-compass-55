import React, { useState } from "react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { Search, Building2, MoreHorizontal, Eye, Edit, Ban, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Organization } from "@/hooks/useOrganizations";
import { CreateOrganizationDialog } from "./CreateOrganizationDialog";

interface OrganizationsTableProps {
  organizations: Organization[] | undefined;
  isLoading: boolean;
  onSelectOrganization?: (org: Organization) => void;
}

export function OrganizationsTable({ 
  organizations, 
  isLoading, 
  onSelectOrganization 
}: OrganizationsTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [subscriptionFilter, setSubscriptionFilter] = useState<string>("all");

  const filteredOrgs = organizations?.filter((org) => {
    const matchesSearch = 
      org.name.toLowerCase().includes(search.toLowerCase()) ||
      org.contact_email?.toLowerCase().includes(search.toLowerCase()) ||
      org.contact_person?.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || org.status === statusFilter;
    const matchesSubscription = subscriptionFilter === "all" || org.subscription_type === subscriptionFilter;

    return matchesSearch && matchesStatus && matchesSubscription;
  }) ?? [];

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "active":
        return <Badge className="bg-route-green/10 text-route-green border-route-green/20">Actief</Badge>;
      case "expired":
        return <Badge className="bg-route-yellow/10 text-route-yellow border-route-yellow/20">Verlopen</Badge>;
      case "test":
        return <Badge variant="secondary">Test</Badge>;
      case "suspended":
        return <Badge className="bg-route-red/10 text-route-red border-route-red/20">Geschorst</Badge>;
      default:
        return <Badge variant="outline">Onbekend</Badge>;
    }
  };

  const getSubscriptionBadge = (type: string | null) => {
    switch (type) {
      case "premium":
        return <Badge className="bg-primary/10 text-primary border-primary/20">Premium</Badge>;
      case "enterprise":
        return <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/20">Enterprise</Badge>;
      case "basic":
        return <Badge variant="outline">Basic</Badge>;
      default:
        return <Badge variant="outline">—</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Organisaties Overzicht
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Organisaties Overzicht
          </CardTitle>
          <CardDescription>Beheer alle organisaties op het platform</CardDescription>
        </div>
        <CreateOrganizationDialog
          trigger={
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nieuwe Organisatie
            </Button>
          }
        />
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Zoek op naam, e-mail of contactpersoon..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-background">
              <SelectItem value="all">Alle statussen</SelectItem>
              <SelectItem value="active">Actief</SelectItem>
              <SelectItem value="expired">Verlopen</SelectItem>
              <SelectItem value="test">Test</SelectItem>
              <SelectItem value="suspended">Geschorst</SelectItem>
            </SelectContent>
          </Select>
          <Select value={subscriptionFilter} onValueChange={setSubscriptionFilter}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Abonnement" />
            </SelectTrigger>
            <SelectContent className="bg-background">
              <SelectItem value="all">Alle types</SelectItem>
              <SelectItem value="basic">Basic</SelectItem>
              <SelectItem value="premium">Premium</SelectItem>
              <SelectItem value="enterprise">Enterprise</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Naam</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Abonnement</TableHead>
                <TableHead>Contactpersoon</TableHead>
                <TableHead>Einddatum</TableHead>
                <TableHead className="w-[70px]">Acties</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrgs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Geen organisaties gevonden
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrgs.map((org) => (
                  <TableRow 
                    key={org.id} 
                    className="cursor-pointer"
                    onClick={() => onSelectOrganization?.(org)}
                  >
                    <TableCell className="font-medium">{org.name}</TableCell>
                    <TableCell>{getStatusBadge(org.status)}</TableCell>
                    <TableCell>{getSubscriptionBadge(org.subscription_type)}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{org.contact_person || "—"}</div>
                        <div className="text-muted-foreground text-xs">
                          {org.contact_email || "—"}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {org.subscription_end_date
                        ? format(new Date(org.subscription_end_date), "d MMM yyyy", { locale: nl })
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-background">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onSelectOrganization?.(org); }}>
                            <Eye className="h-4 w-4 mr-2" />
                            Bekijken
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                            <Edit className="h-4 w-4 mr-2" />
                            Bewerken
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={(e) => e.stopPropagation()}
                            className="text-destructive focus:text-destructive"
                          >
                            <Ban className="h-4 w-4 mr-2" />
                            Schorsen
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Summary */}
        <div className="text-sm text-muted-foreground">
          {filteredOrgs.length} van {organizations?.length ?? 0} organisaties weergegeven
        </div>
      </CardContent>
    </Card>
  );
}
