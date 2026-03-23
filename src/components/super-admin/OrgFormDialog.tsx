import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Search, Shield, Layers, Loader2, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Organization {
  id: string;
  name: string;
  status: string | null;
  plan_type?: string | null;
  subscription_type?: string | null;
  contact_email?: string | null;
  contact_person?: string | null;
  contact_phone?: string | null;
  sector?: string | null;
  country?: string | null;
  street_address?: string | null;
  postal_code?: string | null;
  city?: string | null;
  bank_account?: string | null;
  bank_name?: string | null;
  subscription_start_date?: string | null;
  subscription_end_date?: string | null;
  created_at: string | null;
}

interface OrgFormDialogProps {
  trigger: React.ReactNode;
  org?: Organization;
  onSuccess?: () => void;
}

const MODULE_OPTIONS = [
  {
    value: 'shadow_only',
    icon: Search,
    title: 'Shadow AI Scan',
    description: 'Inventariseer AI-gebruik. Contactpersoon wordt DPO.',
  },
  {
    value: 'routeai',
    icon: Shield,
    title: 'RouteAI Platform',
    description: 'Volledig governance platform. Contactpersoon wordt Org Admin.',
  },
  {
    value: 'both',
    icon: Layers,
    title: 'Scan + RouteAI',
    description: 'Start met scan, gebruik direct het volledige platform.',
  },
] as const;

const SECTOR_OPTIONS = [
  'Zorg',
  'Onderwijs',
  'Zakelijke dienstverlening',
  'Overheid',
  'Retail',
  'EdTech',
  'Anders',
];

const COUNTRY_OPTIONS = [
  { value: 'NL', label: 'Nederland' },
  { value: 'BE', label: 'België' },
  { value: 'DE', label: 'Duitsland' },
  { value: 'OTHER', label: 'Overig' },
];

function getDefaultDates() {
  const today = new Date();
  const nextYear = new Date(today);
  nextYear.setFullYear(nextYear.getFullYear() + 1);
  return {
    start: today.toISOString().split('T')[0],
    end: nextYear.toISOString().split('T')[0],
  };
}

export function OrgFormDialog({ trigger, org, onSuccess }: OrgFormDialogProps) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const isEdit = !!org;
  const defaults = getDefaultDates();

  // Form state
  const [planType, setPlanType] = useState('shadow_only');
  const [name, setName] = useState('');
  const [sector, setSector] = useState('');
  const [country, setCountry] = useState('NL');
  const [subscriptionType, setSubscriptionType] = useState('basic');
  const [status, setStatus] = useState('trial');
  const [startDate, setStartDate] = useState(defaults.start);
  const [endDate, setEndDate] = useState(defaults.end);
  const [contactPerson, setContactPerson] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [city, setCity] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [bankName, setBankName] = useState('');
  const [addressOpen, setAddressOpen] = useState(false);

  // Pre-fill on edit
  useEffect(() => {
    if (org && open) {
      setName(org.name || '');
      setSector(org.sector || '');
      setCountry(org.country || 'NL');
      setSubscriptionType(org.subscription_type || 'basic');
      setStatus(org.status || 'trial');
      setStartDate(org.subscription_start_date || defaults.start);
      setEndDate(org.subscription_end_date || defaults.end);
      setContactPerson(org.contact_person || '');
      setContactEmail(org.contact_email || '');
      setContactPhone(org.contact_phone || '');
      setStreetAddress(org.street_address || '');
      setPostalCode(org.postal_code || '');
      setCity(org.city || '');
      setBankAccount(org.bank_account || '');
      setBankName(org.bank_name || '');
      setPlanType(org.plan_type || 'routeai');
    } else if (!org && open) {
      // Reset for create
      setName('');
      setSector('');
      setCountry('NL');
      setSubscriptionType('basic');
      setStatus('trial');
      setStartDate(defaults.start);
      setEndDate(defaults.end);
      setContactPerson('');
      setContactEmail('');
      setContactPhone('');
      setStreetAddress('');
      setPostalCode('');
      setCity('');
      setBankAccount('');
      setBankName('');
      setPlanType('shadow_only');
    }
  }, [org, open]);

  const mutation = useMutation({
    mutationFn: async () => {
      const orgData: Record<string, unknown> = {
        name,
        sector: sector || null,
        country: country || null,
        subscription_type: subscriptionType,
        status,
        subscription_start_date: startDate || null,
        subscription_end_date: endDate || null,
        contact_person: contactPerson || null,
        contact_email: contactEmail || null,
        contact_phone: contactPhone || null,
        street_address: streetAddress || null,
        postal_code: postalCode || null,
        city: city || null,
        bank_account: bankAccount || null,
        bank_name: bankName || null,
      };

      if (isEdit) {
        const { error } = await supabase
          .from('organizations')
          .update(orgData)
          .eq('id', org!.id);
        if (error) throw error;
      } else {
        // Aanmaken
        (orgData as Record<string, unknown>).plan_type = planType;
        const { data: result, error } = await supabase
          .from('organizations')
          .insert(orgData)
          .select()
          .single();
        if (error) throw error;

        // Uitnodiging versturen als er een e-mail is
        if (contactEmail) {
          const contactRole = planType === 'shadow_only' ? 'dpo' : 'org_admin';
          const { error: inviteError } = await supabase.functions.invoke('invite-user', {
            body: {
              email: contactEmail,
              role: contactRole,
              orgId: result.id,
              name: contactPerson || undefined,
            },
          });
          if (inviteError) {
            console.error('Uitnodiging mislukt:', inviteError);
          }
          const roleLabel = planType === 'shadow_only' ? 'DPO' : 'Org Admin';
          toast.success('Organisatie aangemaakt', {
            description: `Uitnodiging verstuurd naar ${contactEmail} als ${roleLabel}.`,
          });
          return;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['super-admin-organizations'] });
      queryClient.invalidateQueries({ queryKey: ['platform-kpis'] });
      if (isEdit) {
        toast.success('Organisatie bijgewerkt');
      } else if (!contactEmail) {
        toast.success('Organisatie aangemaakt');
      }
      setOpen(false);
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(isEdit ? 'Kon organisatie niet bijwerken' : 'Kon organisatie niet aanmaken', {
        description: error.message,
      });
    },
  });

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error('Vul een organisatienaam in');
      return;
    }
    if (!isEdit && !contactEmail?.trim()) {
      toast.error('Vul een e-mailadres in voor de contactpersoon');
      return;
    }
    mutation.mutate();
  };

  const showFinancial = subscriptionType === 'premium' || subscriptionType === 'enterprise';

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Organisatie Bewerken' : 'Nieuwe Organisatie Aanmaken'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Pas de gegevens van deze organisatie aan' : 'Maak een nieuwe organisatie aan op het platform'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Module selectie — alleen bij aanmaken */}
          {!isEdit && (
            <div className="space-y-3">
              <div>
                <Label className="text-sm font-semibold">Module</Label>
                <p className="text-xs text-muted-foreground">
                  Welke modules worden gekoppeld aan deze organisatie?
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {MODULE_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const selected = planType === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setPlanType(opt.value)}
                      className={cn(
                        'flex flex-col items-start gap-2 rounded-lg border p-3 text-left transition-colors',
                        selected
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-muted-foreground/30'
                      )}
                    >
                      <Icon className={cn('h-5 w-5', selected ? 'text-primary' : 'text-muted-foreground')} />
                      <span className="text-sm font-medium">{opt.title}</span>
                      <span className="text-xs text-muted-foreground">{opt.description}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Organisatiegegevens */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Organisatiegegevens</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="org-name" className="text-xs">Organisatienaam *</Label>
                <Input id="org-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Bedrijfsnaam B.V." />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Sector</Label>
                <Select value={sector} onValueChange={setSector}>
                  <SelectTrigger><SelectValue placeholder="Kies sector" /></SelectTrigger>
                  <SelectContent>
                    {SECTOR_OPTIONS.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Land</Label>
                <Select value={country} onValueChange={setCountry}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {COUNTRY_OPTIONS.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Abonnement */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Abonnement</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Type</Label>
                <Select value={subscriptionType} onValueChange={setSubscriptionType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="trial">Trial</SelectItem>
                    <SelectItem value="active">Actief</SelectItem>
                    <SelectItem value="test">Test</SelectItem>
                    <SelectItem value="inactive">Inactief</SelectItem>
                    <SelectItem value="expired">Verlopen</SelectItem>
                    <SelectItem value="suspended">Geschorst</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="start-date" className="text-xs">Startdatum</Label>
                <Input id="start-date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="end-date" className="text-xs">Einddatum</Label>
                <Input id="end-date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>
          </div>

          {/* Contactpersoon */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Contactpersoon</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="contact-name" className="text-xs">Naam contactpersoon</Label>
                <Input id="contact-name" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} placeholder="Jan Jansen" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="contact-email" className="text-xs">E-mailadres {!isEdit && '*'}</Label>
                <Input id="contact-email" type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="contact@bedrijf.nl" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="contact-phone" className="text-xs">Telefoonnummer</Label>
                <Input id="contact-phone" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="+31 6 12345678" />
              </div>
            </div>
          </div>

          {/* Adres (inklapbaar) */}
          <Collapsible open={addressOpen} onOpenChange={setAddressOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
                <ChevronDown className={cn('h-4 w-4 transition-transform', addressOpen && 'rotate-180')} />
                Adresgegevens
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs">Straat + huisnummer</Label>
                  <Input value={streetAddress} onChange={(e) => setStreetAddress(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Postcode</Label>
                  <Input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Plaatsnaam</Label>
                  <Input value={city} onChange={(e) => setCity(e.target.value)} />
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Financieel (conditioneel) */}
          {showFinancial && (
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Financieel</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">IBAN</Label>
                  <Input value={bankAccount} onChange={(e) => setBankAccount(e.target.value)} placeholder="NL00 BANK 0000 0000 00" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Banknaam</Label>
                  <Input value={bankName} onChange={(e) => setBankName(e.target.value)} />
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Annuleren</Button>
          <Button onClick={handleSubmit} disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mutation.isPending ? 'Bezig...' : isEdit ? 'Opslaan' : 'Aanmaken'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}