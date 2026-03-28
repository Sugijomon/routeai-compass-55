import React, { useState } from "react";
import {
  Search,
  Wrench,
  Globe,
  Shield,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Loader2,
  Settings,
  Link2,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  useOrgToolsCatalog,
  useOrgToolsStats,
  useToggleToolCatalog,
  useUpdateToolCatalog,
  OrgToolWithCatalog,
} from "@/hooks/useOrgToolsCatalog";

interface ToolConfigFormProps {
  tool: OrgToolWithCatalog;
  onSave: (data: {
    custom_guidelines: string;
    usage_limits: string;
    contract_reference: string;
    monthly_cost: number | null;
  }) => void;
  isSaving: boolean;
}

function ToolConfigForm({ tool, onSave, isSaving }: ToolConfigFormProps) {
  const [guidelines, setGuidelines] = useState(tool.custom_guidelines || "");
  const [usageLimits, setUsageLimits] = useState(tool.usage_limits || "");
  const [contractRef, setContractRef] = useState(tool.contract_reference || "");
  const [monthlyCost, setMonthlyCost] = useState(tool.monthly_cost?.toString() || "");

  const handleSave = () => {
    onSave({
      custom_guidelines: guidelines,
      usage_limits: usageLimits,
      contract_reference: contractRef,
      monthly_cost: monthlyCost ? parseFloat(monthlyCost) : null,
    });
  };

  return (
    <div className="space-y-4 pt-4 border-t">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`guidelines-${tool.id}`}>Interne Richtlijnen</Label>
          <Textarea
            id={`guidelines-${tool.id}`}
            placeholder="Beschrijf hoe deze tool moet worden gebruikt binnen je organisatie..."
            value={guidelines}
            onChange={(e) => setGuidelines(e.target.value)}
            rows={3}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`usage-${tool.id}`}>Gebruikslimieten</Label>
          <Input
            id={`usage-${tool.id}`}
            placeholder="bijv. Max 1000 requests/maand"
            value={usageLimits}
            onChange={(e) => setUsageLimits(e.target.value)}
          />
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`contract-${tool.id}`}>Contract Referentie</Label>
          <Input
            id={`contract-${tool.id}`}
            placeholder="bijv. CONTRACT-2024-001"
            value={contractRef}
            onChange={(e) => setContractRef(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`cost-${tool.id}`}>Maandelijkse Kosten (€)</Label>
          <Input
            id={`cost-${tool.id}`}
            type="number"
            placeholder="0.00"
            value={monthlyCost}
            onChange={(e) => setMonthlyCost(e.target.value)}
          />
        </div>
      </div>
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving} size="sm">
          {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Opslaan
        </Button>
      </div>
    </div>
  );
}

interface ToolCardProps {
  tool: OrgToolWithCatalog;
  onToggle: (toolId: string, enable: boolean) => void;
  onUpdateConfig: (toolId: string, data: any) => void;
  isToggling: boolean;
  isUpdating: boolean;
}

function ToolCard({ tool, onToggle, onUpdateConfig, isToggling, isUpdating }: ToolCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  const getCategoryLabel = (category: string | null) => {
    const labels: Record<string, string> = {
      llm: "Large Language Model",
      image_gen: "Image Generation",
      code_assistant: "Code Assistant",
      analytics: "Analytics",
      automation: "Automation",
      other: "Other",
    };
    return labels[category || "other"] || category || "Onbekend";
  };

  return (
    <Card className={tool.is_enabled ? "border-primary/50" : ""}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold">{tool.name}</h3>
              <Badge variant="outline" className="text-xs">
                {tool.vendor}
              </Badge>
              {tool.gpai_status && (
                <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 text-xs">
                  <Shield className="h-3 w-3 mr-1" />
                  GPAI
                </Badge>
              )}
              {tool.contract_required && (
                <Badge variant="secondary" className="text-xs">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Contract vereist
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {tool.description || "Geen beschrijving beschikbaar"}
            </p>
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Wrench className="h-3 w-3" />
                {getCategoryLabel(tool.category)}
              </span>
              {tool.hosting_location && (
                <span className="flex items-center gap-1">
                  <Globe className="h-3 w-3" />
                  {tool.hosting_location}
                </span>
              )}
              {tool.vendor_website_url && (
                <a
                  href={tool.vendor_website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-primary hover:underline"
                >
                  <ExternalLink className="h-3 w-3" />
                  Website
                </a>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Label htmlFor={`enable-${tool.id}`} className="text-sm">
                {tool.is_enabled ? "Actief" : "Inactief"}
              </Label>
              <Switch
                id={`enable-${tool.id}`}
                checked={tool.is_enabled}
                onCheckedChange={(checked) => onToggle(tool.id, checked)}
                disabled={isToggling}
              />
            </div>
          </div>
        </div>

        {tool.is_enabled && (
          <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mt-4">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full justify-between">
                <span className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Configuratie
                </span>
                {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <ToolConfigForm
                tool={tool}
                onSave={(data) => onUpdateConfig(tool.id, data)}
                isSaving={isUpdating}
              />
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  );
}

export default function ToolsCatalogManager() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [gpaiFilter, setGpaiFilter] = useState<string>("all");

  const { data: tools, isLoading } = useOrgToolsCatalog();
  const { data: stats } = useOrgToolsStats();
  const toggleMutation = useToggleToolCatalog();
  const updateMutation = useUpdateToolCatalog();

  const categories = [
    { value: "all", label: "Alle Categorieën" },
    { value: "llm", label: "Large Language Model" },
    { value: "image_gen", label: "Image Generation" },
    { value: "code_assistant", label: "Code Assistant" },
    { value: "analytics", label: "Analytics" },
    { value: "automation", label: "Automation" },
    { value: "other", label: "Other" },
  ];

  const filteredTools = tools?.filter((tool) => {
    const matchesSearch =
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.vendor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = categoryFilter === "all" || tool.category === categoryFilter;
    
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "enabled" && tool.is_enabled) ||
      (statusFilter === "disabled" && !tool.is_enabled);

    const matchesGpai =
      gpaiFilter === "all" ||
      (gpaiFilter === "gpai" && tool.gpai_status) ||
      (gpaiFilter === "non-gpai" && !tool.gpai_status);

    return matchesSearch && matchesCategory && matchesStatus && matchesGpai;
  });

  const handleToggle = (toolId: string, enable: boolean) => {
    toggleMutation.mutate({ toolId, enable });
  };

  const handleUpdateConfig = (toolId: string, data: any) => {
    updateMutation.mutate({ tool_id: toolId, ...data });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats?.enabledCount || 0}</div>
            <p className="text-xs text-muted-foreground">Tools Ingeschakeld</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{tools?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Beschikbare Tools</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">
              €{stats?.totalCost?.toFixed(2) || "0.00"}
            </div>
            <p className="text-xs text-muted-foreground">Maandelijkse Kosten</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">
              {tools?.filter((t) => t.gpai_status && t.is_enabled).length || 0}
            </div>
            <p className="text-xs text-muted-foreground">GPAI Tools Actief</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            AI Tools Catalogus
          </CardTitle>
          <CardDescription>
            Beheer welke AI tools beschikbaar zijn voor je organisatie
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Zoek tools..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Categorie" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle</SelectItem>
                <SelectItem value="enabled">Ingeschakeld</SelectItem>
                <SelectItem value="disabled">Uitgeschakeld</SelectItem>
              </SelectContent>
            </Select>
            <Select value={gpaiFilter} onValueChange={setGpaiFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="GPAI" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle</SelectItem>
                <SelectItem value="gpai">GPAI</SelectItem>
                <SelectItem value="non-gpai">Niet-GPAI</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tools List */}
          <div className="space-y-4">
            {filteredTools?.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Wrench className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>Geen tools gevonden</p>
                <p className="text-sm">Pas je filters aan of vraag een Super Admin om tools toe te voegen</p>
              </div>
            ) : (
              filteredTools?.map((tool) => (
                <ToolCard
                  key={tool.id}
                  tool={tool}
                  onToggle={handleToggle}
                  onUpdateConfig={handleUpdateConfig}
                  isToggling={toggleMutation.isPending}
                  isUpdating={updateMutation.isPending}
                />
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
