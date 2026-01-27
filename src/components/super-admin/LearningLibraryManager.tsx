import React, { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Building2,
  BookOpen,
  FileText,
  ClipboardCheck,
  Folder,
  Clock,
  GraduationCap,
} from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import {
  useLearningLibrary,
  useCreateLearning,
  useUpdateLearning,
  useDeleteLearning,
  type LearningLibraryItem,
  type CreateLearningInput,
} from "@/hooks/useLearningLibrary";
import { LearningFormDialog } from "./LearningFormDialog";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const TYPE_CONFIG: Record<string, { label: string; icon: React.ReactNode }> = {
  course: { label: "Course", icon: <BookOpen className="h-4 w-4" /> },
  module: { label: "Module", icon: <Folder className="h-4 w-4" /> },
  assessment: { label: "Assessment", icon: <ClipboardCheck className="h-4 w-4" /> },
  document: { label: "Document", icon: <FileText className="h-4 w-4" /> },
};

const DIFFICULTY_CONFIG: Record<string, { label: string; className: string }> = {
  basic: { label: "Basis", className: "bg-green-500/10 text-green-600 border-green-500/20" },
  intermediate: { label: "Gevorderd", className: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20" },
  advanced: { label: "Expert", className: "bg-red-500/10 text-red-600 border-red-500/20" },
};

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "published":
      return (
        <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Published
        </Badge>
      );
    case "deprecated":
      return (
        <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/20">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Deprecated
        </Badge>
      );
    default:
      return <Badge variant="secondary">Draft</Badge>;
  }
}

function LearningUsageCount({ itemId }: { itemId: string }) {
  const { data: count, isLoading } = useQuery({
    queryKey: ["learning-usage-count", itemId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("learning_catalog")
        .select("*", { count: "exact", head: true })
        .eq("library_item_id", itemId);
      if (error) throw error;
      return count || 0;
    },
  });

  if (isLoading) return <Skeleton className="h-4 w-8" />;
  if (count === 0) return null;

  return (
    <Badge variant="outline" className="gap-1">
      <Building2 className="h-3 w-3" />
      {count}
    </Badge>
  );
}

export function LearningLibraryManager() {
  const { data: items, isLoading, error } = useLearningLibrary();
  const createLearning = useCreateLearning();
  const updateLearning = useUpdateLearning();
  const deleteLearning = useDeleteLearning();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<LearningLibraryItem | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<LearningLibraryItem | null>(null);

  const [deprecateDialogOpen, setDeprecateDialogOpen] = useState(false);
  const [itemToDeprecate, setItemToDeprecate] = useState<LearningLibraryItem | null>(null);

  const filteredItems = useMemo(() => {
    if (!items) return [];

    return items.filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || item.status === statusFilter;

      const matchesType =
        typeFilter === "all" || item.content_type === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [items, searchQuery, statusFilter, typeFilter]);

  const handleCreateItem = () => {
    setEditingItem(null);
    setIsFormOpen(true);
  };

  const handleEditItem = (item: LearningLibraryItem) => {
    setEditingItem(item);
    setIsFormOpen(true);
  };

  const handleFormSubmit = (data: CreateLearningInput) => {
    if (editingItem) {
      updateLearning.mutate(
        { id: editingItem.id, ...data },
        { onSuccess: () => setIsFormOpen(false) }
      );
    } else {
      createLearning.mutate(data, {
        onSuccess: () => setIsFormOpen(false),
      });
    }
  };

  const handleDeleteClick = (item: LearningLibraryItem) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (itemToDelete) {
      deleteLearning.mutate(itemToDelete.id, {
        onSuccess: () => {
          setDeleteDialogOpen(false);
          setItemToDelete(null);
        },
      });
    }
  };

  const handleDeprecateClick = (item: LearningLibraryItem) => {
    setItemToDeprecate(item);
    setDeprecateDialogOpen(true);
  };

  const handleConfirmDeprecate = () => {
    if (itemToDeprecate) {
      updateLearning.mutate(
        { id: itemToDeprecate.id, status: "deprecated" },
        {
          onSuccess: () => {
            setDeprecateDialogOpen(false);
            setItemToDeprecate(null);
          },
        }
      );
    }
  };

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
        <p className="text-destructive">
          Fout bij laden van content: {error.message}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-1 gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Zoek op titel..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="deprecated">Deprecated</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Types</SelectItem>
              <SelectItem value="course">Course</SelectItem>
              <SelectItem value="module">Module</SelectItem>
              <SelectItem value="assessment">Assessment</SelectItem>
              <SelectItem value="document">Document</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleCreateItem}>
          <Plus className="h-4 w-4 mr-2" />
          Content Toevoegen
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Titel</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Niveau</TableHead>
              <TableHead>Duur</TableHead>
              <TableHead>Versie</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Gebruik</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-10" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                </TableRow>
              ))
            ) : filteredItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24">
                  <EmptyState
                    icon={GraduationCap}
                    title={items?.length === 0 ? "Nog geen content in de bibliotheek" : "Geen content gevonden"}
                    description={items?.length === 0 
                      ? "Voeg trainingsmateriaal toe voor AI-Rijbewijs"
                      : "Pas je zoek- of filterinstellingen aan"
                    }
                    action={items?.length === 0 ? {
                      label: "Content Toevoegen",
                      onClick: handleCreateItem
                    } : undefined}
                    className="py-8"
                  />
                </TableCell>
              </TableRow>
            ) : (
              filteredItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.title}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="gap-1">
                      {TYPE_CONFIG[item.content_type]?.icon}
                      {TYPE_CONFIG[item.content_type]?.label || item.content_type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {item.difficulty_level ? (
                      <Badge className={DIFFICULTY_CONFIG[item.difficulty_level]?.className}>
                        {DIFFICULTY_CONFIG[item.difficulty_level]?.label}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {item.estimated_duration_minutes ? (
                      <span className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {item.estimated_duration_minutes}m
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {item.version || "1.0"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={item.status} />
                  </TableCell>
                  <TableCell>
                    <LearningUsageCount itemId={item.id} />
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-background">
                        <DropdownMenuItem onClick={() => handleEditItem(item)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Bewerken
                        </DropdownMenuItem>
                        {item.status === "published" && (
                          <DropdownMenuItem
                            onClick={() => handleDeprecateClick(item)}
                            className="text-orange-600"
                          >
                            <AlertTriangle className="h-4 w-4 mr-2" />
                            Deprecate
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDeleteClick(item)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Verwijderen
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

      {/* Form Dialog */}
      <LearningFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        item={editingItem}
        onSubmit={handleFormSubmit}
        isLoading={createLearning.isPending || updateLearning.isPending}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Content Verwijderen</AlertDialogTitle>
            <AlertDialogDescription>
              Weet je zeker dat je <strong>{itemToDelete?.title}</strong> wilt
              verwijderen? Deze actie kan niet ongedaan worden gemaakt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuleren</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Verwijderen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Deprecate Confirmation */}
      <AlertDialog open={deprecateDialogOpen} onOpenChange={setDeprecateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Content Deprecaten</AlertDialogTitle>
            <AlertDialogDescription>
              Weet je zeker dat je <strong>{itemToDeprecate?.title}</strong> wilt
              deprecaten? De content blijft beschikbaar voor organisaties die het al
              gebruiken, maar nieuwe organisaties kunnen het niet meer toevoegen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuleren</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeprecate}
              className="bg-orange-500 text-white hover:bg-orange-600"
            >
              Deprecate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
