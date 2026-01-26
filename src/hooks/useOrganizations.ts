import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Organization {
  id: string;
  name: string;
  slug: string | null;
  sector: string | null;
  country: string | null;
  status: string | null;
  subscription_type: string | null;
  subscription_start_date: string | null;
  subscription_end_date: string | null;
  contact_person: string | null;
  contact_email: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface OrganizationStats {
  total: number;
  active: number;
  expired: number;
  test: number;
  suspended: number;
}

export function useOrganizations() {
  return useQuery({
    queryKey: ['organizations-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return data as Organization[];
    },
  });
}

export function useOrganizationStats(organizations: Organization[] | undefined) {
  const stats: OrganizationStats = {
    total: 0,
    active: 0,
    expired: 0,
    test: 0,
    suspended: 0,
  };

  if (!organizations) return stats;

  stats.total = organizations.length;
  stats.active = organizations.filter(o => o.status === 'active').length;
  stats.expired = organizations.filter(o => o.status === 'expired').length;
  stats.test = organizations.filter(o => o.status === 'test').length;
  stats.suspended = organizations.filter(o => o.status === 'suspended').length;

  return stats;
}

export function useTotalUsers() {
  return useQuery({
    queryKey: ['total-users-platform'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      if (error) throw error;
      return count ?? 0;
    },
  });
}
