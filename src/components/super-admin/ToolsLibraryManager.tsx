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
  Wrench,
  HelpCircle,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { EmptyState } from "@/components/ui/empty-state";
import {
  useToolsLibrary,
  useCreateTool,
  useUpdateTool,
  useDeleteTool,
  type ToolLibraryItem,
  type CreateToolInput,
} from "@/hooks/useToolsLibrary";
import { ToolFormDialog } from "./ToolFormDialog";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const CATEGORY_LABELS: Record<string, string> = {
  llm: "LLM",
  image_gen: "Image Gen",
  code_assistant: "Code Assistant",
  audio: "Audio",
  video: "Video",
  data_analysis: "Data Analysis",
  translation: "Translation",
  productivity: "Productivity",
  other: "Other",
};

function StatusBadge({ status }: { status: string | null }) {
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
      return (
        <Badge variant="secondary">Draft</Badge>
      );
  }
}

function ToolUsageCount({ toolId }: { toolId: string }) {
  const { data: count, isLoading } = useQuery({
    queryKey: ["tool-usage-count", toolId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("tools_catalog")
        .select("*", { count: "exact", head: true })
        .eq("tool_id", toolId);
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

export function ToolsLibraryManager() {
  const { data: tools, isLoading, error } = useToolsLibrary();
  const createTool = useCreateTool();
  const updateTool = useUpdateTool();
  const deleteTool = useDeleteTool();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTool, setEditingTool] = useState<ToolLibraryItem | null>(null);
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [toolToDelete, setToolToDelete] = useState<ToolLibraryItem | null>(null);
  
  const [deprecateDialogOpen, setDeprecateDialogOpen] = useState(false);
  const [toolToDeprecate, setToolToDeprecate] = useState<ToolLibraryItem | null>(null);

  const filteredTools = useMemo(() => {
    if (!tools) return [];
    
    return tools.filter((tool) => {
      const matchesSearch =
        tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.vendor.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus =
        statusFilter === "all" || tool.status === statusFilter;
      
      const matchesCategory =
        categoryFilter === "all" || tool.category === categoryFilter;
      
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [tools, searchQuery, statusFilter, categoryFilter]);

  const handleCreateTool = () => {
    setEditingTool(null);
    setIsFormOpen(true);
  };

  const handleEditTool = (tool: ToolLibraryItem) => {
    setEditingTool(tool);
    setIsFormOpen(true);
  };

  const handleFormSubmit = (data: CreateToolInput) => {
    if (editingTool) {
      updateTool.mutate(
        { id: editingTool.id, ...data },
        { onSuccess: () => setIsFormOpen(false) }
      );
    } else {
      createTool.mutate(data, {
        onSuccess: () => setIsFormOpen(false),
      });
    }
  };

  const handleDeleteClick = (tool: ToolLibraryItem) => {
    setToolToDelete(tool);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (toolToDelete) {
      deleteTool.mutate(toolToDelete.id, {
        onSuccess: () => {
          setDeleteDialogOpen(false);
          setToolToDelete(null);
        },
      });
    }
  };

  const handleDeprecateClick = (tool: ToolLibraryItem) => {
    setToolToDeprecate(tool);
    setDeprecateDialogOpen(true);
  };

  const handleConfirmDeprecate = () => {
    if (toolToDeprecate) {
      updateTool.mutate(
        { id: toolToDeprecate.id, status: "deprecated" },
        {
          onSuccess: () => {
            setDeprecateDialogOpen(false);
            setToolToDeprecate(null);
          },
        }
      );
    }
  };

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
        <p className="text-destructive">
          Fout bij laden van tools: {error.message}
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
              placeholder="Zoek op naam, vendor..."
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
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Categorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Categorieën</SelectItem>
              {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleCreateTool}>
          <Plus className="h-4 w-4 mr-2" />
          Tool Toevoegen
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Naam</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead>Categorie</TableHead>
              <TableHead>GPAI</TableHead>
              <TableHead>Hosting</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Gebruik</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                </TableRow>
              ))
            ) : filteredTools.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24">
                  <EmptyState
                    icon={Wrench}
                    title={tools?.length === 0 ? "Nog geen tools in de bibliotheek" : "Geen tools gevonden"}
                    description={tools?.length === 0 
                      ? "Voeg de eerste AI tool toe aan de platform bibliotheek"
                      : "Pas je zoek- of filterinstellingen aan"
                    }
                    action={tools?.length === 0 ? {
                      label: "Tool Toevoegen",
                      onClick: handleCreateTool
                    } : undefined}
                    className="py-8"
                  />
                </TableCell>
              </TableRow>
            ) : (
              filteredTools.map((tool) => (
                <TableRow key={tool.id}>
                  <TableCell className="font-medium">{tool.name}</TableCell>
                  <TableCell>{tool.vendor}</TableCell>
                  <TableCell>
                    {tool.category ? (
                      <Badge variant="outline">
                        {CATEGORY_LABELS[tool.category] || tool.category}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {tool.gpai_status ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 cursor-help">
                              GPAI
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            <p className="text-sm max-w-xs">
                              General Purpose AI — Valt onder EU AI Act artikel 51+. 
                              Vereist extra documentatie en transparantie.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {tool.hosting_location || (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={tool.status} />
                  </TableCell>
                  <TableCell>
                    <ToolUsageCount toolId={tool.id} />
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-background">
                        <DropdownMenuItem onClick={() => handleEditTool(tool)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Bewerken
                        </DropdownMenuItem>
                        {tool.status === "published" && (
                          <DropdownMenuItem
                            onClick={() => handleDeprecateClick(tool)}
                            className="text-orange-600"
                          >
                            <AlertTriangle className="h-4 w-4 mr-2" />
                            Deprecate
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDeleteClick(tool)}
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
      <ToolFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        tool={editingTool}
        onSubmit={handleFormSubmit}
        isLoading={createTool.isPending || updateTool.isPending}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tool Verwijderen</AlertDialogTitle>
            <AlertDialogDescription>
              Weet je zeker dat je <strong>{toolToDelete?.name}</strong> wilt
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
            <AlertDialogTitle>Tool Deprecaten</AlertDialogTitle>
            <AlertDialogDescription>
              Weet je zeker dat je <strong>{toolToDeprecate?.name}</strong> wilt
              deprecaten? De tool blijft beschikbaar voor organisaties die hem al
              gebruiken, maar nieuwe organisaties kunnen hem niet meer toevoegen.
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
