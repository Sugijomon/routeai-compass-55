import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  ArrowRight,
  Shield,
  ClipboardCheck,
  Search,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

/**
 * NewAssessment - Survey V1-V6 intake flow
 * 
 * This is the ONLY way for users to start using AI.
 * There is NO use-case catalog or predefined applications.
 * 
 * Survey Structure:
 * V1: Technical Setup
 * V2: Archetype
 * V3: Impact
 * V4: Data
 * V5: Oversight
 * V6: Safeguard (conditional)
 */
export default function NewAssessment() {
  const navigate = useNavigate();
  const { currentUser } = useAppStore();
  const [contextInput, setContextInput] = useState("");

  if (!currentUser) {
    return null;
  }

  const handleBack = () => {
    if (currentUser.role === "org_admin") {
      navigate("/admin-dashboard");
    } else {
      navigate("/user-dashboard");
    }
  };

  const handleStartSurvey = () => {
    // TODO: Navigate to V1 step when survey is implemented
    console.log("Starting survey with context:", contextInput);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-semibold">RouteAI</h1>
            <Badge variant="outline">Nieuwe Beoordeling</Badge>
          </div>
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Terug
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="space-y-8">
          {/* Hero Section */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-2">
              <ClipboardCheck className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-3xl font-bold">Wat wil je doen?</h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Beschrijf in je eigen woorden wat je wilt bereiken met AI. 
              We begeleiden je door de juiste stappen.
            </p>
          </div>

          {/* Context Input - Framing aid only */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Beschrijf je toepassing</CardTitle>
              <CardDescription>
                Dit helpt ons de juiste vragen te stellen. Dit is geen zoekopdracht.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Bijvoorbeeld: Tekst samenvatten, vergaderingen analyseren..."
                  value={contextInput}
                  onChange={(e) => setContextInput(e.target.value)}
                  className="pl-10 h-12 text-base"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                💡 Dit veld is puur ter context. Je selecteert geen vooraf goedgekeurde toepassingen.
              </p>
            </CardContent>
          </Card>

          {/* Survey Preview */}
          <Card className="bg-muted/30 border-dashed">
            <CardHeader>
              <CardTitle className="text-base">Survey V1–V6</CardTitle>
              <CardDescription>
                Je doorloopt 6 stappen om je AI-gebruik te beoordelen
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {[
                  { id: "V1", title: "Technical Setup", desc: "Welke tool(s) wil je gebruiken?" },
                  { id: "V2", title: "Archetype", desc: "Wat voor soort AI-gebruik is dit?" },
                  { id: "V3", title: "Impact", desc: "Wie wordt beïnvloed door het resultaat?" },
                  { id: "V4", title: "Data", desc: "Welke gegevens verwerk je?" },
                  { id: "V5", title: "Oversight", desc: "Hoe controleer je de output?" },
                  { id: "V6", title: "Safeguard", desc: "Extra check (indien nodig)" },
                ].map((step) => (
                  <div key={step.id} className="flex items-center gap-3 p-3 rounded-lg bg-background">
                    <Badge variant="outline" className="font-mono">
                      {step.id}
                    </Badge>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{step.title}</p>
                      <p className="text-xs text-muted-foreground">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* CTA */}
          <div className="flex justify-center">
            <Button 
              size="lg" 
              className="gap-2 px-8"
              onClick={handleStartSurvey}
            >
              Start Beoordeling
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Info Box */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 text-center">
            <p className="text-blue-800 text-sm">
              <strong>ℹ️ Hoe werkt het?</strong>
            </p>
            <p className="text-blue-700 text-sm mt-1">
              Na de beoordeling krijg je een dynamisch advies (Route + Archetype) 
              gebaseerd op jouw specifieke situatie — niet op vooraf vastgestelde use-cases.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
