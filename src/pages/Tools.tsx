import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Wrench, Search, ExternalLink, AlertTriangle, CheckCircle2, ChevronRight } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { tools } from '@/data/tools';
import { useAppStore } from '@/stores/useAppStore';
import { getCapabilityById } from '@/data/capabilities';

const Tools = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const { getCurrentUser } = useAppStore();
  const user = getCurrentUser();
  const license = user?.license;

  const filteredTools = tools.filter(tool =>
    tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tool.vendor.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tool.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const hasCapability = (capabilityId: string | undefined) => {
    if (!capabilityId) return true;
    return license?.grantedCapabilities.includes(capabilityId);
  };

  const getRiskBadgeClass = (risk: string) => {
    switch (risk) {
      case 'minimal': return 'status-approved';
      case 'limited': return 'status-warning';
      case 'high': return 'status-blocked';
      default: return '';
    }
  };

  const getRiskLabel = (risk: string) => {
    switch (risk) {
      case 'minimal': return 'Minimaal';
      case 'limited': return 'Beperkt';
      case 'high': return 'Hoog';
      default: return risk;
    }
  };

  const activeTool = selectedTool ? tools.find(t => t.id === selectedTool) : null;

  return (
    <AppLayout>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <Wrench className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">AI Tool Catalogus</h1>
            <p className="text-muted-foreground">
              Goedgekeurde AI tools met use-cases en risiconiveaus
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Zoek tools..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* License Warning */}
      {!license && (
        <Card className="mb-6 border-warning/30 bg-warning/5">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-warning" />
              <div className="flex-1">
                <p className="font-medium">Geen AI Licentie</p>
                <p className="text-sm text-muted-foreground">
                  Je hebt een licentie nodig om AI tools te gebruiken.
                </p>
              </div>
              <Button asChild size="sm">
                <Link to="/training">Start Training</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tools Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredTools.map((tool) => (
          <Card 
            key={tool.id}
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedTool === tool.id ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => setSelectedTool(selectedTool === tool.id ? null : tool.id)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary text-xl font-bold">
                  {tool.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <CardTitle className="text-base">{tool.name}</CardTitle>
                  <p className="text-xs text-muted-foreground">{tool.vendor}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Badge variant="outline" className="mb-3">{tool.category}</Badge>
              <p className="text-sm text-muted-foreground line-clamp-2">{tool.description}</p>
              
              {selectedTool === tool.id && (
                <div className="mt-4 pt-4 border-t space-y-4 animate-fade-in">
                  <div>
                    <p className="text-sm font-semibold mb-2">Use Cases:</p>
                    <div className="space-y-2">
                      {tool.useCases.map((useCase, i) => {
                        const canUse = hasCapability(useCase.requiredCapability);
                        const capability = useCase.requiredCapability 
                          ? getCapabilityById(useCase.requiredCapability)
                          : null;
                        
                        return (
                          <div 
                            key={i} 
                            className={`rounded-lg p-3 ${
                              canUse ? 'bg-secondary' : 'bg-destructive/5 border border-destructive/20'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <p className={`text-sm font-medium ${!canUse ? 'text-muted-foreground' : ''}`}>
                                {useCase.title}
                              </p>
                              <Badge variant="outline" className={getRiskBadgeClass(useCase.riskLevel)}>
                                {getRiskLabel(useCase.riskLevel)}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">{useCase.description}</p>
                            {!canUse && capability && (
                              <p className="text-xs text-destructive mt-2 flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                Vereist: {capability.name}
                              </p>
                            )}
                            {canUse && license && (
                              <p className="text-xs text-primary mt-2 flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                Je mag dit
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-semibold mb-2">Belangrijke Opmerkingen:</p>
                    <ul className="space-y-1">
                      {tool.importantNotes.map((note, i) => (
                        <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                          <span className="text-warning">•</span>
                          {note}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTools.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Geen tools gevonden voor "{searchQuery}"</p>
        </div>
      )}
    </AppLayout>
  );
};

export default Tools;
