import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useUserRole } from '@/hooks/useUserRole';

export function SetPasswordBanner() {
  const { user } = useAuth();
  const { role, isSuperAdmin, isContentEditor } = useUserRole();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isDismissing, setIsDismissing] = useState(false);

  const { data: shouldShow, isLoading } = useQuery({
    queryKey: ['password-banner', user?.id],
    queryFn: async () => {
      if (!user?.id) return false;

      const { data, error } = await supabase
        .from('profiles')
        .select('has_set_password, banner_password_dismissed')
        .eq('id', user.id)
        .maybeSingle();

      if (error || !data) return false;
      return !data.has_set_password && !data.banner_password_dismissed;
    },
    enabled: !!user?.id && !!role && !isSuperAdmin && !isContentEditor,
  });

  if (isLoading || !shouldShow || isSuperAdmin || isContentEditor) return null;

  const handleDismiss = async () => {
    setIsDismissing(true);
    await supabase
      .from('profiles')
      .update({ banner_password_dismissed: true } as any)
      .eq('id', user!.id);
    queryClient.invalidateQueries({ queryKey: ['password-banner'] });
  };

  return (
    <div className="border-b bg-accent/50 px-4 py-3">
      <div className="container flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-sm">
          <KeyRound className="h-4 w-4 shrink-0 text-primary" />
          <span>
            Wil je sneller inloggen? Stel een wachtwoord in — dan kun je ook
            inloggen zonder e-maillink.
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button size="sm" onClick={() => navigate('/auth/update-password')}>
            Wachtwoord instellen
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDismiss}
            disabled={isDismissing}
          >
            {isDismissing ? '…' : 'Niet nu'}
          </Button>
        </div>
      </div>
    </div>
  );
}
