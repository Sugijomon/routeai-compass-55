import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Award, AlertTriangle, LogOut, Shield } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/store/useAppStore';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { currentUser, setCurrentUser, users } = useAppStore();

  if (!currentUser) {
    return null;
  }

  const handleLogout = () => {
    setCurrentUser(null);
    navigate('/');
  };

  // Calculate stats
  const totalUsers = users.length;
  const licensedUsers = users.filter(u => u.license?.status === 'active').length;
  const pendingUsers = users.filter(u => !u.license).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-semibold">RouteAI</h1>
            <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">
              Beheerder
            </Badge>
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
          <h2 className="text-2xl font-bold">Beheerder Dashboard</h2>
          <p className="text-muted-foreground">
            Bekijk team statistieken en beheer AI-rijbewijzen
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Total Users */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                Totaal Gebruikers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-3xl font-bold">{totalUsers}</span>
            </CardContent>
          </Card>

          {/* Licensed Users */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Award className="h-4 w-4 text-primary" />
                Met Rijbewijs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-3xl font-bold text-primary">{licensedUsers}</span>
              <span className="text-sm text-muted-foreground ml-2">/ {totalUsers}</span>
            </CardContent>
          </Card>

          {/* Pending Users */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Wachtend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-3xl font-bold text-amber-500">{pendingUsers}</span>
              <span className="text-sm text-muted-foreground ml-2">zonder rijbewijs</span>
            </CardContent>
          </Card>
        </div>

        {/* Team Members */}
        <Card>
          <CardHeader>
            <CardTitle>Team Overzicht</CardTitle>
            <CardDescription>Alle gebruikers in je organisatie</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {users.map((user) => (
                <div 
                  key={user.id} 
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                      <span className="text-sm font-medium">
                        {user.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {user.role === 'org_admin' && (
                      <Badge variant="outline">Beheerder</Badge>
                    )}
                    {user.license?.status === 'active' ? (
                      <Badge className="bg-primary/10 text-primary border-primary/20">
                        <Award className="h-3 w-3 mr-1" />
                        Rijbewijs Actief
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Geen Rijbewijs</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
