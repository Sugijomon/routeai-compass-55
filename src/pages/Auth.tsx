import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Shield, Mail, Loader2, Lock, Eye, EyeOff, ArrowLeft, KeyRound } from 'lucide-react';
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
  const [passwordModal, setPasswordModal] = useState(false);
  const [pendingRedirectPath, setPendingRedirectPath] = useState<string | null>(null);

  const getPromptCount = () => {
    try { return parseInt(localStorage.getItem('password_prompt_count') || '0', 10); } catch { return 0; }
  };
  const incrementPromptCount = () => {
    const next = getPromptCount() + 1;
    localStorage.setItem('password_prompt_count', String(next));
    return next;
  };

  const handlePostLogin = useCallback(async (userId: string) => {
    const path = await fetchRolesAndGetPath(userId);

    // Check password prompt conditions
    const count = getPromptCount();
    if (count < 3) {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('has_set_password, banner_password_dismissed')
          .eq('id', userId)
          .maybeSingle();

        // Extra check: als gebruiker een echte password-identity heeft, skip modal
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        const hasPassword = currentUser?.identities?.some(
          id => id.provider === 'email' && id.identity_data?.email_verified
        ) && currentUser?.app_metadata?.provider !== 'email_otp';

        if (data && !data.has_set_password && !data.banner_password_dismissed && !hasPassword) {
          setPendingRedirectPath(path);
          setPasswordModal(true);
          return;
        }
      } catch { /* continue redirect */ }
    }

    navigate(path, { replace: true });
  }, [navigate]);

  const handleSetPassword = () => {
    incrementPromptCount();
    setPasswordModal(false);
    navigate('/auth/update-password');
  };

  const handleSkipPassword = async () => {
    const newCount = incrementPromptCount();
    if (newCount >= 3) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await supabase
          .from('profiles')
          .update({ banner_password_dismissed: true } as any)
          .eq('id', session.user.id);
      }
    }
    setPasswordModal(false);
    if (pendingRedirectPath) {
      navigate(pendingRedirectPath, { replace: true });
    }
  };

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
          await handlePostLogin(session.user.id);
        }
      }
    );
    return () => subscription.unsubscribe();
  }, [navigate, handlePostLogin]);

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;

      // Gebruiker logt in met wachtwoord — markeer als ingesteld, toon geen modal
      if (data.user) {
        await supabase
          .from('profiles')
          .update({ has_set_password: true } as any)
          .eq('id', data.user.id);
      }
      // redirect happens via onAuthStateChange
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
                  <div className="flex justify-end">
                    <button
                      type="button"
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => setMode('reset')}
                    >
                      Wachtwoord vergeten?
                    </button>
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Inloggen
                  </Button>
                </form>

                <p className="text-sm text-center text-muted-foreground">
                  Geen wachtwoord?{' '}
                  <span
                    className="text-primary cursor-pointer hover:underline"
                    onClick={() => setMode('magiclink')}
                  >
                    Stuur inloglink
                  </span>
                </p>

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

              </>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Door in te loggen ga je akkoord met onze gebruiksvoorwaarden
        </p>
      </div>

      <Dialog open={passwordModal} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <div className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-primary" />
              <DialogTitle>Sneller inloggen?</DialogTitle>
            </div>
            <DialogDescription>
              Je bent ingelogd via een e-maillink. Wil je een wachtwoord
              instellen zodat je de volgende keer direct kunt inloggen?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={handleSkipPassword}>
              Misschien later
            </Button>
            <Button onClick={handleSetPassword}>
              Wachtwoord instellen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
