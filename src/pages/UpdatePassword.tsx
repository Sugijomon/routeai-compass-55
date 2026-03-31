import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Shield, Loader2, Lock, Eye, EyeOff } from 'lucide-react';

export default function UpdatePassword() {
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const isValid = newPassword.length >= 8 && newPassword === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success('Wachtwoord bijgewerkt. Je wordt doorgestuurd...');
      setTimeout(() => navigate('/auth'), 1500);
    } catch (error: any) {
      toast.error(error.message || 'Kon wachtwoord niet bijwerken.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">RouteAI</h1>
          <p className="text-muted-foreground mt-2">Nieuw wachtwoord instellen</p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type={showNew ? 'text' : 'password'}
                  placeholder="Nieuw wachtwoord (min. 8 tekens)"
                  className="pl-10 pr-10"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isLoading}
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setShowNew(!showNew)}
                  tabIndex={-1}
                >
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Herhaal wachtwoord"
                  className="pl-10 pr-10"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setShowConfirm(!showConfirm)}
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-sm text-destructive">Wachtwoorden komen niet overeen.</p>
              )}
              {newPassword && newPassword.length < 8 && (
                <p className="text-sm text-destructive">Minimaal 8 tekens vereist.</p>
              )}

              <Button type="submit" className="w-full" disabled={isLoading || !isValid}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Wachtwoord opslaan
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Door in te loggen ga je akkoord met onze gebruiksvoorwaarden
        </p>
      </div>
    </div>
  );
}
