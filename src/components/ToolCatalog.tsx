// ToolCatalog.tsx - FILTERING FIX (TypeScript Compatible)
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Shield, AlertTriangle, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "@/store/useAppStore";

// Type definitions
interface Tool {
  id: string;
  name: string;
  vendor: string;
  category: string;
  capabilities: string[];
  riskLevel: "low" | "medium" | "high";
  status: "approved" | "restricted";
}

interface User {
  role: string;
  license?: {
    grantedCapabilities: string[];
  };
  name: string;
}

export default function ToolCatalog() {
  const navigate = useNavigate();
  const currentUser = useAppStore((state) => state.currentUser);
  const [searchQuery, setSearchQuery] = useState("");
  const [tools, setTools] = useState<Tool[]>([]);

  // Determine correct dashboard route based on user role
  const getDashboardRoute = () => {
    if (currentUser?.role === "org_admin") return "/admin-dashboard";
    return "/user-dashboard";
  };

  useEffect(() => {
    // Mock tools data - replace with actual data from mockTools.ts
    const allTools: Tool[] = [
      {
        id: "gpt4",
        name: "GPT-4o",
        vendor: "OpenAI",
        category: "Large Language Model",
        capabilities: ["text-redactie", "brainstorm-ideeen"],
        riskLevel: "medium",
        status: "approved",
      },
      {
        id: "claude",
        name: "Claude Sonnet",
        vendor: "Anthropic",
        category: "Large Language Model",
        capabilities: ["text-redactie"],
        riskLevel: "low",
        status: "approved",
      },
      {
        id: "midjourney",
        name: "Midjourney",
        vendor: "Midjourney Inc.",
        category: "Image Generation",
        capabilities: ["brainstorm-ideeen"],
        riskLevel: "low",
        status: "approved",
      },
      {
        id: "excel-copilot",
        name: "Excel Copilot",
        vendor: "Microsoft",
        category: "Data Analysis",
        capabilities: ["data-analyse"],
        riskLevel: "medium",
        status: "restricted",
      },
      {
        id: "tableau",
        name: "Tableau AI",
        vendor: "Salesforce",
        category: "Data Visualization",
        capabilities: ["data-analyse"],
        riskLevel: "medium",
        status: "approved",
      },
    ];

    // KRITIEKE FILTERING LOGICA
    const filteredTools = filterToolsByCapabilities(allTools, currentUser);
    setTools(filteredTools);
  }, [currentUser]);

  // HELPER: Filter tools based on user capabilities
  const filterToolsByCapabilities = (allTools: Tool[], user: User | null): Tool[] => {
    if (!user) return [];

    // Admins see ALL tools
    if (user.role === "org_admin") {
      console.log("🔓 Admin access: showing ALL tools");
      return allTools;
    }

    // Regular users: filter on capabilities
    const userCapabilities = user.license?.grantedCapabilities || [];

    console.log("🔍 Filtering tools for:", user.name);
    console.log("User capabilities:", userCapabilities);

    const filtered = allTools.filter((tool) => {
      // Tool is visible if it has AT LEAST ONE matching capability
      const hasMatchingCapability = tool.capabilities.some((toolCap) => userCapabilities.includes(toolCap));

      if (hasMatchingCapability) {
        console.log(
          `✅ ${tool.name}: ALLOWED (matches ${tool.capabilities.filter((c) => userCapabilities.includes(c)).join(", ")})`,
        );
      } else {
        console.log(
          `❌ ${tool.name}: BLOCKED (needs ${tool.capabilities.join(" or ")}, user has ${userCapabilities.join(", ")})`,
        );
      }

      return hasMatchingCapability;
    });

    console.log(`📊 Result: ${filtered.length} of ${allTools.length} tools visible`);
    return filtered;
  };

  // Risk level badge component
  const getRiskBadge = (riskLevel: Tool["riskLevel"]) => {
    const badges = {
      low: { color: "bg-green-100 text-green-700", icon: Shield, text: "Vertrouwd" },
      medium: { color: "bg-yellow-100 text-yellow-700", icon: AlertTriangle, text: "Verhoogde aandacht" },
      high: { color: "bg-red-100 text-red-700", icon: AlertTriangle, text: "Hoog risico" },
    };

    const badge = badges[riskLevel] || badges.low;
    const Icon = badge.icon;

    return (
      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="w-3 h-3" />
        {badge.text}
      </div>
    );
  };

  // Filter tools on search query
  const displayedTools = tools.filter(
    (tool) =>
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.vendor.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" className="gap-2" onClick={() => navigate(getDashboardRoute())}>
        <ArrowLeft className="w-4 h-4" />
        Terug naar Dashboard
      </Button>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">AI Tools Catalogus</h1>
        <p className="text-gray-600 mt-1">Goedgekeurde AI tools met RouteAI beoordelingen</p>
      </div>

      {/* Debug info (development only) */}
      {process.env.NODE_ENV === "development" && currentUser && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="text-xs font-mono space-y-1">
              <div>
                <strong>User:</strong> {currentUser.name} ({currentUser.role})
              </div>
              <div>
                <strong>Capabilities:</strong> {currentUser.license?.grantedCapabilities?.join(", ") || "None"}
              </div>
              <div>
                <strong>Visible tools:</strong> {displayedTools.length} of {tools.length} filtered
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <Input
          placeholder="Zoek op naam, vendor of categorie..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Tools Grid */}
      {displayedTools.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">
              {searchQuery
                ? "Geen tools gevonden voor deze zoekopdracht."
                : "Geen tools beschikbaar voor jouw capabilities."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {displayedTools.map((tool) => (
            <Card key={tool.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                    {/* Tool icon placeholder */}
                    <span className="text-2xl">🤖</span>
                  </div>
                  {getRiskBadge(tool.riskLevel)}
                </div>
                <CardTitle className="text-xl">{tool.name}</CardTitle>
                <p className="text-sm text-gray-600">{tool.vendor}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-xs font-semibold text-gray-500 mb-2">Categorie</div>
                  <div className="text-sm">{tool.category}</div>
                </div>

                <div>
                  <div className="text-xs font-semibold text-gray-500 mb-2">Capabilities</div>
                  <div className="flex flex-wrap gap-1">
                    {tool.capabilities.map((cap) => (
                      <span key={cap} className="px-2 py-1 bg-teal-100 text-teal-700 rounded text-xs">
                        {cap}
                      </span>
                    ))}
                  </div>
                </div>

                <Button className="w-full" onClick={() => navigate(`/tools/${tool.id}`)}>
                  Bekijk Details
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
