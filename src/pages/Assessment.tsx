import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardCheck, CheckCircle2, XCircle, ArrowRight, RotateCcw } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { assessmentQuestions, PASSING_SCORE } from '@/data/training';
import { useAppStore } from '@/stores/useAppStore';

const Assessment = () => {
  const navigate = useNavigate();
  const { recordAssessment, getCurrentUser } = useAppStore();
  const user = getCurrentUser();
  
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResult, setShowResult] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  const question = assessmentQuestions[currentQuestion];
  const totalQuestions = assessmentQuestions.length;
  const isLastQuestion = currentQuestion === totalQuestions - 1;

  const calculateScore = () => {
    let correct = 0;
    assessmentQuestions.forEach((q) => {
      const selectedOption = q.options.find(o => o.id === answers[q.id]);
      if (selectedOption?.isCorrect) correct++;
    });
    return Math.round((correct / totalQuestions) * 100);
  };

  const handleSelectAnswer = (optionId: string) => {
    setSelectedAnswer(optionId);
    setShowExplanation(true);
  };

  const handleNext = () => {
    if (selectedAnswer) {
      setAnswers(prev => ({ ...prev, [question.id]: selectedAnswer }));
    }

    if (isLastQuestion) {
      const score = calculateScore();
      recordAssessment(score);
      setShowResult(true);
    } else {
      setCurrentQuestion(prev => prev + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    }
  };

  const handleRetry = () => {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setAnswers({});
    setShowResult(false);
    setShowExplanation(false);
  };

  const score = showResult ? calculateScore() : 0;
  const passed = score >= PASSING_SCORE;

  if (showResult) {
    return (
      <AppLayout>
        <div className="mx-auto max-w-2xl">
          <Card className={`text-center ${passed ? 'border-primary/30 bg-primary/5' : 'border-destructive/30 bg-destructive/5'}`}>
            <CardContent className="pt-8 pb-8">
              <div className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full ${
                passed ? 'bg-primary/10' : 'bg-destructive/10'
              }`}>
                {passed ? (
                  <CheckCircle2 className="h-10 w-10 text-primary" />
                ) : (
                  <XCircle className="h-10 w-10 text-destructive" />
                )}
              </div>
              
              <h1 className="mt-6 text-2xl font-bold">
                {passed ? 'Gefeliciteerd!' : 'Helaas, niet geslaagd'}
              </h1>
              
              <p className="mt-2 text-muted-foreground">
                {passed 
                  ? 'Je hebt de AI Literacy toets succesvol afgerond.'
                  : `Je score was ${score}%. Je hebt minimaal ${PASSING_SCORE}% nodig om te slagen.`
                }
              </p>

              <div className="mt-6 rounded-lg bg-secondary p-4 inline-block">
                <p className="text-sm text-muted-foreground">Je score</p>
                <p className="text-4xl font-bold">{score}%</p>
              </div>

              {passed ? (
                <div className="mt-8 space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Je AI Licentie is nu actief. Bekijk je toegewezen capabilities.
                  </p>
                  <Button size="lg" onClick={() => navigate('/license')}>
                    Bekijk Mijn Licentie
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              ) : (
                <div className="mt-8 space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Bekijk de trainingsmodules opnieuw en probeer het nog eens.
                  </p>
                  <div className="flex gap-4 justify-center">
                    <Button variant="outline" onClick={() => navigate('/training')}>
                      Terug naar Training
                    </Button>
                    <Button onClick={handleRetry}>
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Opnieuw Proberen
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  const selectedOption = question.options.find(o => o.id === selectedAnswer);
  const isCorrect = selectedOption?.isCorrect;

  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <ClipboardCheck className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Scenario-Toets</h1>
              <p className="text-muted-foreground">
                Vraag {currentQuestion + 1} van {totalQuestions}
              </p>
            </div>
          </div>
          <Progress value={((currentQuestion + 1) / totalQuestions) * 100} className="h-2" />
        </div>

        {/* Question Card */}
        <Card>
          <CardHeader>
            <div className="rounded-lg bg-secondary p-4 mb-4">
              <p className="text-sm font-medium text-muted-foreground mb-2">Scenario:</p>
              <p className="text-foreground">{question.scenario}</p>
            </div>
            <CardTitle className="text-lg">{question.question}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {question.options.map((option) => {
              const isSelected = selectedAnswer === option.id;
              const showCorrectness = showExplanation && isSelected;
              
              return (
                <button
                  key={option.id}
                  onClick={() => !showExplanation && handleSelectAnswer(option.id)}
                  disabled={showExplanation}
                  className={`w-full rounded-lg border p-4 text-left transition-all ${
                    showCorrectness
                      ? option.isCorrect
                        ? 'border-primary bg-primary/10'
                        : 'border-destructive bg-destructive/10'
                      : isSelected
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50 hover:bg-secondary/50'
                  } ${showExplanation ? 'cursor-default' : 'cursor-pointer'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                      showCorrectness
                        ? option.isCorrect
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-destructive bg-destructive text-destructive-foreground'
                        : isSelected
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-muted-foreground'
                    }`}>
                      {showCorrectness ? (
                        option.isCorrect ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <XCircle className="h-4 w-4" />
                        )
                      ) : isSelected ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : null}
                    </div>
                    <span className={showCorrectness && !option.isCorrect ? 'text-destructive' : ''}>
                      {option.text}
                    </span>
                  </div>
                </button>
              );
            })}

            {/* Explanation */}
            {showExplanation && (
              <div className={`mt-4 rounded-lg p-4 ${
                isCorrect ? 'bg-primary/10 border border-primary/30' : 'bg-warning/10 border border-warning/30'
              }`}>
                <p className="font-medium mb-2">
                  {isCorrect ? '✓ Correct!' : '✗ Niet helemaal'}
                </p>
                <p className="text-sm text-muted-foreground">{question.explanation}</p>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-end pt-4">
              <Button 
                onClick={handleNext} 
                disabled={!selectedAnswer}
                size="lg"
              >
                {isLastQuestion ? 'Bekijk Resultaat' : 'Volgende Vraag'}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Assessment;
