import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
  BookOpen,
  Lock,
} from "lucide-react";
import { useAppStore } from "@/stores/useAppStore";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useOnboardingCourse } from "@/hooks/useOnboardingCourse";
import { OnboardingBanner } from "@/components/dashboard/OnboardingBanner";
import { AiRijbewijsBadge } from "@/components/dashboard/AiRijbewijsBadge";
import { WelcomeModal } from "@/components/dashboard/WelcomeModal";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function UserDashboard() {
  const navigate = useNavigate();
  const getCurrentUser = useAppStore((state) => state.getCurrentUser);
  const currentUser = getCurrentUser();
  const { profile, hasAiRijbewijs, aiRijbewijsObtainedAt, isLoading: profileLoading } = useUserProfile();
  const { onboardingCourse, progressPercentage, isCompleted, isLoading: courseLoading } = useOnboardingCourse();
  
  // Show welcome modal for new users who haven't started training
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  
  useEffect(() => {
    // Show welcome modal if:
    // 1. Not loading
    // 2. User doesn't have AI Rijbewijs
    // 3. There's an onboarding course
    // 4. User hasn't started the course yet
    if (!profileLoading && !courseLoading && !hasAiRijbewijs && onboardingCourse && progressPercentage === 0) {
      // Check localStorage to see if we've shown the modal before
      const hasSeenWelcome = localStorage.getItem(`welcome-shown-${currentUser?.id}`);
      if (!hasSeenWelcome) {
        setShowWelcomeModal(true);
        localStorage.setItem(`welcome-shown-${currentUser?.id}`, 'true');
      }
    }
  }, [profileLoading, courseLoading, hasAiRijbewijs, onboardingCourse, progressPercentage, currentUser?.id]);

  if (!currentUser) {
    return null;
  }

  const handleLogout = () => {
    // Navigate to home - user selection will handle the rest
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
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b bg-card">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-semibold">RouteAI</h1>
              <Badge variant="outline">Gebruiker</Badge>
              {hasAiRijbewijs && <AiRijbewijsBadge obtainedAt={aiRijbewijsObtainedAt} compact />}
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
              {hasAiRijbewijs 
                ? "Je AI-rijbewijs is actief. Start een AI Check of bekijk je leerpad."
                : "Voltooi eerst de AI Rijbewijs cursus om AI Checks te kunnen starten."
              }
            </p>
          </div>

          {/* Onboarding Banner (shows if no AI Rijbewijs) */}
          <OnboardingBanner hasAiRijbewijs={hasAiRijbewijs} />

          {/* AI Rijbewijs Badge (shows if has AI Rijbewijs) */}
          {hasAiRijbewijs && (
            <AiRijbewijsBadge obtainedAt={aiRijbewijsObtainedAt} />
          )}

          {/* PRIMARY CTA - Wat wil je doen? */}
          <Card className={hasAiRijbewijs ? "bg-primary/5 border-primary/20" : "bg-muted/50 border-muted"}>
            <CardContent className="py-8">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="flex-shrink-0">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                    hasAiRijbewijs ? "bg-primary/10" : "bg-muted"
                  }`}>
                    {hasAiRijbewijs ? (
                      <ClipboardCheck className="h-8 w-8 text-primary" />
                    ) : (
                      <Lock className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-2xl font-bold mb-2">
                    {hasAiRijbewijs ? "Wat wil je doen?" : "AI Checks nog niet beschikbaar"}
                  </h3>
                  <p className="text-muted-foreground">
                    {hasAiRijbewijs 
                      ? "Start een AI Check om AI verantwoord in te zetten voor je werk."
                      : "Voltooi eerst de AI Rijbewijs cursus om AI Checks te kunnen starten."
                    }
                  </p>
                </div>
                {hasAiRijbewijs ? (
                  <Button 
                    size="lg" 
                    className="gap-2"
                    onClick={() => navigate("/assessments/new")}
                  >
                    Start AI Check
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>
                        <Button 
                          size="lg" 
                          className="gap-2"
                          disabled
                        >
                          <Lock className="h-4 w-4" />
                          Start AI Check
                        </Button>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Voltooi eerst de AI Rijbewijs cursus</p>
                    </TooltipContent>
                  </Tooltip>
                )}
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
                {hasAiRijbewijs ? (
                  <>
                    <Badge className="bg-primary/10 text-primary border-primary/20 mb-2">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Actief
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-2">
                      Niveau: <span className="font-semibold capitalize">{trainingLevel}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">Scope: Productiviteits-tools (Low Risk)</p>
                  </>
                ) : (
                  <>
                    <Badge variant="secondary" className="mb-2">
                      <Lock className="h-3 w-3 mr-1" />
                      Niet Actief
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-2">
                      Voltooi de AI Rijbewijs cursus om je rijbewijs te activeren.
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Training Progress */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  AI Rijbewijs Training
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isCompleted ? (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <span className="font-semibold text-green-600">Voltooid!</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold">{progressPercentage}%</span>
                      <span className="text-sm text-muted-foreground">voortgang</span>
                    </div>
                    <Progress value={progressPercentage} className="h-2" />
                  </div>
                )}
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
          {hasAiRijbewijs && userCapabilities.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Jouw AI-vaardigheden</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Deze vaardigheden bepalen welke training je hebt voltooid, niet welke toepassingen je mag gebruiken.
                  Elke nieuwe toepassing vereist een AI Check.
                </p>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Snelle Acties</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {/* Mijn AI Checks */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="w-full">
                      <Button 
                        variant="outline" 
                        className="h-20 justify-start w-full" 
                        disabled={!hasAiRijbewijs}
                        onClick={() => {/* TODO: navigate to assessments list */}}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                            hasAiRijbewijs ? "bg-primary/10" : "bg-muted"
                          }`}>
                            <History className={`h-5 w-5 ${hasAiRijbewijs ? "text-primary" : "text-muted-foreground"}`} />
                          </div>
                          <div className="text-left">
                            <div className="font-semibold">Mijn AI Checks</div>
                            <div className="text-sm text-muted-foreground">Bekijk eerdere AI Checks</div>
                          </div>
                        </div>
                      </Button>
                    </span>
                  </TooltipTrigger>
                  {!hasAiRijbewijs && (
                    <TooltipContent>
                      <p>Voltooi eerst de AI Rijbewijs cursus</p>
                    </TooltipContent>
                  )}
                </Tooltip>

                {/* Leren */}
                <Button variant="outline" className="h-20 justify-start" onClick={() => navigate("/training")}>
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center relative">
                      <GraduationCap className="h-5 w-5 text-primary" />
                      {!hasAiRijbewijs && (
                        <span className="absolute -top-1 -right-1 h-3 w-3 bg-amber-500 rounded-full" />
                      )}
                    </div>
                    <div className="text-left">
                      <div className="font-semibold flex items-center gap-2">
                        Leren
                        {!hasAiRijbewijs && (
                          <Badge variant="outline" className="text-xs border-amber-300 text-amber-600">
                            Actie vereist
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">Trainingen en cursussen</div>
                    </div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>

        {/* Welcome Modal */}
        <WelcomeModal 
          open={showWelcomeModal} 
          onOpenChange={setShowWelcomeModal}
          courseId={onboardingCourse?.id ?? null}
        />
      </div>
    </TooltipProvider>
  );
}
