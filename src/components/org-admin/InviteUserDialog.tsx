import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Loader2, Mail } from "lucide-react";
import { useUserProfile } from "@/hooks/useUserProfile";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import InviteEmailTemplateEditor, {
  type InviteEmailTemplate,
} from "./InviteEmailTemplateEditor";

interface InviteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function InviteUserDialog({ open, onOpenChange }: InviteUserDialogProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("user");
  const [checking, setChecking] = useState(false);
  const inviteUser = useInviteUser();
  const { profile } = useUserProfile();

  const handleInvite = async () => {
    if (!email.trim()) return;

    // Check org_admin limit before inviting
    if (role === "org_admin" && profile?.org_id) {
      setChecking(true);
      try {
        const { count, error } = await supabase
          .from("user_roles")
          .select("id", { count: "exact", head: true })
          .eq("org_id", profile.org_id)
          .eq("role", "org_admin");

        if (!error && (count ?? 0) >= 2) {
          toast.error(
            "Deze organisatie heeft al 2 AI Verantwoordelijken. Verwijder eerst een bestaande AI Verantwoordelijke om een nieuwe toe te voegen."
          );
          setChecking(false);
          return;
        }
      } catch {
        // Allow invite to proceed; DB trigger is the hard guard
      }
      setChecking(false);
    }

    await inviteUser.mutateAsync({ email: email.trim(), role });
    setEmail("");
    setRole("user");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Gebruiker Uitnodigen
          </DialogTitle>
          <DialogDescription>
            Stuur een uitnodiging naar een nieuwe gebruiker
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-mailadres</Label>
            <Input
              id="email"
              type="email"
              placeholder="naam@organisatie.nl"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Initiële Rol</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">Gebruiker</SelectItem>
                <SelectItem value="manager">Team Manager</SelectItem>
                <SelectItem value="org_admin">AI Verantwoordelijke</SelectItem>
              </SelectContent>
            </Select>
            {role === 'org_admin' && (
              <p className="text-xs text-muted-foreground">
                Beheert de AI tool catalogus, ziet rijbewijsstatus van medewerkers en exporteert compliance rapporten. Maximaal 2 per organisatie.
              </p>
            )}
          </div>

          <div className="p-3 bg-muted rounded-lg text-sm text-muted-foreground">
            <p>De gebruiker ontvangt een e-mail met instructies om een account aan te maken.</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuleren
          </Button>
          <Button onClick={handleInvite} disabled={!email.trim() || inviteUser.isPending || checking}>
            {(inviteUser.isPending || checking) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Uitnodigen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
