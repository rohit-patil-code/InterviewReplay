"use client";

import { useState, useEffect, Suspense } from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Building2,
  BarChart3,
  Save,
  Wand2,
  FileText,
  Settings2,
  Eye,
} from "lucide-react";
import TextareaAutosize from "react-textarea-autosize";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useRouter, useSearchParams } from "next/navigation";
import { authApi } from "@/lib/api";

function ConfigurationPanel({
  data,
  setData,
  onGenerateSuccess,
  isEditMode,
}: {
  data: any;
  setData: any;
  onGenerateSuccess: (data: any) => void;
  isEditMode?: boolean;
}) {
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerateDraft() {
    setError(null);

    if (!data.description || !data.description.trim()) {
      setError("Please provide a description or memory fragments of the problem.");
      return;
    }

    console.log("Generating Draft...");
    setIsGenerating(true);

    try {
      const result = await fetch("http://localhost:3001/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          memory: data.description,
          difficulty: data.difficulty,
          company: data.company,
        }),
      });

      if (!result.ok) {
        const err = await result.json();
        throw new Error(err.error || "Failed to generate");
      }

      const res = await result.json();

      console.log("AI Result:", res);
      onGenerateSuccess(res);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="flex flex-col h-full relative overflow-hidden">
      {error && (
        <Alert variant="destructive" className="max-w-md mt-4">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <ScrollArea className="flex-1 w-full overflow-hidden">
        <div className="p-6 space-y-8 pb-24">
          {/* Header */}
          <div>
            <h2 className="text-xl font-semibold tracking-tight">
              {isEditMode ? "Edit Problem" : "Define Problem"}
            </h2>
            <p className="text-sm text-muted-foreground">
              Provide context to help the AI reconstruct your memory.
            </p>
          </div>

          {/* Section 1: Metadata */}
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Problem Title / Guess</Label>
              <Input
                id="title"
                value={data.title}
                onChange={(e) => setData({ ...data, title: e.target.value })}
                placeholder="e.g. 'Trapping Rain Water' or 'Q2 Array Challenge'"
                className="bg-background/50"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Company</Label>
                <Select
                  value={data.company}
                  onValueChange={(val) => setData({ ...data, company: val })}
                >
                  <SelectTrigger className="bg-background/50">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Building2 className="h-4 w-4" />
                      <SelectValue placeholder="Select..." />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vegastack">VegaStack</SelectItem>
                    <SelectItem value="google">Google</SelectItem>
                    <SelectItem value="amazon">Amazon</SelectItem>
                    <SelectItem value="meta">Meta</SelectItem>
                    <SelectItem value="microsoft">Microsoft</SelectItem>
                    <SelectItem value="netflix">Netflix</SelectItem>
                    <SelectItem value="other">OA - Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Difficulty</Label>
                <Select
                  value={data.difficulty}
                  onValueChange={(val) => setData({ ...data, difficulty: val })}
                >
                  <SelectTrigger className="bg-background/50">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <BarChart3 className="h-4 w-4" />
                      <SelectValue placeholder="Select..." />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* Section 2: Memory Dump */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="description" className="text-base">
                Problem Fragments
              </Label>
              <Badge
                variant="outline"
                className="text-xs font-normal text-muted-foreground"
              >
                Markdown supported
              </Badge>
            </div>
            <TextareaAutosize
              id="description"
              value={data.description}
              onChange={(e) =>
                setData({ ...data, description: e.target.value })
              }
              placeholder="Paste your messy memory here..."
              minRows={15}
              className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex w-full rounded-md border text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm min-h-[300px] p-4 font-mono leading-relaxed bg-background/50 resize-y"
            />
          </div>
        </div>
      </ScrollArea>

      {/* Sticky Footer */}
      <div className="p-4 border-t bg-background mt-auto z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
        <Button
          size="lg"
          className="w-full font-semibold shadow-md"
          onClick={handleGenerateDraft}
          disabled={isGenerating}
        >
          <Wand2 className="mr-2 h-4 w-4" />
          {isGenerating ? "Generating..." : "Generate Draft"}
        </Button>
      </div>
    </div>
  );
}

// --- Sub-Component: The Preview (Right Side) ---
function PreviewPanel({
  generatedData,
  onSave,
  isSaving,
  isEditMode,
}: {
  generatedData: any;
  onSave: () => void;
  isSaving: boolean;
  isEditMode?: boolean;
}) {
  const cleanText = (value?: string) =>
    (value ?? "")
      .replace(/```/g, "")
      .replace(/`/g, "")
      .replace(/\$/g, "")
      .replace(/^###\s+/gm, "")
      .trim();

  const isLoading = !generatedData;

  if (isLoading) {
    return (
      <div className="flex flex-col h-full bg-muted/10 overflow-hidden">
        <div className="h-14 border-b flex items-center justify-between px-6 bg-background/50 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">
              Live Preview
            </span>
          </div>
          <Button variant="secondary" size="sm" disabled className="gap-2">
            <Save className="h-4 w-4" />
            {isEditMode ? "Update Problem" : "Save to Dashboard"}
          </Button>
        </div>

        <ScrollArea className="flex-1 h-full">
          <div className="p-6 md:p-10 max-w-3xl mx-auto space-y-8 animate-in fade-in duration-700">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-24 rounded-full" />
              </div>
              <Skeleton className="h-10 w-3/4" />
            </div>

            <div className="flex gap-8 py-4 border-y border-border/50">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-[90%]" />
              <Skeleton className="h-4 w-[95%]" />
            </div>

            <div className="space-y-4 pt-4">
              <Skeleton className="h-6 w-32" />
              <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
                <div className="space-y-2">
                  <Skeleton className="h-3 w-12" />
                  <Skeleton className="h-4 w-full bg-background/50" />
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-muted/10 overflow-hidden">
      <div className="h-14 border-b flex items-center justify-between px-6 bg-background/50 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">
            Live Preview
          </span>
        </div>
        <Button
          variant="secondary"
          size="sm"
          className="gap-2"
          onClick={onSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <Wand2 className="h-4 w-4 animate-spin" /> Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" /> {isEditMode ? "Update Problem" : "Save to Dashboard"}
            </>
          )}
        </Button>
      </div>

      <ScrollArea className="flex-1 h-full">
        <div className="p-6 md:p-10 max-w-3xl mx-auto space-y-8">
          {/* Title and Badges */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary">{generatedData.difficulty}</Badge>
              <Badge variant="outline">{generatedData.company}</Badge>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">
              {generatedData.title}
            </h1>
          </div>

          {/* Description */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Description</h2>
            <div className="prose prose-sm dark:prose-invert max-w-none text-foreground leading-relaxed whitespace-pre-wrap">
              {cleanText(generatedData.description)}
            </div>
          </div>

          {/* Examples */}
          {generatedData.examples && generatedData.examples.length > 0 && (
            <div className="space-y-4 pt-4">
              <h2 className="text-lg font-semibold">Examples</h2>
              {generatedData.examples.map((example: any, idx: number) => (
                <div
                  key={idx}
                  className="rounded-lg border bg-muted/50 p-4 space-y-3"
                >
                  <div className="space-y-2">
                    <span className="text-xs font-medium text-muted-foreground uppercase">
                      Example {idx + 1}
                    </span>
                    <div className="bg-background/50 p-3 rounded text-sm font-mono my-2">
                      <div>
                        <strong>Input:</strong> {cleanText(example.input)}
                      </div>
                      <div>
                        <strong>Output:</strong> {cleanText(example.output)}
                      </div>
                    </div>
                    {example.explanation && (
                      <div className="text-sm text-foreground whitespace-pre-wrap">
                        {cleanText(example.explanation)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Constraints */}
          {generatedData.constraints &&
            generatedData.constraints.length > 0 && (
              <div className="flex gap-8 py-4 border-y border-border/50 flex-wrap">
                <div className="space-y-1">
                  <span className="text-xs font-medium text-muted-foreground uppercase">
                    Constraints
                  </span>
                  <div className="space-y-1">
                    {generatedData.constraints.map(
                      (constraint: string, idx: number) => (
                        <div key={idx} className="text-sm text-foreground">
                          {cleanText(constraint)}
                        </div>
                      ),
                    )}
                  </div>
                </div>
              </div>
            )}

          {/* Time Complexity */}
          {generatedData.time_complexity && (
            <div className="space-y-3 pt-4 border-t">
              <h2 className="text-lg font-semibold">Complexity</h2>
              <div className="text-sm">
                <span className="text-muted-foreground">Time: </span>
                <span className="font-mono">
                  {generatedData.time_complexity}
                </span>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

// --- MAIN PAGE COMPONENT ---
function CreateProblemContent() {
  const [formData, setFormData] = useState({
    title: "",
    company: "other",
    difficulty: "medium",
    description: "",
  });

  const [generatedData, setGeneratedData] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const isEditMode = !!editId;

  useEffect(() => {
    if (editId) {
      authApi.getProblem(editId)
        .then((res) => {
          const problem = res.data.problem;
          if (problem.original_input) {
            setFormData(problem.original_input);
          } else {
            setFormData({
              title: problem.title,
              company: problem.company,
              difficulty: problem.difficulty,
              description: "",
            });
          }
          if (problem.ai_output) {
            setGeneratedData(problem.ai_output);
          }
        })
        .catch((err) => console.error("Failed to load problem structure:", err));
    }
  }, [editId]);

  const handleGenerateSuccess = (data: any) => {
    setGeneratedData(data);
  };

  const handleSave = async () => {
    if (!generatedData) return;
    setIsSaving(true);
    try {
      const payload = {
        title: generatedData.title,
        company: generatedData.company || formData.company,
        difficulty: generatedData.difficulty || formData.difficulty,
        original_input: formData,
        ai_output: generatedData,
      };

      if (isEditMode) {
        await authApi.updateProblem(editId, payload);
      } else {
        await authApi.createProblem(payload);
      }
      // Redirect to dashboard or show success
      router.push('/dashboard');
    } catch (error) {
      console.error("Failed to save problem:", error);
      alert("Failed to save problem. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="h-[calc(100dvh-4rem)] w-full overflow-hidden">
      {/* DESKTOP VIEW */}
      <div className="hidden md:block h-full w-full">
        <ResizablePanelGroup
          direction="horizontal"
          className="h-full w-full border-t"
        >
          <ResizablePanel defaultSize={40} minSize={30} maxSize={50}>
            <ConfigurationPanel
              data={formData}
              setData={setFormData}
              onGenerateSuccess={handleGenerateSuccess}
              isEditMode={isEditMode}
            />
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={60}>
            <PreviewPanel
              generatedData={generatedData}
              onSave={handleSave}
              isSaving={isSaving}
              isEditMode={isEditMode}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* MOBILE VIEW */}
      <div className="block md:hidden h-full w-full">
        <Tabs defaultValue="config" className="h-full flex flex-col">
          <div className="border-b px-4 py-2 bg-background">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="config" className="flex items-center gap-2">
                <Settings2 className="h-4 w-4" />
                Configuration
              </TabsTrigger>
              <TabsTrigger value="preview" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Preview Result
              </TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="config" className="flex-1 mt-0 overflow-hidden">
            <ConfigurationPanel
              data={formData}
              setData={setFormData}
              onGenerateSuccess={handleGenerateSuccess}
              isEditMode={isEditMode}
            />
          </TabsContent>
          <TabsContent
            value="preview"
            className="flex-1 mt-0 overflow-hidden bg-muted/10"
          >
            <PreviewPanel
              generatedData={generatedData}
              onSave={handleSave}
              isSaving={isSaving}
              isEditMode={isEditMode}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default function CreateProblemPage() {
  return (
    <Suspense fallback={<div className="flex h-full items-center justify-center p-8 text-muted-foreground">Loading problem details...</div>}>
      <CreateProblemContent />
    </Suspense>
  );
}
