import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

export default function ProfilePage() {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [fullName, setFullName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile?.full_name) {
      setFullName(profile.full_name);
    }
  }, [profile?.full_name]);

  const handleSave = async () => {
    if (!user?.id) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName })
        .eq('id', user.id);

      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['user-profile', user.id] });
      toast.success('Profiel bijgewerkt');
    } catch (err: any) {
      console.error('Profile save error:', err);
      toast.error(`Fout bij opslaan: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto py-6 space-y-6 max-w-2xl">
        <PageHeader
          title="Mijn profiel"
        />

        <Card>
          <CardHeader>
            <CardTitle>Mijn gegevens</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Naam</Label>
              <Input
                id="full_name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Je volledige naam"
              />
            </div>
            <div className="space-y-2">
              <Label>E-mailadres</Label>
              <Input
                value={user?.email ?? ''}
                readOnly
                className="bg-muted"
              />
            </div>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Opslaan...' : 'Opslaan'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Beveiliging</CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              onClick={() => navigate('/auth/update-password')}
            >
              Wachtwoord wijzigen
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
