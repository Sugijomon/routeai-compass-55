import React from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Wrench, Award, ArrowRight, LogOut, CheckCircle, Lock, AlertCircle, Info } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAppStore } from "@/store/useAppStore";
import { baseCapabilities } from "@/data/baseCapabilities";

export default function UserDashboard() {
  const navigate = useNavigate();
  const { currentUser, setCurrentUser } = useAppStore();

  if (!currentUser) {
    return null;
  }

  const trainingProgress = currentUser.trainingProgress || {
    completedModules: [],
    assessmentScore: null,
    certificateIssued: false,
  };
  const hasLicense = currentUser.license?.status === "active";
  const completedModules = trainingProgress.completedModules.length;
  const totalModules = 4; // From trainingData
  const progressPercent = (completedModules / totalModules) * 100;

  // Get user's granted capabilities with details
  const userCapabilities = hasLicense
    ? baseCapabilities.filter((cap) => currentUser.license!.grantedCapabilities.includes(cap.id))
    : [];

  // Debug logging
  console.log('Granted IDs:', currentUser?.license?.grantedCapabilities);
  console.log('Base caps IDs:', baseCapabilities.map(c => c.id));
  console.log('Matched caps:', userCapabilities.map(c => c.name));

  const handleLogout = () => {
    setCurrentUser(null);
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold">RouteAI</h1>
            <Badge variant="secondary">Gebruiker</Badge>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{currentUser.name}</span>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Uitloggen
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Welcome Section */}
        <div>
          <h2 className="text-2xl font-bold">Welkom, {currentUser.name.split(" ")[0]}!</h2>
          <p className="text-muted-foreground">
            {hasLicense
              ? "Je AI-rijbewijs is actief. Bekijk je capabilities en tools hieronder."
              : "Voltooi je training om je AI-rijbewijs te behalen."}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* License Status */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Rijbewijs Status</CardTitle>
            </CardHeader>
            <CardContent>
              {hasLicense ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-primary" />
                    <span className="font-semibold text-primary">Actief</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Niveau:</span>
                    <span className="font-medium capitalize">{currentUser.license!.trainingLevel}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground">Scope:</span>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="w-3 h-3 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p className="text-xs">
                              Dit rijbewijs geldt alleen voor productiviteits-tools 
                              met niet-gevoelige bedrijfsdata. Voor medische, juridische 
                              of financiële toepassingen is aanvullende training vereist.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <span className="font-medium">Productiviteits-tools (Low Risk)</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Geldig tot:</span>
                    <span className="font-medium">
                      {new Date(currentUser.license!.expiresAt).toLocaleDateString("nl-NL")}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Werkgebieden:</span>
                    <span className="font-medium">{currentUser.license!.grantedCapabilities.length}</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Badge variant="secondary">Niet behaald</Badge>
                  <p className="text-xs text-muted-foreground">Voltooi de training om te starten</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Training Progress */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Training Voortgang</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">
                  {completedModules}/{totalModules}
                </span>
                <span className="text-sm text-muted-foreground">modules</span>
              </div>
              <Progress value={progressPercent} className="h-2" />
            </CardContent>
          </Card>

          {/* Werkgebieden */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Werkgebieden</CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold">{currentUser.license?.grantedCapabilities.length || 0}</span>
              <span className="text-sm text-muted-foreground ml-2">toegekend</span>
            </CardContent>
          </Card>
        </div>

        {/* Authority Panel */}
        {hasLicense && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                Jouw Geautoriseerde Werkgebieden
              </CardTitle>
              <CardDescription>
                Hieronder zie je welke AI-toepassingen je mag gebruiken en onder welke voorwaarden.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Toegestane Capabilities */}
              {userCapabilities.map((capability) => (
                <div key={capability.id} className="p-4 border rounded-lg bg-primary/5">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-primary" />
                      <span className="font-medium">{capability.name}</span>
                    </div>
                    <Badge variant={capability.riskLevel === "minimal" ? "secondary" : "destructive"}>
                      {capability.riskLevel === "minimal" ? "Minimaal Risico" : "Verhoogd Risico"}
                    </Badge>
                  </div>

                  <p className="text-sm text-muted-foreground mb-2">Use cases: {capability.useCases?.join(", ")}</p>

                  <div className="flex items-start gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-primary mt-0.5" />
                    <div>
                      <p className="text-muted-foreground">Status: {capability.complianceStatus}</p>
                      {capability.restrictions && <p className="text-muted-foreground">{capability.restrictions}</p>}
                    </div>
                  </div>
                </div>
              ))}

              {/* Vergrendelde Capabilities */}
              {baseCapabilities
                .filter((cap) => cap.locked && !userCapabilities.find((uc) => uc.id === cap.id))
                .map((capability) => (
                  <div key={capability.id} className="p-4 border rounded-lg bg-muted/50 opacity-75">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Lock className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-muted-foreground">{capability.name}</span>
                      </div>
                      <Badge variant="destructive">Verhoogd Risico</Badge>
                    </div>

                    <div className="flex items-start gap-2 text-sm">
                      <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5" />
                      <div>
                        <p className="text-muted-foreground">🔒 Vereist Gevorderd Training + Org Approval</p>
                        {capability.restrictions && (
                          <p className="text-muted-foreground">Let op: {capability.restrictions}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Training Card */}
          <Card className="hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Training</CardTitle>
                  <CardDescription>Leer verantwoord AI gebruik</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate("/training")} className="w-full">
                {hasLicense ? "Herhaal Training" : "Start Training"}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          {/* Tools Card */}
          <Card className={`transition-colors ${hasLicense ? "hover:border-primary/50" : "opacity-60"}`}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Wrench className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">AI Tools</CardTitle>
                  <CardDescription>Bekijk beschikbare tools</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => navigate("/tools")}
                className="w-full"
                variant={hasLicense ? "default" : "secondary"}
                disabled={!hasLicense}
              >
                {hasLicense ? "Bekijk Tools" : "Rijbewijs vereist"}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
