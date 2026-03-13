import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { OrgUser, useUpdateUserRoles } from "@/hooks/useOrgUsers";

interface EditRolesDialogProps {
  user: OrgUser | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AVAILABLE_ROLES = [
  { id: 'org_admin', label: 'AI Verantwoordelijke', description: 'Beheert de AI tool catalogus, ziet rijbewijsstatus van medewerkers en exporteert compliance rapporten. Maximaal 2 per organisatie.' },
  { id: 'manager', label: 'Team Manager', description: 'Teambeheer en rapportages' },
  { id: 'user', label: 'Gebruiker', description: 'Standaard toegang' },
];

export default function EditRolesDialog({ user, open, onOpenChange }: EditRolesDialogProps) {
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const updateRoles = useUpdateUserRoles();

  useEffect(() => {
    if (user) {
      // Filter out super_admin and content_editor as these are platform-level
      setSelectedRoles(user.roles.filter(r => 
        ['org_admin', 'manager', 'user'].includes(r)
      ));
    }
  }, [user]);

  const handleRoleToggle = (roleId: string) => {
    setSelectedRoles(prev => {
      if (prev.includes(roleId)) {
        // Don't allow removing all roles - keep at least 'user'
        if (prev.length === 1) return prev;
        return prev.filter(r => r !== roleId);
      }
      return [...prev, roleId];
    });
  };

  const handleSave = async () => {
    if (!user) return;
    
    await updateRoles.mutateAsync({
      userId: user.id,
      roles: selectedRoles.length > 0 ? selectedRoles : ['user'],
    });
    
    onOpenChange(false);
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rollen Bewerken</DialogTitle>
          <DialogDescription>
            Wijzig de rollen voor {user.full_name || user.email}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {AVAILABLE_ROLES.map((role) => (
            <div key={role.id} className="flex items-start space-x-3">
              <Checkbox
                id={role.id}
                checked={selectedRoles.includes(role.id)}
                onCheckedChange={() => handleRoleToggle(role.id)}
              />
              <div className="grid gap-0.5">
                <Label htmlFor={role.id} className="font-medium cursor-pointer">
                  {role.label}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {role.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuleren
          </Button>
          <Button onClick={handleSave} disabled={updateRoles.isPending}>
            {updateRoles.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Opslaan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
