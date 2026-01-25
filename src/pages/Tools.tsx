import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Wrench, Search, AlertTriangle, ArrowLeft } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { tools } from '@/data/tools';
import { useDashboardRedirect } from '@/hooks/useDashboardRedirect';
import { useUserProfile } from '@/hooks/useUserProfile';

const Tools = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const navigate = useNavigate();
  const dashboardUrl = useDashboardRedirect();
  const { profile, hasAiRijbewijs } = useUserProfile();
  

  const filteredTools = tools.filter(tool =>
    tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tool.vendor.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tool.category.toLowerCase().includes(searchQuery.toLowerCase())
  );


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
      {/* Back Button */}
      <Button 
        variant="ghost" 
        className="mb-6 gap-2" 
        onClick={() => navigate(dashboardUrl)}
      >
        <ArrowLeft className="h-4 w-4" />
        Terug naar Dashboard
      </Button>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <Wrench className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">AI Tool Catalogus</h1>
            <p className="text-muted-foreground">
              Technische eigenschappen van tools (niet bepalend voor routes)
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
      {!hasAiRijbewijs && (
        <Card className="mb-6 border-warning/30 bg-warning/5">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-warning" />
              <div className="flex-1">
                <p className="font-medium">Geen AI-Rijbewijs</p>
                <p className="text-sm text-muted-foreground">
                  Je hebt een AI-Rijbewijs nodig om AI tools te gebruiken.
                </p>
              </div>
              <Button asChild size="sm">
                <Link to="/learn">Start Training</Link>
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
                    <p className="text-sm font-semibold mb-2">Technische Details:</p>
                    <div className="space-y-2">
                      <div className="rounded-lg p-3 bg-secondary">
                        <p className="text-xs text-muted-foreground">
                          Categorie: {tool.category}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Deze tool is beschikbaar voor gebruik na een goedgekeurde AI Check.
                        </p>
                      </div>
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
