import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Shield } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store/useAppStore';

export default function RoleSelector() {
  const navigate = useNavigate();
  const { setCurrentUser, getUserByRole } = useAppStore();

  const handleUserLogin = () => {
    const user = getUserByRole('user');
    if (user) {
      setCurrentUser(user);
      navigate('/dashboard');
    }
  };

  const handleAdminLogin = () => {
    const admin = getUserByRole('org_admin');
    if (admin) {
      setCurrentUser(admin);
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-500 to-blue-600 p-4">
      <div className="w-full max-w-2xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-white flex items-center justify-center gap-3">
            <Shield className="h-10 w-10 text-white" />
            RouteAI
          </h1>
          <p className="text-lg text-white/90">
            AI Governance voor MKB
          </p>
        </div>

        {/* Role Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Gebruiker Card */}
          <Card 
            className="bg-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer" 
            onClick={handleUserLogin}
          >
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-teal-600" />
              </div>
              <CardTitle className="text-gray-900">Inloggen als Gebruiker</CardTitle>
              <CardDescription>
                Bekijk je dashboard en volg trainingen
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-teal-600 hover:bg-teal-700 text-white py-6 text-lg">
                Doorgaan als Jan Smit
              </Button>
            </CardContent>
          </Card>

          {/* Beheerder Card */}
          <Card 
            className="bg-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer" 
            onClick={handleAdminLogin}
          >
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center">
                <Shield className="w-8 h-8 text-teal-600" />
              </div>
              <CardTitle className="text-gray-900">Inloggen als Beheerder</CardTitle>
              <CardDescription>
                Beheer je team en bekijk statistieken
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-teal-600 hover:bg-teal-700 text-white py-6 text-lg">
                Doorgaan als Lisa de Vries
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-sm text-white/80">
            Demo omgeving - Geen echte authenticatie vereist
          </p>
        </div>
      </div>
    </div>
  );
}
