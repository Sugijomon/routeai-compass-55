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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Loader2 } from "lucide-react";
import type { ToolLibraryItem, CreateToolInput } from "@/hooks/useToolsLibrary";

const toolFormSchema = z.object({
  name: z.string().min(1, "Naam is verplicht").max(100),
  vendor: z.string().min(1, "Vendor is verplicht").max(100),
  description: z.string().max(1000).optional(),
  category: z.string().optional(),
  model_type: z.string().optional(),
  gpai_status: z.boolean().default(false),
  api_available: z.boolean().default(false),
  contract_required: z.boolean().default(false),
  hosting_location: z.string().max(100).optional(),
  data_residency: z.string().max(100).optional(),
  capabilities: z.array(z.string()).default([]),
  status: z.enum(["draft", "published", "deprecated"]).default("draft"),
  vendor_website_url: z.string().url().optional().or(z.literal("")),
  vendor_terms_url: z.string().url().optional().or(z.literal("")),
  vendor_privacy_policy_url: z.string().url().optional().or(z.literal("")),
});

type ToolFormValues = z.infer<typeof toolFormSchema>;

const CATEGORIES = [
  { value: "llm", label: "Large Language Model (LLM)" },
  { value: "image_gen", label: "Image Generation" },
  { value: "code_assistant", label: "Code Assistant" },
  { value: "audio", label: "Audio/Speech" },
  { value: "video", label: "Video Generation" },
  { value: "data_analysis", label: "Data Analysis" },
  { value: "translation", label: "Translation" },
  { value: "productivity", label: "Productivity" },
  { value: "other", label: "Other" },
];

const MODEL_TYPES = [
  { value: "chat", label: "Chat/Conversational" },
  { value: "completion", label: "Text Completion" },
  { value: "embedding", label: "Embeddings" },
  { value: "image", label: "Image Model" },
  { value: "multimodal", label: "Multimodal" },
  { value: "specialized", label: "Specialized" },
];

const COMMON_CAPABILITIES = [
  "text-generation",
  "code-generation",
  "image-generation",
  "translation",
  "summarization",
  "data-analysis",
  "document-processing",
  "speech-to-text",
  "text-to-speech",
];

interface ToolFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tool?: ToolLibraryItem | null;
  onSubmit: (data: CreateToolInput) => void;
  isLoading?: boolean;
}

export function ToolFormDialog({
  open,
  onOpenChange,
  tool,
  onSubmit,
  isLoading,
}: ToolFormDialogProps) {
  const [newCapability, setNewCapability] = React.useState("");
  
  const form = useForm<ToolFormValues>({
    resolver: zodResolver(toolFormSchema),
    defaultValues: {
      name: "",
      vendor: "",
      description: "",
      category: "",
      model_type: "",
      gpai_status: false,
      api_available: false,
      contract_required: false,
      hosting_location: "",
      data_residency: "",
      capabilities: [],
      status: "draft",
      vendor_website_url: "",
      vendor_terms_url: "",
      vendor_privacy_policy_url: "",
    },
  });

  React.useEffect(() => {
    if (tool) {
      form.reset({
        name: tool.name,
        vendor: tool.vendor,
        description: tool.description || "",
        category: tool.category || "",
        model_type: tool.model_type || "",
        gpai_status: tool.gpai_status || false,
        api_available: tool.api_available || false,
        contract_required: tool.contract_required || false,
        hosting_location: tool.hosting_location || "",
        data_residency: tool.data_residency || "",
        capabilities: tool.capabilities || [],
        status: (tool.status as "draft" | "published" | "deprecated") || "draft",
        vendor_website_url: tool.vendor_website_url || "",
        vendor_terms_url: tool.vendor_terms_url || "",
        vendor_privacy_policy_url: tool.vendor_privacy_policy_url || "",
      });
    } else {
      form.reset({
        name: "",
        vendor: "",
        description: "",
        category: "",
        model_type: "",
        gpai_status: false,
        api_available: false,
        contract_required: false,
        hosting_location: "",
        data_residency: "",
        capabilities: [],
        status: "draft",
        vendor_website_url: "",
        vendor_terms_url: "",
        vendor_privacy_policy_url: "",
      });
    }
  }, [tool, form, open]);

  const handleSubmit = (values: ToolFormValues) => {
    onSubmit({
      name: values.name,
      vendor: values.vendor,
      description: values.description || undefined,
      category: values.category || undefined,
      model_type: values.model_type || undefined,
      gpai_status: values.gpai_status,
      api_available: values.api_available,
      contract_required: values.contract_required,
      capabilities: values.capabilities,
      status: values.status,
      hosting_location: values.hosting_location || undefined,
      data_residency: values.data_residency || undefined,
      vendor_website_url: values.vendor_website_url || undefined,
      vendor_terms_url: values.vendor_terms_url || undefined,
      vendor_privacy_policy_url: values.vendor_privacy_policy_url || undefined,
    });
  };

  const addCapability = (cap: string) => {
    const current = form.getValues("capabilities");
    if (cap && !current.includes(cap)) {
      form.setValue("capabilities", [...current, cap]);
    }
    setNewCapability("");
  };

  const removeCapability = (cap: string) => {
    const current = form.getValues("capabilities");
    form.setValue("capabilities", current.filter((c) => c !== cap));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {tool ? "Tool Bewerken" : "Nieuwe Tool Toevoegen"}
          </DialogTitle>
          <DialogDescription>
            {tool
              ? "Wijzig de eigenschappen van deze tool in de bibliotheek."
              : "Voeg een nieuwe AI tool toe aan de platform bibliotheek."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Naam *</FormLabel>
                    <FormControl>
                      <Input placeholder="GPT-4o" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="vendor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vendor *</FormLabel>
                    <FormControl>
                      <Input placeholder="OpenAI" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Beschrijving</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Beschrijf de tool en de mogelijkheden..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Category & Type */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categorie</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecteer categorie" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
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
                name="model_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Model Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecteer type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {MODEL_TYPES.map((type) => (
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
            </div>

            {/* Hosting & Data */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="hosting_location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hosting Locatie</FormLabel>
                    <FormControl>
                      <Input placeholder="EU, US, Global" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="data_residency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data Residency</FormLabel>
                    <FormControl>
                      <Input placeholder="EU-only, US, Global" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Flags */}
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="gpai_status"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>GPAI Status</FormLabel>
                      <FormDescription className="text-xs">
                        General Purpose AI
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="api_available"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>API Beschikbaar</FormLabel>
                      <FormDescription className="text-xs">
                        Via API integreerbaar
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contract_required"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Contract Vereist</FormLabel>
                      <FormDescription className="text-xs">
                        Enterprise contract
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            {/* Capabilities */}
            <FormField
              control={form.control}
              name="capabilities"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Capabilities</FormLabel>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {field.value.map((cap) => (
                      <Badge key={cap} variant="secondary" className="gap-1">
                        {cap}
                        <button
                          type="button"
                          onClick={() => removeCapability(cap)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Nieuwe capability..."
                      value={newCapability}
                      onChange={(e) => setNewCapability(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addCapability(newCapability);
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => addCapability(newCapability)}
                    >
                      Toevoegen
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {COMMON_CAPABILITIES.filter(
                      (c) => !field.value.includes(c)
                    ).map((cap) => (
                      <Badge
                        key={cap}
                        variant="outline"
                        className="cursor-pointer hover:bg-muted"
                        onClick={() => addCapability(cap)}
                      >
                        + {cap}
                      </Badge>
                    ))}
                  </div>
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
                    Alleen gepubliceerde tools zijn zichtbaar voor organisaties.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Vendor URLs */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Vendor Links (optioneel)</h4>
              <div className="grid grid-cols-1 gap-4">
                <FormField
                  control={form.control}
                  name="vendor_website_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="vendor_terms_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Terms of Service URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="vendor_privacy_policy_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Privacy Policy URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

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
                {tool ? "Opslaan" : "Toevoegen"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
