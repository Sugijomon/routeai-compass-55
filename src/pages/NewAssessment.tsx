import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, ArrowRight, Shield, AlertTriangle, Wrench, Search, MessageSquare, BarChart3, Users, Brain, Bot } from "lucide-react";
import type { SurveyAnswers, V1Answer, V2Main } from "@/types/assessment";

const TOTAL_STEPS = 5;

// V2 subcategorie-opties
const SUPPORTIVE_SUBS = [
  { value: "text_generation", label: "Tekst genereren" },
  { value: "rewriting", label: "Herschrijven" },
  { value: "creative", label: "Creatieve ideeën" },
  { value: "other", label: "Anders" },
];

const INFORMATIVE_SUBS = [
  { value: "rag_search", label: "Informatie opzoeken / RAG" },
  { value: "translation", label: "Vertalen" },
  { value: "data_analysis", label: "Data analyseren" },
  { value: "other", label: "Anders" },
];

// V2 primaire opties met icoon en beschrijving
const V2_OPTIONS: { value: V2Main; label: string; desc: string; icon: React.ReactNode }[] = [
  {
    value: "supportive",
    label: "Ondersteunend",
    desc: "De AI helpt mij tekst schrijven, herschrijven of ideeën genereren",
    icon: <MessageSquare className="h-5 w-5" />,
  },
  {
    value: "informative",
    label: "Informatief / Analytisch",
    desc: "De AI zoekt informatie op, vertaalt of analyseert data",
    icon: <BarChart3 className="h-5 w-5" />,
  },
  {
    value: "evaluative",
    label: "Evaluerend",
    desc: "De AI beoordeelt of rankt mensen, prestaties of sollicitaties",
    icon: <Users className="h-5 w-5" />,
  },
  {
    value: "decision_prep",
    label: "Beslissingsondersteunend",
    desc: "De AI helpt bij beslissingen die mensen beïnvloeden",
    icon: <Brain className="h-5 w-5" />,
  },
  {
    value: "autonomous",
    label: "Autonoom",
    desc: "De AI voert zelfstandig acties uit of communiceert direct met externen",
    icon: <Bot className="h-5 w-5" />,
  },
];

export default function NewAssessment() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [toolNameRaw, setToolNameRaw] = useState("");
  const [answers, setAnswers] = useState<Partial<SurveyAnswers>>({});
  const [v2Sub, setV2Sub] = useState<string>("");
  const [v2Freetext, setV2Freetext] = useState("");
  const [v1Blocked, setV1Blocked] = useState(false);

  // Validatie per stap
  const isStepValid = (): boolean => {
    switch (step) {
      case 1:
        return toolNameRaw.trim().length > 2;
      case 2:
        return !!answers.V1;
      case 3:
        if (!answers.V2_main) return false;
        if (answers.V2_main === "supportive" || answers.V2_main === "informative") {
          if (!v2Sub) return false;
          if (v2Sub === "other" && v2Freetext.trim().length === 0) return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    // V1 poortwachter: technical_modification → blokkade
    if (step === 2 && answers.V1 === "technical_modification") {
      setV1Blocked(true);
      return;
    }

    // Sla V2_sub op in answers
    if (step === 3) {
      const updatedAnswers = { ...answers };
      if (v2Sub && v2Sub !== "other") {
        updatedAnswers.V2_sub = v2Sub;
      } else if (v2Sub === "other") {
        updatedAnswers.V2_sub = "other";
        updatedAnswers.V2_freetext_original = null; // vrije tekst niet opgeslagen in DB
      }
      setAnswers(updatedAnswers);
    }

    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  };

  const handlePrev = () => {
    setV1Blocked(false);
    setStep((s) => Math.max(s - 1, 1));
  };

  // V1 blokkadescherm
  if (v1Blocked) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-8 pb-8 space-y-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-destructive/10 mx-auto">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Technische review vereist</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Deze configuratie vereist review door IT en Legal voordat je kunt
                verdergaan. Neem contact op met je organisatiebeheerder.
              </p>
            </div>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => setV1Blocked(false)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Terug naar vraag
              </Button>
              <Button onClick={() => navigate("/dashboard")}>
                Terug naar dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-semibold">RouteAI</h1>
            <Badge variant="outline">AI Check</Badge>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Terug
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Voortgang */}
        <div className="mb-8 space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Stap {step} van {TOTAL_STEPS}</span>
            <span>{Math.round((step / TOTAL_STEPS) * 100)}%</span>
          </div>
          <Progress value={(step / TOTAL_STEPS) * 100} className="h-2" />
        </div>

        {/* Stap 1 — Tool naam */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Voor welke AI-tool start je een check?</CardTitle>
              <CardDescription>
                Typ de naam van de tool die je wilt beoordelen.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Bijv. ChatGPT, Claude, Grammarly..."
                  value={toolNameRaw}
                  onChange={(e) => setToolNameRaw(e.target.value)}
                  className="pl-10 h-12 text-base"
                  autoFocus
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stap 2 — V1 Poortwachter */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Hoe wordt deze AI-tool technisch gebruikt in jouw organisatie?</CardTitle>
              <CardDescription>
                Dit bepaalt of extra technische review nodig is.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={answers.V1 || ""}
                onValueChange={(val) => setAnswers({ ...answers, V1: val as V1Answer })}
                className="space-y-3"
              >
                {[
                  {
                    value: "standard",
                    label: "Standaard gebruik",
                    desc: "Ik gebruik de tool zoals aangeboden",
                    icon: <Shield className="h-5 w-5 text-primary" />,
                  },
                  {
                    value: "custom_prompts",
                    label: "Aangepaste instructies",
                    desc: "We gebruiken vaste systeemprompts of sjablonen",
                    icon: <Wrench className="h-5 w-5 text-primary" />,
                  },
                  {
                    value: "technical_modification",
                    label: "Technische aanpassing",
                    desc: "We trainen het model bij of bouwen er een eigen applicatie op",
                    icon: <AlertTriangle className="h-5 w-5 text-destructive" />,
                  },
                ].map((opt) => (
                  <Label
                    key={opt.value}
                    htmlFor={`v1-${opt.value}`}
                    className={`flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-colors ${
                      answers.V1 === opt.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <RadioGroupItem value={opt.value} id={`v1-${opt.value}`} className="mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {opt.icon}
                        <span className="font-medium">{opt.label}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{opt.desc}</p>
                    </div>
                  </Label>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>
        )}

        {/* Stap 3 — V2 Archetype */}
        {step === 3 && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Wat doet de AI in deze toepassing?</CardTitle>
                <CardDescription>
                  Kies het type dat het beste past bij je gebruik van {toolNameRaw || "de tool"}.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={answers.V2_main || ""}
                  onValueChange={(val) => {
                    setAnswers({ ...answers, V2_main: val as V2Main });
                    setV2Sub("");
                    setV2Freetext("");
                  }}
                  className="space-y-3"
                >
                  {V2_OPTIONS.map((opt) => (
                    <Label
                      key={opt.value}
                      htmlFor={`v2-${opt.value}`}
                      className={`flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-colors ${
                        answers.V2_main === opt.value
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <RadioGroupItem value={opt.value} id={`v2-${opt.value}`} className="mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {opt.icon}
                          <span className="font-medium">{opt.label}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{opt.desc}</p>
                      </div>
                    </Label>
                  ))}
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Subcategorieën */}
            {(answers.V2_main === "supportive" || answers.V2_main === "informative") && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    {answers.V2_main === "supportive"
                      ? "Welk type ondersteuning?"
                      : "Welk type informatie/analyse?"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup
                    value={v2Sub}
                    onValueChange={(val) => {
                      setV2Sub(val);
                      if (val !== "other") setV2Freetext("");
                    }}
                    className="space-y-2"
                  >
                    {(answers.V2_main === "supportive"
                      ? SUPPORTIVE_SUBS
                      : INFORMATIVE_SUBS
                    ).map((sub) => (
                      <Label
                        key={sub.value}
                        htmlFor={`v2sub-${sub.value}`}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          v2Sub === sub.value
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <RadioGroupItem value={sub.value} id={`v2sub-${sub.value}`} />
                        <span className="text-sm font-medium">{sub.label}</span>
                      </Label>
                    ))}
                  </RadioGroup>

                  {v2Sub === "other" && (
                    <Textarea
                      placeholder="Beschrijf kort wat de AI doet..."
                      value={v2Freetext}
                      onChange={(e) => setV2Freetext(e.target.value)}
                      className="mt-3"
                      rows={3}
                    />
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Placeholder voor stap 4-5 (volgende prompt) */}
        {step > 3 && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <p>Stap {step} wordt binnenkort gebouwd.</p>
            </CardContent>
          </Card>
        )}

        {/* Navigatieknoppen */}
        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={step === 1}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Vorige
          </Button>
          <Button
            onClick={handleNext}
            disabled={!isStepValid()}
            className="gap-2"
          >
            {step === TOTAL_STEPS ? "Resultaat bekijken" : "Volgende"}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </main>
    </div>
  );
}
