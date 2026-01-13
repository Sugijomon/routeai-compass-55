import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Shield, AlertTriangle, CheckCircle, Lock, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useAppStore } from '@/store/useAppStore';
import { MOCK_TOOLS } from '@/data/mockTools';
import { RouteAIOordeel } from '@/types';

export default function ToolCatalog() {
  const navigate = useNavigate();
  const { currentUser } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');

  if (!currentUser) {
    navigate('/');
    return null;
  }

  const hasLicense = currentUser.license?.status === 'active';
  const userCapabilities = currentUser.license?.grantedCapabilities || [];

  // Filter tools based on search
  const filteredTools = MOCK_TOOLS.filter(tool => 
    tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tool.vendor.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tool.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Check if user has access to a tool
  const hasToolAccess = (tool: typeof MOCK_TOOLS[0]) => {
    if (!hasLicense) return false;
    if (tool.restricted && tool.requiredCapability) {
      return userCapabilities.includes(tool.requiredCapability);
    }
    return true;
  };

  // Get oordeel styling
  const getOordeelStyle = (oordeel: RouteAIOordeel) => {
    switch (oordeel) {
      case 'vertrouwd':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'vertrouwd-met-instructies':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'verhoogde-aandacht':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'niet-aanbevolen':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getOordeelIcon = (oordeel: RouteAIOordeel) => {
    switch (oordeel) {
      case 'vertrouwd':
        return <CheckCircle className="h-3 w-3" />;
      case 'vertrouwd-met-instructies':
        return <Eye className="h-3 w-3" />;
      case 'verhoogde-aandacht':
        return <AlertTriangle className="h-3 w-3" />;
      case 'niet-aanbevolen':
        return <Shield className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const getOordeelLabel = (oordeel: RouteAIOordeel) => {
    switch (oordeel) {
      case 'vertrouwd':
        return 'Vertrouwd';
      case 'vertrouwd-met-instructies':
        return 'Met instructies';
      case 'verhoogde-aandacht':
        return 'Verhoogde aandacht';
      case 'niet-aanbevolen':
        return 'Niet aanbevolen';
      default:
        return oordeel;
    }
  };

  // Render score dots
  const renderScoreDots = (score: number, maxScore: number = 5) => {
    return (
      <div className="flex gap-0.5">
        {Array.from({ length: maxScore }).map((_, i) => (
          <div
            key={i}
            className={`h-2 w-2 rounded-full ${
              i < score ? 'bg-teal-500' : 'bg-muted'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Terug naar Dashboard
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Title & Search */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">AI Tools Catalogus</h1>
              <p className="text-muted-foreground">
                Goedgekeurde AI tools met RouteAI beoordelingen
              </p>
            </div>
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Zoek op naam, vendor of categorie..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* No License Warning */}
          {!hasLicense && (
            <Card className="border-amber-500/50 bg-amber-500/10">
              <CardContent className="py-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  <div>
                    <p className="font-medium text-amber-800">Geen actief AI-rijbewijs</p>
                    <p className="text-sm text-amber-700">
                      Voltooi eerst de training om tools te kunnen gebruiken.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tools Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTools.map((tool) => {
              const hasAccess = hasToolAccess(tool);
              const label = tool.lightLabel;
              
              return (
                <Card 
                  key={tool.id} 
                  className={`hover:border-primary/50 transition-colors cursor-pointer relative ${
                    !hasAccess ? 'opacity-75' : ''
                  }`}
                  onClick={() => navigate(`/tools/${tool.id}`)}
                >
                  {/* Restricted Badge */}
                  {tool.restricted && (
                    <div className="absolute top-3 right-3">
                      <Badge variant="destructive" className="gap-1">
                        <Lock className="h-3 w-3" />
                        Restricted
                      </Badge>
                    </div>
                  )}
                  
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <img 
                        src={tool.logoUrl} 
                        alt={tool.name}
                        className="h-12 w-12 rounded-lg object-contain bg-muted p-2"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder.svg';
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg truncate">{tool.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{tool.vendor}</p>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* RouteAI Oordeel Badge */}
                    {label && (
                      <Badge 
                        variant="outline" 
                        className={`gap-1 ${getOordeelStyle(label.routeAIOordeel)}`}
                      >
                        {getOordeelIcon(label.routeAIOordeel)}
                        {getOordeelLabel(label.routeAIOordeel)}
                      </Badge>
                    )}
                    
                    {/* Compact Light Label */}
                    {label && (
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="space-y-1">
                          <p className="text-muted-foreground">Privacy</p>
                          {renderScoreDots(label.privacy.score)}
                        </div>
                        <div className="space-y-1">
                          <p className="text-muted-foreground">Training</p>
                          <p className="font-medium capitalize">{label.training.requiredLevel}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-muted-foreground">Betrouwbaar</p>
                          {renderScoreDots(label.betrouwbaarheid.score)}
                        </div>
                      </div>
                    )}

                    {/* Category Badge */}
                    <Badge variant="secondary" className="text-xs">
                      {tool.category}
                    </Badge>
                    
                    {/* Access Status */}
                    <div className="flex items-center justify-between pt-2 border-t">
                      {hasAccess ? (
                        <span className="text-xs text-emerald-600 flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Toegang
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Lock className="h-3 w-3" />
                          {tool.restricted ? 'Capability vereist' : 'Rijbewijs vereist'}
                        </span>
                      )}
                      <Button variant="ghost" size="sm" className="text-xs">
                        Bekijk Details →
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* No Results */}
          {filteredTools.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Geen tools gevonden voor "{searchQuery}"
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}