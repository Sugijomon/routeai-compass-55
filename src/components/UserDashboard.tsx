import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  GraduationCap,
  Award,
  LogOut,
  FileText,
  Lightbulb,
  BarChart3,
  CheckCircle2,
  ClipboardCheck,
  ArrowRight,
  History,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

export default function UserDashboard() {
  const navigate = useNavigate();
  const { currentUser, setCurrentUser } = useAppStore();

  if (!currentUser) {
    return null;
  }

  const handleLogout = () => {
    setCurrentUser(null);
    navigate("/");
  };

  // Capability icon mapping met emoji fallback
  const getCapabilityDisplay = (capabilityId: string) => {
    const displays: Record<string, { icon: typeof FileText; emoji: string; title: string; description: string; color: string }> = {
      "text-redactie": {
        icon: FileText,
        emoji: "✍️",
        title: "Tekst & Redactie",
        description: "Schrijven, redigeren, grammatica",
        color: "from-blue-500 to-cyan-500",
      },
      "brainstorm-ideeen": {
        icon: Lightbulb,
        emoji: "💡",
        title: "Brainstorm & Ideeën",
        description: "Creatief denken, concepten",
        color: "from-amber-500 to-orange-500",
      },
      "data-analyse": {
        icon: BarChart3,
        emoji: "📊",
        title: "Data-analyse",
        description: "Visualisatie, insights",
        color: "from-purple-500 to-pink-500",
      },
    };
    return (
      displays[capabilityId] || {
        icon: CheckCircle2,
        emoji: "✓",
        title: capabilityId,
        description: "AI vaardigheid",
        color: "from-gray-500 to-gray-600",
      }
    );
  };

  const userCapabilities = currentUser.license?.grantedCapabilities || [];
  const trainingLevel = currentUser.license?.trainingLevel || "basis";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-semibold">RouteAI</h1>
            <Badge variant="outline">Gebruiker</Badge>
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
          <h2 className="text-3xl font-bold">Welkom, {currentUser.name.split(" ")[0]}!</h2>
          <p className="text-muted-foreground mt-1">
            Je AI-rijbewijs is actief. Start een AI Check of bekijk je leerpad.
          </p>
        </div>

        {/* PRIMARY CTA - Wat wil je doen? */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="py-8">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <ClipboardCheck className="h-8 w-8 text-primary" />
                </div>
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-2xl font-bold mb-2">Wat wil je doen?</h3>
                <p className="text-muted-foreground">
                  Start een AI Check om AI verantwoord in te zetten voor je werk.
                </p>
              </div>
              <Button 
                size="lg" 
                className="gap-2"
                onClick={() => navigate("/assessments/new")}
              >
                Start AI Check
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* License Status */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                Rijbewijs Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge className="bg-primary/10 text-primary border-primary/20 mb-2">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Actief
              </Badge>
              <p className="text-xs text-muted-foreground mt-2">
                Niveau: <span className="font-semibold capitalize">{trainingLevel}</span>
              </p>
              <p className="text-xs text-muted-foreground">Scope: Productiviteits-tools (Low Risk)</p>
              <p className="text-xs text-muted-foreground">Geldig tot: 15-12-2026</p>
            </CardContent>
          </Card>

          {/* Training Progress */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <GraduationCap className="h-4 w-4" />
                Training Voortgang
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">4/4</span>
                  <span className="text-sm text-muted-foreground">modules</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-primary rounded-full h-2 w-full"></div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Skills Count */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Award className="h-4 w-4" />
                AI-vaardigheden
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-primary">{userCapabilities.length}</span>
                <span className="text-sm text-muted-foreground">toegekend</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI Skills Visual Cards */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Jouw AI-vaardigheden</CardTitle>
            <p className="text-sm text-muted-foreground">
              Deze vaardigheden bepalen welke training je hebt voltooid, niet welke toepassingen je mag gebruiken.
              Elke nieuwe toepassing vereist een AI Check.
            </p>
          </CardHeader>
          <CardContent>
            {userCapabilities.length > 0 ? (
              <div className="grid md:grid-cols-3 gap-6">
                {userCapabilities.map((capId) => {
                  const display = getCapabilityDisplay(capId);
                  const Icon = display.icon;

                  return (
                    <div
                      key={capId}
                      className="flex flex-col items-center text-center p-6 rounded-lg border-2 border-muted hover:border-primary/50 transition-all hover:shadow-md bg-card"
                    >
                      {/* Large Icon with Gradient Background */}
                      <div
                        className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${display.color} flex items-center justify-center mb-4 shadow-lg`}
                      >
                        <Icon className="w-10 h-10 text-white" />
                      </div>

                      {/* Title */}
                      <h3 className="font-bold text-lg mb-2">{display.title}</h3>

                      {/* Description */}
                      <p className="text-sm text-muted-foreground mb-4">{display.description}</p>

                      {/* Status Badge */}
                      <Badge className="bg-green-100 text-green-700 border-green-200">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Audit-Ready
                      </Badge>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Award className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nog geen AI-vaardigheden toegekend.</p>
                <p className="text-sm mt-2">Voltooi eerst de training modules.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Snelle Acties</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {/* Mijn AI Checks */}
              <Button 
                variant="outline" 
                className="h-20 justify-start" 
                onClick={() => {/* TODO: navigate to assessments list */}}
              >
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <History className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold">Mijn AI Checks</div>
                    <div className="text-sm text-muted-foreground">Bekijk eerdere AI Checks</div>
                  </div>
                </div>
              </Button>

              {/* Leren */}
              <Button variant="outline" className="h-20 justify-start" onClick={() => navigate("/training")}>
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <GraduationCap className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold">Leren</div>
                    <div className="text-sm text-muted-foreground">Trainingen en micro-lessen</div>
                  </div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
