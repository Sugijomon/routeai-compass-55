import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Wrench, Plus, Search, ArrowLeft, ExternalLink, Loader2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';

interface Tool {
  id: string;
  name: string;
  vendor: string;
  description: string | null;
  category: string | null;
  gpai_status: boolean | null;
  hosting_location: string | null;
  data_residency: string | null;
  status: string | null;
  version: string | null;
  created_at: string | null;
}

export default function ToolsLibraryManagement() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Fetch tools from tools_library
  const { data: tools, isLoading } = useQuery({
    queryKey: ['super-admin-tools-library'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tools_library')
        .select('*')
        .order('name');

      if (error) throw error;
      return data as Tool[];
    }
  });

  // Get unique categories for filter
  const categories = [...new Set(tools?.map(t => t.category).filter(Boolean))];

  const filteredTools = tools?.filter(tool => {
    const matchesSearch = tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tool.vendor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tool.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || tool.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || tool.status === filterStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <Button variant="ghost" size="sm" onClick={() => navigate('/super-admin')} className="mb-2">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Terug naar Dashboard
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Wrench className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Tools Library Beheer</h1>
                <p className="text-muted-foreground">
                  Platform-brede AI tools bibliotheek — GPAI = General Purpose AI (EU AI Act Art. 51)
                </p>
              </div>
            </div>
          </div>

          <Button onClick={() => navigate('/super-admin/tools/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Tool Toevoegen
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Zoek op naam, vendor, beschrijving..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Categorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle categorieën</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat!}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle statussen</SelectItem>
                  <SelectItem value="published">Gepubliceerd</SelectItem>
                  <SelectItem value="draft">Concept</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tools Table */}
        <Card>
          <CardHeader>
            <CardTitle>AI Tools ({filteredTools?.length || 0})</CardTitle>
            <CardDescription>
              Alle AI tools in de platform bibliotheek
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredTools && filteredTools.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Naam</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Categorie</TableHead>
                    <TableHead>GPAI Status</TableHead>
                    <TableHead>Data Hosting</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Versie</TableHead>
                    <TableHead className="text-right">Acties</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTools.map((tool) => (
                    <TableRow key={tool.id}>
                      <TableCell className="font-medium">{tool.name}</TableCell>
                      <TableCell>{tool.vendor || '—'}</TableCell>
                      <TableCell>{tool.category || '—'}</TableCell>
                      <TableCell>
                        <Badge variant={tool.gpai_status ? 'default' : 'outline'}>
                          {tool.gpai_status ? 'GPAI' : 'Niet-GPAI'}
                        </Badge>
                      </TableCell>
                      <TableCell>{tool.hosting_location || tool.data_residency || '—'}</TableCell>
                      <TableCell>
                        <Badge variant={tool.status === 'published' ? 'default' : 'secondary'}>
                          {tool.status === 'published' ? 'Gepubliceerd' : 'Concept'}
                        </Badge>
                      </TableCell>
                      <TableCell>{tool.version || '1.0'}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => navigate(`/super-admin/tools/${tool.id}`)}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8">
                <Wrench className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Geen tools gevonden</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
