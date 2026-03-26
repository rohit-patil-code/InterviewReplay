"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { authApi } from "@/lib/api";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

import { LANGUAGES } from "@/components/practice/constants";
import { PracticeHeader } from "@/components/practice/PracticeHeader";
import { ProblemDescription } from "@/components/practice/ProblemDescription";
import { CodeEditorPanel } from "@/components/practice/CodeEditorPanel";
import { TestCasesPanel } from "@/components/practice/TestCasesPanel";

interface Problem {
    id: string;
    title: string;
    company: string;
    difficulty: "Easy" | "Medium" | "Hard";
    original_input: string;
    ai_output: any; // Contains description, JSON structure
    created_at: string;
    starter_code?: Record<string, string>;
}



export default function PracticePage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const [problem, setProblem] = useState<Problem | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [language, setLanguage] = useState(LANGUAGES[0]);
    const [code, setCode] = useState(LANGUAGES[0].defaultCode);

    const [isExecuting, setIsExecuting] = useState(false);
    const [executionResults, setExecutionResults] = useState<any>(null);

    const getStarterCodeFromProblem = (problem: Problem | null, langId: string) => {
        if (!problem?.starter_code) return null;
        const starterCode = problem.starter_code;
        // Case-insensitive lookup (matching 'python' with 'Python', 'cpp' with 'C++', etc.)
        const matchedKey = Object.keys(starterCode).find(
            key => key.toLowerCase() === langId.toLowerCase() || 
                   (langId === 'cpp' && key === 'C++') ||
                   (langId === 'python' && key === 'Python') ||
                   (langId === 'java' && key === 'Java')
        );
        return matchedKey ? starterCode[matchedKey] : null;
    };

    useEffect(() => {
        const fetchProblem = async () => {
            try {
                const res = await authApi.getProblem(id);
                const fetchedProblem = res.data.problem;
                setProblem(fetchedProblem);

                // Initialize component state leveraging explicit browser storage preferences
                const savedLangId = localStorage.getItem('preferredEditorLanguage');
                const initialLang = LANGUAGES.find(l => l.id === savedLangId) || LANGUAGES[0];
                setLanguage(initialLang);


                // Priority 1: Inject isolated code draft actively sitting natively in localStorage
                // Priority 2: Inject AI generic starter code mappings from DB
                // Priority 3: Fallback on default class templates
                const cachedCode = localStorage.getItem(`problem-draft-${fetchedProblem.id}-${initialLang.id}`);
                const dbStarterCode = getStarterCodeFromProblem(fetchedProblem, initialLang.id);

                if (cachedCode) {
                    setCode(cachedCode);
                } else if (dbStarterCode) {
                    setCode(dbStarterCode);
                } else {
                    setCode(initialLang.defaultCode);
                }
            } catch (err: any) {
                console.error("Failed to fetch problem", err);
                setError(err.response?.data?.error || "Failed to load problem");
            } finally {
                setIsLoading(false);
            }
        };

        if (id) {
            fetchProblem();
        }
    }, [id]);

    const handleLanguageChange = (langId: string) => {
        const selected = LANGUAGES.find(l => l.id === langId) || LANGUAGES[0];
        setLanguage(selected);
        localStorage.setItem('preferredEditorLanguage', langId);

        if (problem) {
            const cachedCode = localStorage.getItem(`problem-draft-${problem.id}-${langId}`);
            const dbStarterCode = getStarterCodeFromProblem(problem, langId);

            if (cachedCode) {
                setCode(cachedCode);
            } else if (dbStarterCode) {
                setCode(dbStarterCode);
            } else {
                setCode(selected.defaultCode);
            }
        } else {
            setCode(selected.defaultCode);
        }
    };

    const handleReset = () => {
        if (!problem) return;

        // Discard local modifications restoring original AI/Template baseline cleanly
        localStorage.removeItem(`problem-draft-${problem.id}-${language.id}`);

        const dbStarterCode = getStarterCodeFromProblem(problem, language.id);
        if (dbStarterCode) {
            setCode(dbStarterCode);
        } else {
            setCode(language.defaultCode);
        }
    };

    // Autosave Debounced Workspaces continuously into LocalStorage natively avoiding Backend limits
    useEffect(() => {
        if (!problem || !code) return;
        const autoSaveTimer = setTimeout(() => {
            localStorage.setItem(`problem-draft-${problem.id}-${language.id}`, code);
        }, 800);
        return () => clearTimeout(autoSaveTimer);
    }, [code, language.id, problem]);

    const handleExecute = async (mode: 'run' | 'submit') => {
        setIsExecuting(true);
        setExecutionResults({ mode, pending: true });
        try {
            const res = await authApi.executeCode(id, code, language.id, mode);
            setExecutionResults({ mode, data: res.data });
        } catch (err: any) {
            console.error("Execution failed", err);
            setExecutionResults({ mode, error: err.response?.data?.error || err.message });
        } finally {
            setIsExecuting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (error || !problem) {
        return (
            <div className="flex h-[calc(100vh-4rem)] flex-col items-center justify-center space-y-4">
                <p className="text-red-500 font-medium">{error || "Problem not found"}</p>
                <Button variant="outline" asChild>
                    <Link href="/dashboard"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard</Link>
                </Button>
            </div>
        );
    }

    const aiData = problem.ai_output;

    return (
        <div className="flex flex-col h-[100dvh] lg:h-[calc(100vh-2rem)] my-0 mx-0 lg:my-4 lg:mx-4 border-none lg:border lg:border-border rounded-none lg:rounded-xl shadow-none lg:shadow-2xl overflow-hidden bg-background">
            {/* Header Toolbar */}
            <PracticeHeader
                problem={{ title: problem.title, company: problem.company }}
                isExecuting={isExecuting}
                executionResults={executionResults}
                handleExecute={handleExecute}
            />

            {/* Split Workspace */}
            <div className="flex-1 overflow-hidden p-0 lg:p-2 bg-muted/20 lg:bg-transparent">

                {/* --- DESKTOP VIEW (SPLIT PANE) --- */}
                <div className="hidden lg:block h-full">
                    <ResizablePanelGroup direction="horizontal" className="rounded-lg border bg-card">

                        {/* LEFT PANE: DESCRIPTION */}
                        <ResizablePanel defaultSize={45} minSize={30}>
                            <ScrollArea className="h-full">
                                <ProblemDescription problem={problem} aiData={aiData} />
                            </ScrollArea>
                        </ResizablePanel>

                        <ResizableHandle withHandle className="bg-border hover:bg-primary/50 transition-colors w-2" />

                        {/* RIGHT PANE: EDITOR & TEST CASES */}
                        <ResizablePanel defaultSize={55} minSize={30}>
                            <ResizablePanelGroup direction="vertical">

                                {/* TOP: EDITOR */}
                                <ResizablePanel defaultSize={70} minSize={20}>
                                    <CodeEditorPanel
                                        language={language}
                                        onLanguageChange={handleLanguageChange}
                                        code={code}
                                        setCode={setCode}
                                        handleReset={handleReset}
                                    />
                                </ResizablePanel>

                                <ResizableHandle withHandle className="bg-border hover:bg-primary/50 transition-colors h-2" />

                                {/* BOTTOM: TEST CASES & RESULTS */}
                                <ResizablePanel defaultSize={30} minSize={10}>
                                    <TestCasesPanel
                                        aiData={aiData}
                                        isExecuting={isExecuting}
                                        executionResults={executionResults}
                                    />
                                </ResizablePanel>

                            </ResizablePanelGroup>
                        </ResizablePanel>
                    </ResizablePanelGroup>
                </div>

                {/* --- MOBILE VIEW (NATIVE SCROLL) --- */}
                <div className="flex flex-col lg:hidden h-full overflow-y-auto w-full">
                    {/* Problem Description */}
                    <div className="bg-card w-full shrink-0 border-b">
                        <ProblemDescription problem={problem} aiData={aiData} />
                    </div>

                    {/* Code Editor */}
                    <div className="bg-zinc-950 w-full shrink-0 h-[500px] border-b flex flex-col">
                        <CodeEditorPanel
                            language={language}
                            onLanguageChange={handleLanguageChange}
                            code={code}
                            setCode={setCode}
                            handleReset={handleReset}
                        />
                    </div>

                    {/* Test Cases */}
                    <div className="bg-zinc-950 w-full shrink-0 min-h-[400px] flex flex-col pb-8">
                        <TestCasesPanel
                            aiData={aiData}
                            isExecuting={isExecuting}
                            executionResults={executionResults}
                        />
                    </div>
                </div>

            </div>
        </div>
    );
}


