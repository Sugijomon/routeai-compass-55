import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Loader2 } from "lucide-react";
import type { LearningLibraryItem, CreateLearningInput } from "@/hooks/useLearningLibrary";

const learningFormSchema = z.object({
  title: z.string().min(1, "Titel is verplicht").max(200),
  description: z.string().max(2000).optional(),
  content_type: z.enum(["course", "module", "assessment", "document"]),
  difficulty_level: z.enum(["basic", "intermediate", "advanced"]).default("basic"),
  status: z.enum(["draft", "published", "deprecated"]).default("draft"),
  version: z.string().max(20).optional(),
  estimated_duration_minutes: z.number().min(0).max(9999).optional(),
  learning_objectives: z.array(z.string()).default([]),
  required_for_license: z.array(z.string()).default([]),
  content_body: z.string().optional(),
});

type LearningFormValues = z.infer<typeof learningFormSchema>;

const CONTENT_TYPES = [
  { value: "course", label: "Course" },
  { value: "module", label: "Module" },
  { value: "assessment", label: "Assessment" },
  { value: "document", label: "Document" },
];

const DIFFICULTY_LEVELS = [
  { value: "basic", label: "Basis" },
  { value: "intermediate", label: "Gevorderd" },
  { value: "advanced", label: "Expert" },
];

const LICENSE_OPTIONS = [
  { value: "ai_rijbewijs", label: "AI Rijbewijs (Green)" },
  { value: "yellow_license", label: "Yellow License" },
  { value: "blue_license", label: "Blue License" },
];

interface LearningFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: LearningLibraryItem | null;
  onSubmit: (data: CreateLearningInput) => void;
  isLoading?: boolean;
}

export function LearningFormDialog({
  open,
  onOpenChange,
  item,
  onSubmit,
  isLoading,
}: LearningFormDialogProps) {
  const [newObjective, setNewObjective] = React.useState("");

  const form = useForm<LearningFormValues>({
    resolver: zodResolver(learningFormSchema),
    defaultValues: {
      title: "",
      description: "",
      content_type: "course",
      difficulty_level: "basic",
      status: "draft",
      version: "1.0",
      estimated_duration_minutes: undefined,
      learning_objectives: [],
      required_for_license: [],
      content_body: "",
    },
  });

  React.useEffect(() => {
    if (item) {
      form.reset({
        title: item.title,
        description: item.description || "",
        content_type: item.content_type,
        difficulty_level: item.difficulty_level || "basic",
        status: item.status,
        version: item.version || "1.0",
        estimated_duration_minutes: item.estimated_duration_minutes || undefined,
        learning_objectives: item.learning_objectives || [],
        required_for_license: item.required_for_license || [],
        content_body: (item.content as { body?: string })?.body || "",
      });
    } else {
      form.reset({
        title: "",
        description: "",
        content_type: "course",
        difficulty_level: "basic",
        status: "draft",
        version: "1.0",
        estimated_duration_minutes: undefined,
        learning_objectives: [],
        required_for_license: [],
        content_body: "",
      });
    }
  }, [item, form, open]);

  const handleSubmit = (values: LearningFormValues) => {
    onSubmit({
      title: values.title,
      description: values.description || undefined,
      content_type: values.content_type,
      difficulty_level: values.difficulty_level,
      status: values.status,
      version: values.version || "1.0",
      estimated_duration_minutes: values.estimated_duration_minutes,
      learning_objectives: values.learning_objectives,
      required_for_license: values.required_for_license,
      content: values.content_body ? { body: values.content_body } as Record<string, string> : undefined,
    });
  };

  const addObjective = (objective: string) => {
    const current = form.getValues("learning_objectives");
    if (objective && !current.includes(objective)) {
      form.setValue("learning_objectives", [...current, objective]);
    }
    setNewObjective("");
  };

  const removeObjective = (objective: string) => {
    const current = form.getValues("learning_objectives");
    form.setValue("learning_objectives", current.filter((o) => o !== objective));
  };

  const toggleLicense = (license: string) => {
    const current = form.getValues("required_for_license");
    if (current.includes(license)) {
      form.setValue("required_for_license", current.filter((l) => l !== license));
    } else {
      form.setValue("required_for_license", [...current, license]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {item ? "Content Bewerken" : "Nieuwe Content Toevoegen"}
          </DialogTitle>
          <DialogDescription>
            {item
              ? "Wijzig de eigenschappen van deze content in de bibliotheek."
              : "Voeg nieuwe leerinhoud toe aan de platform bibliotheek."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Titel *</FormLabel>
                  <FormControl>
                    <Input placeholder="AI Rijbewijs Basis Training" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Beschrijving</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Beschrijf de inhoud en leerdoelen..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Type & Difficulty */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="content_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content Type *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecteer type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CONTENT_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="difficulty_level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Moeilijkheidsgraad</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecteer niveau" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {DIFFICULTY_LEVELS.map((level) => (
                          <SelectItem key={level.value} value={level.value}>
                            {level.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Version & Duration */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="version"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Versie</FormLabel>
                    <FormControl>
                      <Input placeholder="1.0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="estimated_duration_minutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Geschatte Duur (minuten)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="30"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Learning Objectives */}
            <FormField
              control={form.control}
              name="learning_objectives"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Leerdoelen</FormLabel>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {field.value.map((objective, idx) => (
                      <Badge key={idx} variant="secondary" className="gap-1">
                        {objective}
                        <button
                          type="button"
                          onClick={() => removeObjective(objective)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Nieuw leerdoel..."
                      value={newObjective}
                      onChange={(e) => setNewObjective(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addObjective(newObjective);
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => addObjective(newObjective)}
                    >
                      Toevoegen
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Required for License */}
            <FormField
              control={form.control}
              name="required_for_license"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vereist voor Licentie</FormLabel>
                  <FormDescription>
                    Selecteer welke licenties deze content vereisen.
                  </FormDescription>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {LICENSE_OPTIONS.map((license) => (
                      <Badge
                        key={license.value}
                        variant={field.value.includes(license.value) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleLicense(license.value)}
                      >
                        {field.value.includes(license.value) ? "✓ " : ""}
                        {license.label}
                      </Badge>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Content Body */}
            <FormField
              control={form.control}
              name="content_body"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content (Markdown)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="# Introductie&#10;&#10;Schrijf hier de content in Markdown format..."
                      className="resize-none font-mono text-sm"
                      rows={8}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Gebruik Markdown voor opmaak (headers, lijsten, links, etc.)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Status */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecteer status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="deprecated">Deprecated</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Alleen gepubliceerde content is zichtbaar voor organisaties.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Annuleren
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {item ? "Opslaan" : "Toevoegen"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
