import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  closestCenter,
  useDroppable,
} from "@dnd-kit/core";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { GripVertical, Wrench } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// --- Types ---

interface ToolDefinition {
  id: string;
  name: string;
  category: string;
  emoji: string;
  color: string;
}

interface PlacedTool {
  tool: ToolDefinition;
  status: "approved" | "known_unconfigured";
}

interface ToolCatalogPickerProps {
  orgId: string;
}

// --- Tool dataset ---

const TOOL_CATALOG: ToolDefinition[] = [
  // Conversatie & Assistentie
  { id: "chatgpt", name: "ChatGPT", category: "conversatie", emoji: "💬", color: "#10a37f" },
  { id: "claude", name: "Claude", category: "conversatie", emoji: "🔶", color: "#cc785c" },
  { id: "gemini", name: "Gemini", category: "conversatie", emoji: "✨", color: "#4285f4" },
  { id: "copilot", name: "Microsoft Copilot", category: "conversatie", emoji: "🪟", color: "#0078d4" },
  { id: "perplexity", name: "Perplexity", category: "conversatie", emoji: "🔍", color: "#1fb8cd" },
  // Schrijven & Content
  { id: "grammarly", name: "Grammarly", category: "schrijven", emoji: "✍️", color: "#15c39a" },
  { id: "jasper", name: "Jasper", category: "schrijven", emoji: "📝", color: "#ff5c35" },
  { id: "notion-ai", name: "Notion AI", category: "schrijven", emoji: "📋", color: "#000000" },
  { id: "otter", name: "Otter.ai", category: "schrijven", emoji: "🎙️", color: "#333cdd" },
  { id: "fathom", name: "Fathom", category: "schrijven", emoji: "📞", color: "#6c47ff" },
  // Code & Development
  { id: "github-copilot", name: "GitHub Copilot", category: "code", emoji: "👾", color: "#1b1f23" },
  { id: "cursor", name: "Cursor", category: "code", emoji: "⚡", color: "#000000" },
  { id: "tabnine", name: "Tabnine", category: "code", emoji: "🔧", color: "#6c47ff" },
  // Design & Visueel
  { id: "midjourney", name: "Midjourney", category: "design", emoji: "🎨", color: "#000000" },
  { id: "dall-e", name: "DALL-E", category: "design", emoji: "🖼️", color: "#10a37f" },
  { id: "canva-ai", name: "Canva AI", category: "design", emoji: "🎭", color: "#00c4cc" },
  { id: "adobe-firefly", name: "Adobe Firefly", category: "design", emoji: "🔥", color: "#ff0000" },
  // Data & Analyse
  { id: "julius", name: "Julius AI", category: "data", emoji: "📊", color: "#7c3aed" },
  { id: "excel-copilot", name: "Excel Copilot", category: "data", emoji: "📈", color: "#217346" },
  // Embedded
  { id: "salesforce-einstein", name: "Salesforce Einstein", category: "embedded", emoji: "☁️", color: "#00a1e0" },
  { id: "m365-copilot", name: "M365 Copilot", category: "embedded", emoji: "🪟", color: "#0078d4" },
  { id: "zoom-ai", name: "Zoom AI", category: "embedded", emoji: "📹", color: "#2d8cff" },
  { id: "slack-ai", name: "Slack AI", category: "embedded", emoji: "💬", color: "#4a154b" },
  // Lokale agents
  { id: "claude-desktop", name: "Claude Desktop", category: "agents", emoji: "🖥️", color: "#cc785c" },
  { id: "autogpt", name: "AutoGPT", category: "agents", emoji: "🤖", color: "#000000" },
];

const CATEGORIES = [
  { key: "conversatie", label: "Conversatie & Assistentie" },
  { key: "schrijven", label: "Schrijven & Content" },
  { key: "code", label: "Code & Development" },
  { key: "design", label: "Design & Visueel" },
  { key: "data", label: "Data & Analyse" },
  { key: "embedded", label: "Embedded in andere tools" },
  { key: "agents", label: "Lokale agents" },
];

const GRID_SIZE = 9;

// --- Sub-components ---

function ToolIcon({ emoji, color }: { emoji: string; color: string }) {
  return (
    <div
      className="h-9 w-9 rounded-lg flex items-center justify-center text-lg shrink-0"
      style={{ backgroundColor: `${color}18` }}
    >
      {emoji}
    </div>
  );
}

// Draggable card in library
function DraggableToolCard({ tool, isPlaced }: { tool: ToolDefinition; isPlaced: boolean }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `library-${tool.id}`,
    data: { tool, source: "library" },
    disabled: isPlaced,
  });

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 rounded-lg border bg-background p-3 shadow-sm transition-all group",
        isPlaced
          ? "opacity-40 cursor-not-allowed"
          : "cursor-grab active:cursor-grabbing hover:shadow-md",
        isDragging && "opacity-50 shadow-lg z-50"
      )}
      {...(isPlaced ? {} : { ...attributes, ...listeners })}
    >
      <ToolIcon emoji={tool.emoji} color={tool.color} />
      <span className="text-sm font-medium truncate flex-1">{tool.name}</span>
      {!isPlaced && (
        <GripVertical className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
      )}
    </div>
  );
}

// Placed card in grid slot
function PlacedToolCard({
  tool,
  status,
  onToggle,
}: {
  tool: ToolDefinition;
  status: "approved" | "known_unconfigured";
  onToggle: (enabled: boolean) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `grid-${tool.id}`,
    data: { tool, source: "grid" },
  });

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex flex-col items-center justify-between rounded-xl border bg-background p-3 h-full shadow-sm cursor-grab active:cursor-grabbing",
        isDragging && "opacity-50 shadow-lg z-50"
      )}
      {...attributes}
      {...listeners}
    >
      <div className="flex flex-col items-center gap-1.5 flex-1 justify-center">
        <ToolIcon emoji={tool.emoji} color={tool.color} />
        <span className="text-xs font-medium text-center leading-tight">{tool.name}</span>
      </div>
      <div
        className="mt-1.5"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <Switch
          checked={status === "approved"}
          onCheckedChange={onToggle}
          className="scale-75"
        />
      </div>
    </div>
  );
}

// Drop slot in grid
function DropSlot({
  index,
  children,
  isOver,
}: {
  index: number;
  children?: React.ReactNode;
  isOver: boolean;
}) {
  const { setNodeRef } = useDroppable({ id: `slot-${index}` });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "rounded-xl h-28 transition-all",
        children
          ? ""
          : "border-2 border-dashed border-muted bg-muted/30 flex items-center justify-center",
        isOver && !children && "border-primary bg-primary/5"
      )}
    >
      {children || (
        <span className="text-xs text-muted-foreground">Sleep hier naartoe</span>
      )}
    </div>
  );
}

// Library drop zone (for removing)
function LibraryDropZone({ isOver, children }: { isOver: boolean; children: React.ReactNode }) {
  const { setNodeRef } = useDroppable({ id: "library-zone" });

  return (
    <div ref={setNodeRef} className={cn("flex-1 min-h-0", isOver && "ring-2 ring-primary/30 rounded-lg")}>
      {children}
    </div>
  );
}

// Overlay card shown while dragging
function DragOverlayCard({ tool }: { tool: ToolDefinition }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-background p-3 shadow-xl w-48 pointer-events-none">
      <ToolIcon emoji={tool.emoji} color={tool.color} />
      <span className="text-sm font-medium truncate">{tool.name}</span>
    </div>
  );
}

// --- Main component ---

export default function ToolCatalogPicker({ orgId }: ToolCatalogPickerProps) {
  const queryClient = useQueryClient();
  const [activeCategory, setActiveCategory] = useState("conversatie");
  const [gridSlots, setGridSlots] = useState<(PlacedTool | null)[]>(
    Array(GRID_SIZE).fill(null)
  );
  const [activeItem, setActiveItem] = useState<ToolDefinition | null>(null);
  const [overSlotId, setOverSlotId] = useState<string | null>(null);
  const [customToolInput, setCustomToolInput] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // Load existing catalog
  const { data: existingTools, isLoading } = useQuery({
    queryKey: ["org-tools-catalog", orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("org_tools_catalog")
        .select("tool_name, status")
        .eq("org_id", orgId);
      if (error) throw error;
      return data as { tool_name: string; status: string }[];
    },
    enabled: !!orgId,
  });

  // Pre-place tools from DB on load
  useEffect(() => {
    if (!existingTools) return;

    const newSlots: (PlacedTool | null)[] = Array(GRID_SIZE).fill(null);
    let slotIndex = 0;

    existingTools.forEach((row) => {
      if (slotIndex >= GRID_SIZE) return;
      const tool = TOOL_CATALOG.find(
        (t) => t.name.toLowerCase() === row.tool_name.toLowerCase()
      );
      if (tool && (row.status === "approved" || row.status === "known_unconfigured")) {
        newSlots[slotIndex] = {
          tool,
          status: row.status as "approved" | "known_unconfigured",
        };
        slotIndex++;
      }
    });

    setGridSlots(newSlots);
  }, [existingTools]);

  // Placed tool IDs for dimming in library
  const placedToolIds = useMemo(
    () => new Set(gridSlots.filter(Boolean).map((s) => s!.tool.id)),
    [gridSlots]
  );

  // Filtered tools for active category
  const filteredTools = useMemo(
    () => TOOL_CATALOG.filter((t) => t.category === activeCategory),
    [activeCategory]
  );

  // --- DB operations ---

  const dbPlace = useCallback(
    async (tool: ToolDefinition) => {
      const { error } = await supabase
        .from("org_tools_catalog")
        .upsert(
          { org_id: orgId, tool_name: tool.name, status: "approved" },
          { onConflict: "org_id,tool_name" }
        );
      if (error) {
        console.error("Place tool error:", error);
        toast.error(`Fout: ${error.message}`);
      } else {
        toast.success("Catalogus opgeslagen");
        queryClient.invalidateQueries({ queryKey: ["org-tools-catalog", orgId] });
      }
    },
    [orgId, queryClient]
  );

  const dbRemove = useCallback(
    async (tool: ToolDefinition) => {
      const { error } = await supabase
        .from("org_tools_catalog")
        .delete()
        .eq("org_id", orgId)
        .eq("tool_name", tool.name);
      if (error) {
        console.error("Remove tool error:", error);
        toast.error(`Fout: ${error.message}`);
      } else {
        toast.success("Catalogus opgeslagen");
        queryClient.invalidateQueries({ queryKey: ["org-tools-catalog", orgId] });
      }
    },
    [orgId, queryClient]
  );

  const dbToggle = useCallback(
    async (tool: ToolDefinition, enabled: boolean) => {
      const { error } = await supabase
        .from("org_tools_catalog")
        .update({ status: enabled ? "approved" : "known_unconfigured" })
        .eq("org_id", orgId)
        .eq("tool_name", tool.name);
      if (error) {
        console.error("Toggle tool error:", error);
        toast.error(`Fout: ${error.message}`);
      } else {
        toast.success("Catalogus opgeslagen");
      }
    },
    [orgId]
  );

  // --- DnD handlers ---

  const handleDragStart = (event: DragStartEvent) => {
    setActiveItem(event.active.data.current?.tool ?? null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const overId = event.over?.id?.toString() ?? null;
    setOverSlotId(overId);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveItem(null);
    setOverSlotId(null);

    const { active, over } = event;
    if (!over || !active.data.current) return;

    const tool: ToolDefinition = active.data.current.tool;
    const source: string = active.data.current.source;
    const overId = over.id.toString();

    // From library to grid slot
    if (source === "library" && overId.startsWith("slot-")) {
      const slotIndex = parseInt(overId.replace("slot-", ""), 10);
      if (gridSlots[slotIndex] !== null) return; // slot already occupied

      setGridSlots((prev) => {
        const next = [...prev];
        next[slotIndex] = { tool, status: "approved" };
        return next;
      });
      dbPlace(tool);
    }

    // From grid to library zone → remove
    if (source === "grid" && overId === "library-zone") {
      setGridSlots((prev) =>
        prev.map((s) => (s && s.tool.id === tool.id ? null : s))
      );
      dbRemove(tool);
    }

    // From grid slot to different grid slot → reorder
    if (source === "grid" && overId.startsWith("slot-")) {
      const targetIndex = parseInt(overId.replace("slot-", ""), 10);
      const sourceIndex = gridSlots.findIndex((s) => s && s.tool.id === tool.id);
      if (sourceIndex === -1 || sourceIndex === targetIndex) return;

      setGridSlots((prev) => {
        const next = [...prev];
        const temp = next[targetIndex];
        next[targetIndex] = next[sourceIndex];
        next[sourceIndex] = temp;
        return next;
      });
    }
  };

  const handleToggle = (slotIndex: number, enabled: boolean) => {
    const placed = gridSlots[slotIndex];
    if (!placed) return;

    setGridSlots((prev) => {
      const next = [...prev];
      next[slotIndex] = {
        ...placed,
        status: enabled ? "approved" : "known_unconfigured",
      };
      return next;
    });
    dbToggle(placed.tool, enabled);
  };

  const handleAddCustomTool = useCallback(async () => {
    const name = customToolInput.trim();
    if (!name) return;

    // Zoek eerste lege slot
    const emptyIndex = gridSlots.findIndex((s) => s === null);
    const customTool: ToolDefinition = {
      id: `custom-${name.toLowerCase().replace(/\s+/g, "-")}`,
      name,
      category: "custom",
      emoji: "🔧",
      color: "#6b7280",
    };

    if (emptyIndex !== -1) {
      setGridSlots((prev) => {
        const next = [...prev];
        next[emptyIndex] = { tool: customTool, status: "approved" };
        return next;
      });
    }

    const { error } = await supabase
      .from("org_tools_catalog")
      .upsert(
        { org_id: orgId, tool_name: name, status: "approved" },
        { onConflict: "org_id,tool_name" }
      );

    if (error) {
      toast.error(`Fout: ${error.message}`);
    } else {
      toast.success(`${name} toegevoegd aan catalogus`);
      queryClient.invalidateQueries({ queryKey: ["org-tools-catalog", orgId] });
    }

    setCustomToolInput("");
  }, [customToolInput, gridSlots, orgId, queryClient]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72 mt-2" />
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Wrench className="h-5 w-5 text-primary" />
          AI-tools catalogus
        </CardTitle>
        <CardDescription>
          Sleep tools vanuit de bibliotheek naar het werkgebied om ze te
          beheren voor jouw organisatie.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-6">
            {/* LEFT — Workspace Grid (60%) */}
            <div className="w-[60%] space-y-3">
              <div>
                <h3 className="text-sm font-semibold">Goedgekeurde tools</h3>
                <p className="text-xs text-muted-foreground">
                  Sleep tools naar het werkgebied om ze goed te keuren voor
                  jouw organisatie.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {gridSlots.map((slot, index) => (
                  <DropSlot
                    key={index}
                    index={index}
                    isOver={overSlotId === `slot-${index}`}
                  >
                    {slot && (
                      <PlacedToolCard
                        tool={slot.tool}
                        status={slot.status}
                        onToggle={(enabled) => handleToggle(index, enabled)}
                      />
                    )}
                  </DropSlot>
                ))}
              </div>
            </div>

            {/* RIGHT — Tool Library (40%) */}
            <div className="w-[40%] flex flex-col space-y-3 min-h-0">
              {/* Category tabs */}
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => setActiveCategory(cat.key)}
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                      activeCategory === cat.key
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Draggable list */}
              <LibraryDropZone isOver={overSlotId === "library-zone"}>
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                  {filteredTools.map((tool) => (
                    <DraggableToolCard
                      key={tool.id}
                      tool={tool}
                      isPlaced={placedToolIds.has(tool.id)}
                    />
                  ))}
                </div>
              </LibraryDropZone>

              {/* Handmatig tool toevoegen */}
              <div className="border-t border-border mt-4 pt-4">
                <p className="text-xs text-muted-foreground mb-2">
                  Tool niet gevonden? Voeg handmatig toe aan de catalogus:
                </p>
                <div className="flex gap-2">
                  <Input
                    placeholder="Naam van de tool"
                    value={customToolInput}
                    onChange={(e) => setCustomToolInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddCustomTool()}
                    className="text-sm"
                  />
                  <Button variant="outline" size="sm" onClick={handleAddCustomTool}>
                    Toevoegen
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Drag overlay */}
          <DragOverlay dropAnimation={null}>
            {activeItem && <DragOverlayCard tool={activeItem} />}
          </DragOverlay>
        </DndContext>
      </CardContent>
    </Card>
  );
}
