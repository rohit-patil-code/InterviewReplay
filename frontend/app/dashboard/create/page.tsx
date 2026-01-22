"use client";

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
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Building2,
    BarChart3,
    Save,
    Wand2,
    FileText,
    Code2
} from "lucide-react";

export default function CreateProblemPage() {
    return (
        <div className="h-[calc(100vh-8rem)] min-h-[600px] w-full">
            <ResizablePanelGroup
                direction="horizontal"
                className="h-full w-full rounded-xl border border-border/50 bg-card shadow-sm overflow-hidden"
            >

                {/* LEFT PANEL: Configuration & Input */}
                <ResizablePanel defaultSize={40} minSize={30} maxSize={50} className="flex flex-col">
                    <ScrollArea className="flex-1 h-full">
                        <div className="p-6 space-y-8">

                            {/* Header */}
                            <div>
                                <h2 className="text-xl font-semibold tracking-tight">Define Problem</h2>
                                <p className="text-sm text-muted-foreground">
                                    Provide the context to help the AI reconstruction.
                                </p>
                            </div>

                            {/* Section 1: Metadata */}
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="title">Problem Title / Guess</Label>
                                    <Input
                                        id="title"
                                        placeholder="e.g. 'Sliding Window Optimization' or 'Q2 Array Variation'"
                                        className="bg-background/50"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="company">Company</Label>
                                        <Select>
                                            <SelectTrigger id="company" className="bg-background/50">
                                                <div className="flex items-center gap-2 text-muted-foreground">
                                                    <Building2 className="h-4 w-4" />
                                                    <SelectValue placeholder="Select..." />
                                                </div>
                                            </SelectTrigger>
                                            <SelectContent>
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
                                        <Label htmlFor="difficulty">Difficulty</Label>
                                        <Select>
                                            <SelectTrigger id="difficulty" className="bg-background/50">
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
                            <div className="space-y-3 flex-1 flex flex-col min-h-[300px]">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="description" className="text-base">Problem Fragments / Description</Label>
                                    <Badge variant="outline" className="text-xs font-normal text-muted-foreground">
                                        Markdown supported
                                    </Badge>
                                </div>
                                <Textarea
                                    id="description"
                                    placeholder="Paste your messy memory here... 
                  
e.g., 'Given an array A, find the max sum of a subarray... constraints were N=10^5.
I think I tried a prefix sum but it timed out.
Example input was [1, -2, 3] -> 4.
The output should be modulo 10^9 + 7.'"
                                    className="flex-1 min-h-[300px] resize-none p-4 font-mono text-sm leading-relaxed bg-background/50"
                                />
                            </div>

                        </div>
                    </ScrollArea>

                    {/* Footer Action */}
                    <div className="p-4 border-t bg-muted/20">
                        <Button size="lg" className="w-full font-semibold shadow-md">
                            <Wand2 className="mr-2 h-4 w-4" />
                            Generate Draft
                        </Button>
                    </div>
                </ResizablePanel>

                <ResizableHandle withHandle />

                {/* RIGHT PANEL: Live Preview */}
                <ResizablePanel defaultSize={60} className="flex flex-col bg-muted/10">
                    {/* Preview Header */}
                    <div className="h-14 border-b flex items-center justify-between px-6 bg-background/50 backdrop-blur-sm">
                        <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium text-muted-foreground">Live Preview</span>
                        </div>
                        <Button variant="secondary" size="sm" disabled className="gap-2">
                            <Save className="h-4 w-4" />
                            Save to Dashboard
                        </Button>
                    </div>

                    {/* Preview Content (Skeleton) */}
                    <ScrollArea className="flex-1 p-6 md:p-10">
                        <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-700">

                            {/* Title Skeleton */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <Skeleton className="h-6 w-20 rounded-full" /> {/* Difficulty Badge */}
                                    <Skeleton className="h-6 w-24 rounded-full" /> {/* Company Badge */}
                                </div>
                                <Skeleton className="h-10 w-3/4" /> {/* H1 Title */}
                            </div>

                            {/* Stats/Info Row */}
                            <div className="flex gap-8 py-4 border-y border-border/50">
                                <div className="space-y-2">
                                    <Skeleton className="h-3 w-16" />
                                    <Skeleton className="h-4 w-24" />
                                </div>
                                <div className="space-y-2">
                                    <Skeleton className="h-3 w-16" />
                                    <Skeleton className="h-4 w-24" />
                                </div>
                                <div className="space-y-2">
                                    <Skeleton className="h-3 w-16" />
                                    <Skeleton className="h-4 w-24" />
                                </div>
                            </div>

                            {/* Description Text */}
                            <div className="space-y-3">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-[90%]" />
                                <Skeleton className="h-4 w-[95%]" />
                                <Skeleton className="h-4 w-4/5" />
                            </div>

                            {/* Examples */}
                            <div className="space-y-4 pt-4">
                                <Skeleton className="h-6 w-32" /> {/* Example 1 Header */}
                                <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
                                    <div className="space-y-2">
                                        <Skeleton className="h-3 w-12" /> {/* Input label */}
                                        <Skeleton className="h-4 w-full font-mono bg-background/50" />
                                    </div>
                                    <div className="space-y-2">
                                        <Skeleton className="h-3 w-12" /> {/* Output label */}
                                        <Skeleton className="h-4 w-12 font-mono bg-background/50" />
                                    </div>
                                </div>
                            </div>

                            {/* Constraints */}
                            <div className="space-y-3 pt-2">
                                <Skeleton className="h-5 w-24" />
                                <ul className="space-y-2">
                                    <Skeleton className="h-2 w-48" />
                                    <Skeleton className="h-2 w-56" />
                                    <Skeleton className="h-2 w-40" />
                                </ul>
                            </div>

                        </div>
                    </ScrollArea>
                </ResizablePanel>

            </ResizablePanelGroup>
        </div>
    );
}
