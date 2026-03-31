import React, { useState, useCallback, useRef, useEffect } from "react";
import * as XLSX from "xlsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Upload,
  FileSpreadsheet,
  Download,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { useUserProfile } from "@/hooks/useUserProfile";
import { supabase } from "@/integrations/supabase/client";
import InviteEmailTemplateEditor, {
  type InviteEmailTemplate,
} from "./InviteEmailTemplateEditor";

interface BulkImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ImportRow {
  voornaam: string;
  achternaam: string;
  email: string;
  afdeling: string;
  rol: string;
  error?: string;
}

interface ImportResult {
  email: string;
  success: boolean;
  error?: string;
}

const MAX_ROWS = 250;

function normalizeRole(raw: string): string {
  const lower = (raw || "").toLowerCase().trim();
  if (["manager", "team manager"].includes(lower)) return "manager";
  if (["org_admin", "ai verantwoordelijke", "admin"].includes(lower)) return "org_admin";
  return "user";
}

function generateTemplateFile() {
  const wb = XLSX.utils.book_new();
  const data = [
    ["voornaam", "achternaam", "email", "afdeling", "rol"],
    ["Jan", "de Vries", "jan@voorbeeld.nl", "IT", "user"],
    ["Maria", "Jansen", "maria@voorbeeld.nl", "HR", "manager"],
  ];
  const ws = XLSX.utils.aoa_to_sheet(data);
  ws["!cols"] = [{ wch: 15 }, { wch: 15 }, { wch: 25 }, { wch: 15 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(wb, ws, "Medewerkers");
  XLSX.writeFile(wb, "medewerkers_sjabloon.xlsx");
}

export default function BulkImportDialog({ open, onOpenChange }: BulkImportDialogProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<ImportResult[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [emailTemplate, setEmailTemplate] = useState<InviteEmailTemplate | null>(null);
  const { profile } = useUserProfile();

  const validRows = rows.filter((r) => !r.error);
  const errorRows = rows.filter((r) => !!r.error);

  const reset = () => {
    setStep(1);
    setRows([]);
    setProgress(0);
    setResults([]);
    setImporting(false);
  };

  const handleClose = (val: boolean) => {
    if (!val) reset();
    onOpenChange(val);
  };

  // Validate org_admin limit when rows change to step 2
  useEffect(() => {
    if (step !== 2 || rows.length === 0 || !profile?.org_id) return;

    const orgAdminImportCount = rows.filter((r) => !r.error && r.rol === "org_admin").length;
    if (orgAdminImportCount === 0) return;

    const checkLimit = async () => {
      const { count, error } = await supabase
        .from("user_roles")
        .select("id", { count: "exact", head: true })
        .eq("org_id", profile.org_id)
        .eq("role", "org_admin");

      if (error) return;

      const currentAdmins = count ?? 0;
      const slotsAvailable = Math.max(0, 2 - currentAdmins);

      if (orgAdminImportCount > slotsAvailable) {
        // Mark excess org_admin rows with error
        let adminsSeen = 0;
        setRows((prev) =>
          prev.map((row) => {
            if (row.error || row.rol !== "org_admin") return row;
            adminsSeen++;
            if (adminsSeen > slotsAvailable) {
              return {
                ...row,
                error: "Limiet: max. 2 AI Verantwoordelijken per organisatie",
              };
            }
            return row;
          })
        );
      }
    };

    checkLimit();
  }, [step, rows.length, profile?.org_id]);

  const parseFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: "" });

        if (json.length > MAX_ROWS) {
          setRows([
            {
              voornaam: "",
              achternaam: "",
              email: "",
              afdeling: "",
              rol: "user",
              error: `Bestand bevat ${json.length} rijen. Maximaal ${MAX_ROWS} toegestaan.`,
            },
          ]);
          setStep(2);
          return;
        }

        const parsed: ImportRow[] = json.map((row) => {
          const voornaam = (row.voornaam || row.Voornaam || "").trim();
          const achternaam = (row.achternaam || row.Achternaam || "").trim();
          const email = (row.email || row.Email || row["e-mail"] || row["E-mail"] || "").trim();
          const afdeling = (row.afdeling || row.Afdeling || row.department || "").trim();
          const rolRaw = (row.rol || row.Rol || row.role || "").trim();
          const rol = normalizeRole(rolRaw);

          let error: string | undefined;
          if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            error = "Ongeldig of ontbrekend e-mailadres";
          }

          return { voornaam, achternaam, email, afdeling, rol, error };
        });

        setRows(parsed);
        setStep(2);
      } catch {
        setRows([
          {
            voornaam: "",
            achternaam: "",
            email: "",
            afdeling: "",
            rol: "user",
            error: "Bestand kon niet worden gelezen. Controleer het formaat.",
          },
        ]);
        setStep(2);
      }
    };
    reader.readAsArrayBuffer(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) parseFile(file);
    },
    [parseFile]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) parseFile(file);
  };

  const handleImport = async () => {
    setImporting(true);
    setStep(3);
    const importResults: ImportResult[] = [];

    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i];
      try {
        await inviteUser.mutateAsync({
          email: row.email,
          role: row.rol,
        });
        importResults.push({ email: row.email, success: true });
      } catch (err: any) {
        importResults.push({
          email: row.email,
          success: false,
          error: err?.message || "Onbekende fout",
        });
      }
      setProgress(Math.round(((i + 1) / validRows.length) * 100));
      setResults([...importResults]);
    }

    setImporting(false);
  };

  const successCount = results.filter((r) => r.success).length;
  const failCount = results.filter((r) => !r.success).length;

  const ROLE_LABELS: Record<string, string> = {
    user: "Gebruiker",
    manager: "Team Manager",
    org_admin: "AI Verantwoordelijke",
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Medewerkers importeren
          </DialogTitle>
          <DialogDescription>
            {step === 1 && "Upload een Excel of CSV bestand met medewerkergegevens."}
            {step === 2 && "Controleer de geïmporteerde gegevens voordat u doorgaat."}
            {step === 3 && (importing ? "Bezig met importeren…" : "Import voltooid.")}
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Upload */}
        {step === 1 && (
          <div className="space-y-4 py-4">
            <div
              className={`border-2 border-dashed rounded-lg p-10 text-center transition-colors cursor-pointer ${
                dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25"
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="font-medium text-foreground">
                Sleep een bestand hierheen of klik om te uploaden
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                .xlsx of .csv — maximaal {MAX_ROWS} rijen
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            <Button variant="link" size="sm" onClick={generateTemplateFile} className="gap-1.5">
              <Download className="h-4 w-4" />
              Download voorbeeldsjabloon
            </Button>
          </div>
        )}

        {/* Step 2: Preview */}
        {step === 2 && (
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-3 text-sm">
              <Badge variant="secondary">
                {validRows.length} medewerkers gevonden
              </Badge>
              {errorRows.length > 0 && (
                <Badge variant="destructive">
                  {errorRows.length} met fouten
                </Badge>
              )}
            </div>

            {rows.length === 1 && rows[0].error && !rows[0].email ? (
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">{rows[0].error}</p>
              </div>
            ) : (
              <div className="rounded-md border max-h-72 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Naam</TableHead>
                      <TableHead>E-mail</TableHead>
                      <TableHead>Afdeling</TableHead>
                      <TableHead>Rol</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row, i) => (
                      <TableRow
                        key={i}
                        className={row.error ? "bg-destructive/5" : ""}
                      >
                        <TableCell className={row.error ? "text-destructive" : ""}>
                          {[row.voornaam, row.achternaam].filter(Boolean).join(" ") || "—"}
                        </TableCell>
                        <TableCell>
                          {row.error ? (
                            <span className="flex items-center gap-1 text-destructive text-sm">
                              <AlertCircle className="h-3.5 w-3.5" />
                              {row.error}
                            </span>
                          ) : (
                            row.email
                          )}
                        </TableCell>
                        <TableCell>{row.afdeling || "—"}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {ROLE_LABELS[row.rol] || row.rol}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={reset}>
                Terug
              </Button>
              <Button
                onClick={handleImport}
                disabled={validRows.length === 0}
              >
                Importeer {validRows.length} medewerker{validRows.length !== 1 ? "s" : ""}
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* Step 3: Progress & Results */}
        {step === 3 && (
          <div className="space-y-4 py-4">
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-muted-foreground text-center">
              {importing
                ? `${results.length} van ${validRows.length} verwerkt…`
                : `Import voltooid: ${successCount} geslaagd, ${failCount} mislukt`}
            </p>

            {!importing && results.length > 0 && (
              <div className="rounded-md border max-h-60 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>E-mail</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.map((r, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-sm">{r.email}</TableCell>
                        <TableCell>
                          {r.success ? (
                            <span className="flex items-center gap-1 text-green-600 text-sm">
                              <CheckCircle2 className="h-4 w-4" />
                              Uitgenodigd
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-destructive text-sm">
                              <XCircle className="h-4 w-4" />
                              {r.error || "Mislukt"}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {!importing && (
              <DialogFooter>
                <Button onClick={() => handleClose(false)}>Sluiten</Button>
              </DialogFooter>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
