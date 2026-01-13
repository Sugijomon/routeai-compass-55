import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  AlertCircle, 
  CheckCircle, 
  Shield, 
  Eye, 
  AlertTriangle,
  Lock,
  ExternalLink,
  Info,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAppStore } from '@/store/useAppStore';
import { getToolById } from '@/data/mockTools';
import { RouteAIOordeel } from '@/types';

export default function ToolDetail() {
  const navigate = useNavigate();
  const { toolId } = useParams<{ toolId: string }>();
  const { currentUser } = useAppStore();

  const tool = toolId ? getToolById(toolId) : undefined;

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

  const hasLicense = currentUser.license?.status === 'active';
  const userCapabilities = currentUser.license?.grantedCapabilities || [];
  
  const hasAccess = hasLicense && (!tool.restricted || 
    (tool.requiredCapability && userCapabilities.includes(tool.requiredCapability)));

  const label = tool.lightLabel;
  const fullLabel = tool.fullNutritionLabel;

  // Get oordeel styling
  const getOordeelStyle = (oordeel: RouteAIOordeel) => {
    switch (oordeel) {
      case 'vertrouwd':
        return { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-200' };
      case 'vertrouwd-met-instructies':
        return { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' };
      case 'verhoogde-aandacht':
        return { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-200' };
      case 'niet-aanbevolen':
        return { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' };
      default:
        return { bg: 'bg-muted', text: 'text-muted-foreground', border: 'border-muted' };
    }
  };

  const getOordeelIcon = (oordeel: RouteAIOordeel) => {
    switch (oordeel) {
      case 'vertrouwd':
        return <CheckCircle className="h-5 w-5" />;
      case 'vertrouwd-met-instructies':
        return <Eye className="h-5 w-5" />;
      case 'verhoogde-aandacht':
        return <AlertTriangle className="h-5 w-5" />;
      case 'niet-aanbevolen':
        return <Shield className="h-5 w-5" />;
      default:
        return null;
    }
  };

  const getOordeelLabel = (oordeel: RouteAIOordeel) => {
    switch (oordeel) {
      case 'vertrouwd':
        return 'Vertrouwd';
      case 'vertrouwd-met-instructies':
        return 'Vertrouwd met instructies';
      case 'verhoogde-aandacht':
        return 'Verhoogde aandacht vereist';
      case 'niet-aanbevolen':
        return 'Niet aanbevolen';
      default:
        return oordeel;
    }
  };

  // Render score bar
  const renderScoreBar = (score: number, maxScore: number = 5) => {
    return (
      <div className="flex gap-1">
        {Array.from({ length: maxScore }).map((_, i) => (
          <div
            key={i}
            className={`h-3 w-6 rounded ${
              i < score ? 'bg-teal-500' : 'bg-muted'
            }`}
          />
        ))}
      </div>
    );
  };

  const getRiskBadgeVariant = (risk: string) => {
    switch (risk) {
      case 'minimal': return 'default';
      case 'limited': return 'secondary';
      case 'high': return 'destructive';
      default: return 'outline';
    }
  };

  const oordeelStyle = label ? getOordeelStyle(label.routeAIOordeel) : null;

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
              className="h-20 w-20 rounded-xl object-contain bg-muted p-3"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/placeholder.svg';
              }}
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold">{tool.name}</h1>
                {tool.restricted && (
                  <Badge variant="destructive" className="gap-1">
                    <Lock className="h-3 w-3" />
                    Restricted
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground">{tool.vendor}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline">{tool.category}</Badge>
                {hasAccess ? (
                  <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Toegang
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    <Lock className="h-3 w-3 mr-1" />
                    Geen toegang
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Light Label Card - 4 Point Overview */}
          {label && (
            <Card className={`${oordeelStyle?.border} border-2`}>
              <CardHeader className={`${oordeelStyle?.bg} rounded-t-lg`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full bg-white/50 ${oordeelStyle?.text}`}>
                      {getOordeelIcon(label.routeAIOordeel)}
                    </div>
                    <div>
                      <CardTitle className={oordeelStyle?.text}>
                        RouteAI Oordeel
                      </CardTitle>
                      <CardDescription className={oordeelStyle?.text}>
                        {getOordeelLabel(label.routeAIOordeel)}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-white">
                    AI Label
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Privacy */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium flex items-center gap-2">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        Privacy
                      </h4>
                      {renderScoreBar(label.privacy.score)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {label.privacy.summary}
                    </p>
                  </div>

                  {/* Training */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        Training Vereist
                      </h4>
                      <Badge variant="secondary" className="capitalize">
                        {label.training.requiredLevel}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {label.training.summary}
                    </p>
                  </div>

                  {/* Betrouwbaarheid */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                        Betrouwbaarheid
                      </h4>
                      {renderScoreBar(label.betrouwbaarheid.score)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {label.betrouwbaarheid.summary}
                    </p>
                  </div>

                  {/* AI Act Classificatie */}
                  {fullLabel && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium flex items-center gap-2">
                          <Info className="h-4 w-4 text-muted-foreground" />
                          EU AI Act
                        </h4>
                        <Badge 
                          variant={fullLabel.aiActClassificatie.systemicRisk ? 'destructive' : 'outline'}
                        >
                          {fullLabel.aiActClassificatie.category}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {fullLabel.aiActClassificatie.systemicRisk 
                          ? 'Systemisch risico - extra voorzorgsmaatregelen' 
                          : 'Standaard compliance vereisten'}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Spelregels */}
          {label && label.spelregels.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-primary" />
                  Spelregels voor gebruik
                </CardTitle>
                <CardDescription>
                  Volg deze richtlijnen bij het gebruik van {tool.name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {label.spelregels.map((regel, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-medium text-primary">{index + 1}</span>
                      </div>
                      <span className="text-sm">{regel}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

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
              <CardDescription>Toepassingen en vereiste capabilities</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {tool.useCases.map((useCase, index) => {
                const hasCapability = useCase.requiredCapability 
                  ? userCapabilities.includes(useCase.requiredCapability)
                  : true;
                
                return (
                  <div 
                    key={index} 
                    className={`p-4 border rounded-lg ${!hasCapability ? 'bg-muted/50' : ''}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {hasCapability ? (
                          <CheckCircle className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <Lock className="h-4 w-4 text-muted-foreground" />
                        )}
                        <h3 className="font-medium">{useCase.title}</h3>
                      </div>
                      <Badge variant={getRiskBadgeVariant(useCase.riskLevel)}>
                        {useCase.riskLevel} risk
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground ml-6">{useCase.description}</p>
                    {useCase.requiredCapability && (
                      <p className="text-xs text-muted-foreground ml-6 mt-2">
                        Vereist: {useCase.requiredCapability}
                      </p>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Important Notes */}
          {tool.importantNotes.length > 0 && (
            <Card className="border-amber-500/20 bg-amber-500/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-700">
                  <AlertTriangle className="h-5 w-5" />
                  Belangrijke Opmerkingen
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {tool.importantNotes.map((note, index) => (
                    <li key={index} className="text-sm text-amber-800 flex items-start gap-2">
                      <span className="text-amber-500">•</span>
                      {note}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* CTA - Risico Check */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="py-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="font-semibold">Specifieke use case controleren?</h3>
                  <p className="text-sm text-muted-foreground">
                    Vraag een RouteAI risico-check aan voor jouw specifieke toepassing
                  </p>
                </div>
                <Button className="gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Start Risico-check
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}