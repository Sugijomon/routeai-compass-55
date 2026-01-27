import React, { useState } from "react";
import {
  GraduationCap,
  Search,
  Clock,
  Target,
  BookOpen,
  CheckCircle2,
  Filter,
  ChevronDown,
  ChevronUp,
  Save,
  Users,
  Calendar,
  Star,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { EmptyState } from "@/components/ui/empty-state";
import {
  useOrgLearningCatalog,
  useOrgLearningStats,
  useToggleLearningCatalog,
  useUpdateLearningCatalog,
  OrgLearningItem,
} from "@/hooks/useOrgLearningCatalog";

const CONTENT_TYPE_LABELS: Record<string, string> = {
  course: "Cursus",
  module: "Module",
  assessment: "Toets",
  document: "Document",
};

const DIFFICULTY_LABELS: Record<string, string> = {
  basic: "Basis",
  intermediate: "Gemiddeld",
  advanced: "Gevorderd",
};

const DIFFICULTY_COLORS: Record<string, string> = {
  basic: "bg-green-100 text-green-800",
  intermediate: "bg-yellow-100 text-yellow-800",
  advanced: "bg-red-100 text-red-800",
};

const ROLE_OPTIONS = [
  { value: "user", label: "Gebruiker" },
  { value: "manager", label: "Manager" },
  { value: "org_admin", label: "Org Admin" },
  { value: "content_editor", label: "Content Editor" },
];

interface LearningCardProps {
  item: OrgLearningItem;
  onToggle: (libraryItemId: string, catalogId: string | null, isEnabled: boolean) => void;
  onUpdate: (catalogId: string, updates: Record<string, unknown>) => void;
  isToggling: boolean;
}

function LearningCard({ item, onToggle, onUpdate, isToggling }: LearningCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMandatory, setIsMandatory] = useState(item.is_mandatory);
  const [deadline, setDeadline] = useState<Date | undefined>(
    item.custom_deadline ? new Date(item.custom_deadline) : undefined
  );
  const [assignedRoles, setAssignedRoles] = useState<string[]>(item.assigned_to_roles || []);
  const [customIntro, setCustomIntro] = useState(item.custom_intro || "");
  const [hasChanges, setHasChanges] = useState(false);

  const handleToggle = () => {
    onToggle(item.id, item.catalog_id, !item.is_enabled);
  };

  const handleSave = () => {
    if (!item.catalog_id) return;
    
    onUpdate(item.catalog_id, {
      is_mandatory: isMandatory,
      custom_deadline: deadline ? format(deadline, "yyyy-MM-dd") : null,
      assigned_to_roles: assignedRoles.length > 0 ? assignedRoles : null,
      custom_intro: customIntro || null,
    });
    setHasChanges(false);
  };

  const handleFieldChange = () => {
    setHasChanges(true);
  };

  const toggleRole = (role: string) => {
    setAssignedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
    handleFieldChange();
  };

  return (
    <Card className={cn(
      "transition-all",
      item.is_enabled && "border-primary/30 bg-primary/5"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">{item.title}</CardTitle>
              {item.is_enabled && item.is_mandatory && (
                <Badge variant="destructive" className="text-xs">Verplicht</Badge>
              )}
            </div>
            <CardDescription className="line-clamp-2">
              {item.description || "Geen beschrijving"}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={item.is_enabled}
              onCheckedChange={handleToggle}
              disabled={isToggling}
            />
          </div>
        </div>

        {/* Metadata badges */}
        <div className="flex flex-wrap gap-2 pt-2">
          <Badge variant="outline">
            <BookOpen className="h-3 w-3 mr-1" />
            {CONTENT_TYPE_LABELS[item.content_type] || item.content_type}
          </Badge>
          {item.difficulty_level && (
            <Badge className={DIFFICULTY_COLORS[item.difficulty_level]}>
              {DIFFICULTY_LABELS[item.difficulty_level] || item.difficulty_level}
            </Badge>
          )}
          {item.estimated_duration_minutes && (
            <Badge variant="secondary">
              <Clock className="h-3 w-3 mr-1" />
              {item.estimated_duration_minutes} min
            </Badge>
          )}
          {item.required_for_license && item.required_for_license.length > 0 && (
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              <Star className="h-3 w-3 mr-1" />
              {item.required_for_license.join(", ")}
            </Badge>
          )}
        </div>

        {/* Learning objectives */}
        {item.learning_objectives && item.learning_objectives.length > 0 && (
          <div className="pt-2">
            <p className="text-xs text-muted-foreground mb-1">Leerdoelen:</p>
            <div className="flex flex-wrap gap-1">
              {item.learning_objectives.slice(0, 3).map((objective, idx) => (
                <Badge key={idx} variant="outline" className="text-xs font-normal">
                  <Target className="h-3 w-3 mr-1" />
                  {objective}
                </Badge>
              ))}
              {item.learning_objectives.length > 3 && (
                <Badge variant="outline" className="text-xs font-normal">
                  +{item.learning_objectives.length - 3} meer
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardHeader>

      {/* Expandable configuration section - only when enabled */}
      {item.is_enabled && (
        <>
          <CardContent className="pt-0">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-between"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <span className="text-sm text-muted-foreground">
                {isExpanded ? "Configuratie verbergen" : "Configuratie tonen"}
              </span>
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>

            {isExpanded && (
              <div className="mt-4 space-y-4 pt-4 border-t">
                {/* Mandatory toggle */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">Verplichte training</Label>
                    <p className="text-xs text-muted-foreground">
                      Gebruikers moeten deze training voltooien
                    </p>
                  </div>
                  <Checkbox
                    checked={isMandatory}
                    onCheckedChange={(checked) => {
                      setIsMandatory(checked === true);
                      handleFieldChange();
                    }}
                  />
                </div>

                {/* Deadline */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Deadline
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !deadline && "text-muted-foreground"
                        )}
                      >
                        {deadline ? (
                          format(deadline, "PPP", { locale: nl })
                        ) : (
                          <span>Selecteer een deadline</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-background z-50" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={deadline}
                        onSelect={(date) => {
                          setDeadline(date);
                          handleFieldChange();
                        }}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  {deadline && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setDeadline(undefined);
                        handleFieldChange();
                      }}
                    >
                      Deadline verwijderen
                    </Button>
                  )}
                </div>

                {/* Assigned roles */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Toegewezen aan rollen
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {ROLE_OPTIONS.map((role) => (
                      <Badge
                        key={role.value}
                        variant={assignedRoles.includes(role.value) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleRole(role.value)}
                      >
                        {role.label}
                        {assignedRoles.includes(role.value) && (
                          <CheckCircle2 className="h-3 w-3 ml-1" />
                        )}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Leeg = beschikbaar voor iedereen
                  </p>
                </div>

                {/* Custom intro text */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Aangepaste introductie</Label>
                  <Textarea
                    placeholder="Optionele introductietekst voor je organisatie..."
                    value={customIntro}
                    onChange={(e) => {
                      setCustomIntro(e.target.value);
                      handleFieldChange();
                    }}
                    rows={3}
                  />
                </div>

                {/* Save button */}
                {hasChanges && (
                  <Button onClick={handleSave} className="w-full">
                    <Save className="h-4 w-4 mr-2" />
                    Instellingen opslaan
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </>
      )}
    </Card>
  );
}

export default function LearningCatalogManager() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterDifficulty, setFilterDifficulty] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const { data: learningItems, isLoading } = useOrgLearningCatalog();
  const { data: stats } = useOrgLearningStats();
  const toggleMutation = useToggleLearningCatalog();
  const updateMutation = useUpdateLearningCatalog();

  const filteredItems = learningItems?.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = filterType === "all" || item.content_type === filterType;
    const matchesDifficulty = filterDifficulty === "all" || item.difficulty_level === filterDifficulty;
    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "enabled" && item.is_enabled) ||
      (filterStatus === "disabled" && !item.is_enabled);

    return matchesSearch && matchesType && matchesDifficulty && matchesStatus;
  });

  const handleToggle = (libraryItemId: string, catalogId: string | null, isEnabled: boolean) => {
    toggleMutation.mutate({ libraryItemId, catalogId, isEnabled });
  };

  const handleUpdate = (catalogId: string, updates: Record<string, unknown>) => {
    updateMutation.mutate({ catalogId, ...updates });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            Learning Catalogus
          </CardTitle>
          <CardDescription>
            Schakel trainingen in en configureer ze voor je organisatie
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-muted rounded-lg">
              <p className="text-2xl font-bold">{learningItems?.length || 0}</p>
              <p className="text-xs text-muted-foreground">Beschikbaar</p>
            </div>
            <div className="text-center p-3 bg-primary/10 rounded-lg">
              <p className="text-2xl font-bold text-primary">{stats?.enabledCount || 0}</p>
              <p className="text-xs text-muted-foreground">Ingeschakeld</p>
            </div>
            <div className="text-center p-3 bg-destructive/10 rounded-lg">
              <p className="text-2xl font-bold text-destructive">{stats?.mandatoryCount || 0}</p>
              <p className="text-xs text-muted-foreground">Verplicht</p>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <p className="text-2xl font-bold text-muted-foreground">—</p>
              <p className="text-xs text-muted-foreground">Voltooiingsgraad</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search and filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Zoek trainingen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[140px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent className="bg-background z-50">
              <SelectItem value="all">Alle types</SelectItem>
              <SelectItem value="course">Cursus</SelectItem>
              <SelectItem value="module">Module</SelectItem>
              <SelectItem value="assessment">Toets</SelectItem>
              <SelectItem value="document">Document</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Niveau" />
            </SelectTrigger>
            <SelectContent className="bg-background z-50">
              <SelectItem value="all">Alle niveaus</SelectItem>
              <SelectItem value="basic">Basis</SelectItem>
              <SelectItem value="intermediate">Gemiddeld</SelectItem>
              <SelectItem value="advanced">Gevorderd</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-background z-50">
              <SelectItem value="all">Alle</SelectItem>
              <SelectItem value="enabled">Ingeschakeld</SelectItem>
              <SelectItem value="disabled">Uitgeschakeld</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Learning items grid */}
      {filteredItems && filteredItems.length > 0 ? (
        <div className="grid md:grid-cols-2 gap-4">
          {filteredItems.map((item) => (
            <LearningCard
              key={item.id}
              item={item}
              onToggle={handleToggle}
              onUpdate={handleUpdate}
              isToggling={toggleMutation.isPending}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={GraduationCap}
          title="Geen trainingen gevonden"
          description={
            searchQuery || filterType !== "all" || filterDifficulty !== "all"
              ? "Probeer andere zoek- of filtercriteria"
              : "Er zijn nog geen gepubliceerde trainingen beschikbaar. Vraag een Super Admin om content toe te voegen."
          }
        />
      )}
    </div>
  );
}
