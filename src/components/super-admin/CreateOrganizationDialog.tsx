import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, addYears } from "date-fns";
import { nl } from "date-fns/locale";
import { CalendarIcon, Building2, Loader2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";

// Validation schema
const createOrganizationSchema = z.object({
  name: z.string().min(2, "Organisatienaam moet minimaal 2 karakters zijn").max(100, "Naam mag maximaal 100 karakters zijn"),
  status: z.enum(["active", "expired", "test", "suspended"], {
    required_error: "Selecteer een status",
  }),
  subscriptionType: z.enum(["basic", "premium"], {
    required_error: "Selecteer een abonnement type",
  }),
  contactPerson: z.string().min(2, "Contactpersoon moet minimaal 2 karakters zijn").max(100, "Naam mag maximaal 100 karakters zijn"),
  email: z.string().email("Voer een geldig e-mailadres in").max(255, "E-mail mag maximaal 255 karakters zijn"),
  phone: z.string().max(20, "Telefoonnummer mag maximaal 20 karakters zijn").optional().or(z.literal("")),
  streetAddress: z.string().max(200, "Straat mag maximaal 200 karakters zijn").optional().or(z.literal("")),
  postalCode: z.string().max(20, "Postcode mag maximaal 20 karakters zijn").optional().or(z.literal("")),
  city: z.string().max(100, "Stad mag maximaal 100 karakters zijn").optional().or(z.literal("")),
  country: z.string().max(100, "Land mag maximaal 100 karakters zijn").default("Nederland"),
  startDate: z.date({
    required_error: "Selecteer een startdatum",
  }),
  endDate: z.date({
    required_error: "Selecteer een einddatum",
  }),
  bankAccount: z.string().max(50, "Rekeningnummer mag maximaal 50 karakters zijn").optional().or(z.literal("")),
  bankName: z.string().max(100, "Banknaam mag maximaal 100 karakters zijn").optional().or(z.literal("")),
}).refine((data) => data.endDate > data.startDate, {
  message: "Einddatum moet na de startdatum liggen",
  path: ["endDate"],
});

type CreateOrganizationFormData = z.infer<typeof createOrganizationSchema>;

interface CreateOrganizationDialogProps {
  trigger?: React.ReactNode;
}

export function CreateOrganizationDialog({ trigger }: CreateOrganizationDialogProps) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const today = new Date();
  const oneYearFromNow = addYears(today, 1);

  const form = useForm<CreateOrganizationFormData>({
    resolver: zodResolver(createOrganizationSchema),
    defaultValues: {
      name: "",
      status: "active",
      subscriptionType: "basic",
      contactPerson: "",
      email: "",
      phone: "",
      streetAddress: "",
      postalCode: "",
      city: "",
      country: "Nederland",
      startDate: today,
      endDate: oneYearFromNow,
      bankAccount: "",
      bankName: "",
    },
  });

  const createOrganization = useMutation({
    mutationFn: async (data: CreateOrganizationFormData) => {
      const { data: result, error } = await supabase
        .from("organizations")
        .insert({
          name: data.name,
          status: data.status,
          subscription_type: data.subscriptionType,
          contact_person: data.contactPerson,
          contact_email: data.email,
          contact_phone: data.phone || null,
          street_address: data.streetAddress || null,
          postal_code: data.postalCode || null,
          city: data.city || null,
          country: data.country || "Nederland",
          subscription_start_date: format(data.startDate, "yyyy-MM-dd"),
          subscription_end_date: format(data.endDate, "yyyy-MM-dd"),
          bank_account: data.bankAccount || null,
          bank_name: data.bankName || null,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (data) => {
      toast({
        title: "Organisatie aangemaakt",
        description: `Organisatie "${data.name}" is succesvol aangemaakt.`,
      });
      queryClient.invalidateQueries({ queryKey: ["organizations-all"] });
      queryClient.invalidateQueries({ queryKey: ["total-users-platform"] });
      setOpen(false);
      form.reset();
      
      // Log for future welcome email feature
      console.log("[CreateOrganization] New org created:", data.id, "- Welcome email pending");
    },
    onError: (error: Error) => {
      toast({
        title: "Fout bij aanmaken",
        description: error.message || "Er is iets misgegaan bij het aanmaken van de organisatie.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateOrganizationFormData) => {
    createOrganization.mutate(data);
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      form.reset();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Building2 className="h-4 w-4 mr-2" />
            + Nieuwe Organisatie
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Nieuwe Organisatie Aanmaken
          </DialogTitle>
          <DialogDescription>
            Voeg een nieuwe organisatie toe aan het platform. Alle velden met * zijn verplicht.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basis Informatie */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm text-muted-foreground">Basis Informatie</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Organisatienaam *</FormLabel>
                      <FormControl>
                        <Input placeholder="Acme B.V." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecteer status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-background">
                          <SelectItem value="active">Actief</SelectItem>
                          <SelectItem value="expired">Verlopen</SelectItem>
                          <SelectItem value="test">Testperiode</SelectItem>
                          <SelectItem value="suspended">Geschorst</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="subscriptionType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Abonnement *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecteer type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-background">
                          <SelectItem value="basic">Basic</SelectItem>
                          <SelectItem value="premium">Premium</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* Contactinformatie */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm text-muted-foreground">Contactinformatie</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="contactPerson"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contactpersoon *</FormLabel>
                      <FormControl>
                        <Input placeholder="Jan de Vries" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-mailadres *</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="jan@acme.nl" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefoonnummer</FormLabel>
                      <FormControl>
                        <Input placeholder="+31 6 12345678" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* Adresgegevens */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm text-muted-foreground">Adresgegevens</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="streetAddress"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Straat + Huisnummer</FormLabel>
                      <FormControl>
                        <Input placeholder="Kerkstraat 123" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="postalCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Postcode</FormLabel>
                      <FormControl>
                        <Input placeholder="1234 AB" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stad</FormLabel>
                      <FormControl>
                        <Input placeholder="Amsterdam" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Land</FormLabel>
                      <FormControl>
                        <Input placeholder="Nederland" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* Abonnement */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm text-muted-foreground">Abonnement Periode</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Startdatum *</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "d MMMM yyyy", { locale: nl })
                              ) : (
                                <span>Selecteer datum</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-background" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                            className="p-3 pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Einddatum *</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "d MMMM yyyy", { locale: nl })
                              ) : (
                                <span>Selecteer datum</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-background" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < form.getValues("startDate")}
                            initialFocus
                            className="p-3 pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* Bankgegevens */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm text-muted-foreground">Bankgegevens (optioneel)</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="bankAccount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rekeningnummer (IBAN)</FormLabel>
                      <FormControl>
                        <Input placeholder="NL91 ABNA 0417 1643 00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bankName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bank</FormLabel>
                      <FormControl>
                        <Input placeholder="ABN AMRO" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={createOrganization.isPending}
              >
                Annuleren
              </Button>
              <Button
                type="submit"
                disabled={createOrganization.isPending || !form.formState.isValid}
              >
                {createOrganization.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Aanmaken...
                  </>
                ) : (
                  "Organisatie Aanmaken"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
