import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Shield, Mail, Loader2, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { getDashboardPathFromRoles } from '@/hooks/useDashboardRedirect';

async function fetchRolesAndGetPath(userId: string): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching user roles:', error);
      return '/user-dashboard';
    }

    const roles = (data || []).map(r => r.role as string);

    const { data: profile } = await supabase
      .from('profiles')
      .select('org_id')
      .eq('id', userId)
      .maybeSingle();

    let planType: string | undefined;
    if (profile?.org_id) {
      const { data: org } = await supabase
        .from('organizations')
        .select('plan_type')
        .eq('id', profile.org_id)
        .maybeSingle();
      planType = org?.plan_type ?? undefined;
    }

    return getDashboardPathFromRoles(roles, planType);
  } catch {
    return '/user-dashboard';
  }
}

export default function Auth() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState<'password' | 'magiclink' | 'reset'>('password');
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  // Redirect als al ingelogd
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        const path = await fetchRolesAndGetPath(session.user.id);
        navigate(path, { replace: true });
      }
    });
  }, [navigate]);

  // Luister naar auth changes (voor OAuth callback)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          await new Promise(resolve => setTimeout(resolve, 500));
          const path = await fetchRolesAndGetPath(session.user.id);
          navigate(path, { replace: true });
        }
      }
    );
    return () => subscription.unsubscribe();
  }, [navigate]);

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message || 'Inloggen mislukt. Controleer je e-mailadres en wachtwoord.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });
      if (error) throw error;
      setMagicLinkSent(true);
      toast.success('Inloglink verstuurd! Check je e-mail.');
    } catch (error: any) {
      toast.error(error.message || 'Kon geen e-maillink versturen');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });
      if (error) throw error;
      setResetSent(true);
      toast.success('Resetlink verstuurd! Check je e-mail.');
    } catch (error: any) {
      toast.error(error.message || 'Kon geen resetlink versturen.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: 'google' | 'apple') => {
    setIsLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth(provider, {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        toast.error(`${provider === 'google' ? 'Google' : 'Apple'} login mislukt`);
      }
    } catch {
      toast.error(`${provider === 'google' ? 'Google' : 'Apple'} login mislukt`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">RouteAI</h1>
          <p className="text-muted-foreground mt-2">
            Governance framework voor verantwoord AI-gebruik
          </p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-4">
            {magicLinkSent ? (
              <div className="text-center p-4 rounded-lg bg-muted">
                <Mail className="w-8 h-8 mx-auto mb-2 text-primary" />
                <p className="font-medium text-foreground">Check je e-mail</p>
                <p className="text-sm text-muted-foreground mt-1">
                  We hebben een inloglink gestuurd naar <strong>{email}</strong>
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-3"
                  onClick={() => setMagicLinkSent(false)}
                >
                  Andere methode kiezen
                </Button>
              </div>
            ) : resetSent ? (
              <div className="text-center p-4 rounded-lg bg-muted">
                <Mail className="w-8 h-8 mx-auto mb-2 text-primary" />
                <p className="font-medium text-foreground">Check je e-mail</p>
                <p className="text-sm text-muted-foreground mt-1">
                  We hebben een resetlink gestuurd naar <strong>{email}</strong>
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-3"
                  onClick={() => { setResetSent(false); setMode('password'); }}
                >
                  Terug naar inloggen
                </Button>
              </div>
            ) : mode === 'reset' ? (
              <>
                <button
                  type="button"
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setMode('password')}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Terug naar inloggen
                </button>
                <p className="text-sm text-muted-foreground">
                  Vul je e-mailadres in. Je ontvangt een link om een nieuw wachtwoord in te stellen.
                </p>
                <form onSubmit={handlePasswordReset} className="space-y-3">
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="naam@bedrijf.nl"
                      className="pl-10"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLoading}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Stuur resetlink
                  </Button>
                </form>
              </>
            ) : mode === 'password' ? (
              <>
                {/* Wachtwoord-modus */}
                <form onSubmit={handlePasswordLogin} className="space-y-3">
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="naam@bedrijf.nl"
                      className="pl-10"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLoading}
                      required
                    />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Wachtwoord"
                      className="pl-10 pr-10"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Inloggen
                  </Button>
                </form>

                <div className="flex justify-end">
                  <button
                    type="button"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setMode('reset')}
                  >
                    Wachtwoord vergeten?
                  </button>
                </div>

                <button
                  type="button"
                  className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors text-center"
                  onClick={() => setMode('magiclink')}
                >
                  Geen wachtwoord? Stuur inloglink
                </button>

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">of</span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full py-5 text-base"
                  onClick={() => handleOAuthLogin('google')}
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <GoogleIcon />}
                  Inloggen met Google
                </Button>

                <Button
                  variant="outline"
                  className="w-full py-5 text-base"
                  onClick={() => handleOAuthLogin('apple')}
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <AppleIcon />}
                  Inloggen met Apple
                </Button>
              </>
            ) : (
              <>
                {/* Magic link-modus */}
                <form onSubmit={handleMagicLink} className="space-y-3">
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="naam@bedrijf.nl"
                      className="pl-10"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLoading}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
                    Stuur inloglink
                  </Button>
                </form>

                <button
                  type="button"
                  className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors text-center"
                  onClick={() => setMode('password')}
                >
                  Inloggen met wachtwoord
                </button>

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">of</span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full py-5 text-base"
                  onClick={() => handleOAuthLogin('google')}
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <GoogleIcon />}
                  Inloggen met Google
                </Button>

                <Button
                  variant="outline"
                  className="w-full py-5 text-base"
                  onClick={() => handleOAuthLogin('apple')}
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <AppleIcon />}
                  Inloggen met Apple
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Door in te loggen ga je akkoord met onze gebruiksvoorwaarden
        </p>
      </div>
    </div>
  );
}
