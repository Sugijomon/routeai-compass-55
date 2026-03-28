import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { usePublishedTypekaarten, useLinkTypekaart } from '@/hooks/useTypekaartLink';
import { Search, Check } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  catalogEntryId: string;
  toolName: string;
  currentTypekaartId: string | null;
}

export function TypekaartLinkDialog({ open, onOpenChange, catalogEntryId, toolName, currentTypekaartId }: Props) {
  const [search, setSearch] = useState('');
  const { data: typekaarten = [] } = usePublishedTypekaarten();
  const { mutate: link, isPending } = useLinkTypekaart();

  const filtered = typekaarten.filter(t =>
    t.display_name.toLowerCase().includes(search.toLowerCase()) ||
    t.provider.toLowerCase().includes(search.toLowerCase())
  );

  const handleLink = (typekaartId: string) => {
    link({ catalogEntryId, typekaartId }, {
      onSuccess: () => onOpenChange(false),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Typekaart koppelen</DialogTitle>
          <DialogDescription>
            Koppel een typekaart aan <strong>{toolName}</strong> in de tool-catalogus.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Zoek typekaart..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
            autoFocus
          />
        </div>

        <div className="max-h-72 overflow-y-auto space-y-2">
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Geen typekaarten gevonden.</p>
          ) : (
            filtered.map(t => (
              <button
                key={t.id}
                onClick={() => handleLink(t.id)}
                disabled={isPending}
                className={`w-full text-left flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border transition-colors hover:bg-muted/50 ${
                  t.id === currentTypekaartId ? 'border-primary bg-primary/5' : 'border-border'
                }`}
              >
                <div>
                  <p className="text-sm font-medium">{t.display_name}</p>
                  <p className="text-xs text-muted-foreground">{t.provider}</p>
                </div>
                <div className="flex items-center gap-2">
                  {t.gpai_designated && (
                    <Badge variant="secondary" className="text-xs">GPAI</Badge>
                  )}
                  {t.id === currentTypekaartId && <Check className="h-4 w-4 text-primary" />}
                </div>
              </button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
