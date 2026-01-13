import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/store/useAppStore';
import { MOCK_TOOLS } from '@/data/mockTools';

export default function ToolDetail() {
  const navigate = useNavigate();
  const { toolId } = useParams<{ toolId: string }>();
  const { currentUser, canUserAccessTool } = useAppStore();

  const tool = MOCK_TOOLS.find(t => t.id === toolId);

  if (!currentUser) {
    navigate('/');
    return null;
  }

  if (!tool) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Tool niet gevonden</h2>
            <Button onClick={() => navigate('/tools')}>
              Terug naar catalogus
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const hasAccess = canUserAccessTool(currentUser.id, tool.id);

  const getRiskBadgeVariant = (risk: string) => {
    switch (risk) {
      case 'minimal': return 'default';
      case 'limited': return 'secondary';
      case 'high': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate('/tools')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Terug naar catalogus
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          {/* Tool Header */}
          <div className="flex items-start gap-4">
            <img 
              src={tool.logoUrl} 
              alt={tool.name}
              className="h-16 w-16 rounded-xl object-contain bg-muted p-2"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/placeholder.svg';
              }}
            />
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{tool.name}</h1>
              <p className="text-muted-foreground">{tool.vendor}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline">{tool.category}</Badge>
                {hasAccess ? (
                  <Badge className="bg-primary/10 text-primary border-primary/20">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Toegang
                  </Badge>
                ) : (
                  <Badge variant="secondary">Geen toegang</Badge>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Beschrijving</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{tool.description}</p>
            </CardContent>
          </Card>

          {/* Use Cases */}
          <Card>
            <CardHeader>
              <CardTitle>Use Cases</CardTitle>
              <CardDescription>Goedgekeurde toepassingen voor deze tool</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {tool.useCases.map((useCase, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium">{useCase.title}</h3>
                    <Badge variant={getRiskBadgeVariant(useCase.riskLevel)}>
                      {useCase.riskLevel} risk
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{useCase.description}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Important Notes */}
          {tool.importantNotes.length > 0 && (
            <Card className="border-amber-500/20 bg-amber-500/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-600">
                  <Info className="h-5 w-5" />
                  Belangrijke Opmerkingen
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {tool.importantNotes.map((note, index) => (
                    <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-amber-500">•</span>
                      {note}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
