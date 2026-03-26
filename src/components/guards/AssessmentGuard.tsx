import React from "react";
import { useNavigate } from "react-router-dom";
import { useUserProfile } from "@/hooks/useUserProfile";
import { Shield, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface AssessmentGuardProps {
  children: React.ReactNode;
}

export default function AssessmentGuard({ children }: AssessmentGuardProps) {
  const navigate = useNavigate();
  const { hasAiRijbewijs, isLoading } = useUserProfile();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Skeleton className="h-64 w-96 rounded-xl" />
      </div>
    );
  }

  if (!hasAiRijbewijs) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-8 pb-8 space-y-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-destructive/10 mx-auto">
              <Shield className="h-8 w-8 text-destructive" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">AI-rijbewijs vereist</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Je hebt het AI-rijbewijs nodig om een AI Check te starten.
                Dit bewijs je door de AI Literacy cursus te voltooien en het examen te halen.
              </p>
            </div>
            <Button onClick={() => navigate("/learn")} className="gap-2">
              <GraduationCap className="h-4 w-4" />
              Naar het examen
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
