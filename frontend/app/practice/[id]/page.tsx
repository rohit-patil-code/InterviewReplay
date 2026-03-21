"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { authApi } from "@/lib/api";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, ArrowLeft, Play, RefreshCw, Send, TerminalSquare, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Editor from "@monaco-editor/react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

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

const LANGUAGES = [
    { id: "python", name: "Python", defaultCode: "class Solution:\n    def solve(self):\n        pass" },
    { id: "javascript", name: "JavaScript", defaultCode: "/**\n * @return {any}\n */\nvar solve = function() {\n    \n};" },
];

export default function PracticePage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const [problem, setProblem] = useState<Problem | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [language, setLanguage] = useState(LANGUAGES[0]);
    const [code, setCode] = useState(LANGUAGES[0].defaultCode);

    const [activeTestCase, setActiveTestCase] = useState(0);
    const [activeBottomTab, setActiveBottomTab] = useState<"testcase" | "result">("testcase");
    const [isExecuting, setIsExecuting] = useState(false);
    const [executionResults, setExecutionResults] = useState<any>(null);
    const [activeResultTab, setActiveResultTab] = useState<number>(0);

    useEffect(() => {
        const fetchProblem = async () => {
            try {
                const res = await authApi.getProblem(id);
                const fetchedProblem = res.data.problem;
                setProblem(fetchedProblem);

                // Initialize code editor with starter_code if available
                if (fetchedProblem?.starter_code && fetchedProblem.starter_code[language.id]) {
                    setCode(fetchedProblem.starter_code[language.id]);
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

        if (problem?.starter_code && problem.starter_code[langId]) {
            setCode(problem.starter_code[langId]);
        } else {
            setCode(selected.defaultCode);
        }
    };

    const handleReset = () => {
        if (problem?.starter_code && problem.starter_code[language.id]) {
            setCode(problem.starter_code[language.id]);
        } else {
            setCode(language.defaultCode);
        }
    };

    const handleExecute = async (mode: 'run' | 'submit') => {
        setIsExecuting(true);
        setActiveBottomTab("result");
        setExecutionResults({ mode, pending: true });
        try {
            const res = await authApi.executeCode(id, code, language.id, mode);
            setExecutionResults({ mode, data: res.data });
            setActiveResultTab(0);
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
        <div className="flex flex-col h-[calc(100vh-2rem)] my-4 mx-4 border border-border rounded-xl shadow-2xl overflow-hidden bg-background">
            {/* Header Toolbar */}
            <div className="h-14 border-b flex items-center justify-between px-4 shrink-0 bg-card/50 backdrop-blur-sm z-10 w-full relative">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild className="h-8 w-8 rounded-full">
                        <Link href="/dashboard">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div className="font-semibold text-sm flex items-center gap-3">
                        {problem.title}
                        <Badge variant="secondary" className="font-normal border-amber-500/20 text-amber-500/80 bg-amber-500/10 hover:bg-amber-500/20">
                            {problem.company}
                        </Badge>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button 
                        onClick={() => handleExecute('run')}
                        disabled={isExecuting}
                        variant="secondary" 
                        size="sm" 
                        className="h-8 gap-2 bg-green-500/10 text-green-500 hover:bg-green-500/20 hover:text-green-600 border-0"
                    >
                        {isExecuting && executionResults?.mode === 'run' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />} 
                        {isExecuting && executionResults?.mode === 'run' ? 'Running...' : 'Run Code'}
                    </Button>
                    <Button 
                        onClick={() => handleExecute('submit')}
                        disabled={isExecuting}
                        variant="default" 
                        size="sm" 
                        className={`h-8 gap-2 text-white ${isExecuting && executionResults?.mode === 'submit' ? 'bg-green-700' : 'bg-green-600 hover:bg-green-700'}`}
                    >
                        {isExecuting && executionResults?.mode === 'submit' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />} 
                        {isExecuting && executionResults?.mode === 'submit' ? 'Submitting...' : 'Submit'}
                    </Button>
                </div>
            </div>

            {/* Split Workspace */}
            <div className="flex-1 overflow-hidden p-2">
                <ResizablePanelGroup direction="horizontal" className="rounded-lg border bg-card">

                    {/* LEFT PANE: DESCRIPTION */}
                    <ResizablePanel defaultSize={45} minSize={30}>
                        <ScrollArea className="h-full">
                            <div className="p-6">
                                <div className="space-y-4 mb-8">
                                    <h1 className="text-2xl font-bold tracking-tight">{problem.title}</h1>
                                    <div className="flex gap-2">
                                        <Badge variant="outline" className={`font-normal ${problem.difficulty.toLowerCase() === 'easy' ? 'text-green-500 border-green-500/20 bg-green-500/10' : problem.difficulty.toLowerCase() === 'medium' ? 'text-amber-500 border-amber-500/20 bg-amber-500/10' : 'text-red-500 border-red-500/20 bg-red-500/10'}`}>
                                            {problem.difficulty}
                                        </Badge>
                                        <Badge variant="outline" className="text-muted-foreground">{problem.company}</Badge>
                                    </div>
                                </div>

                                {/* Markdown Content */}
                                <div className="prose prose-sm dark:prose-invert max-w-none prose-pre:bg-muted/50 prose-pre:border">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                        {aiData.description || "No description provided."}
                                    </ReactMarkdown>

                                    {/* Additional constraints/examples not caught by generic markdown formatting */}
                                    {aiData.examples && aiData.examples.length > 0 && (
                                        <div className="mt-8 space-y-4">
                                            <h3 className="text-lg font-semibold">Examples</h3>
                                            {aiData.examples.map((ex: any, i: number) => (
                                                <div key={i} className="rounded-md border bg-muted/30 p-4 font-mono text-sm space-y-2">
                                                    <div><span className="font-semibold text-muted-foreground">Input:</span> {ex.input}</div>
                                                    <div><span className="font-semibold text-muted-foreground">Output:</span> {ex.output}</div>
                                                    {ex.explanation && (
                                                        <div className="text-muted-foreground"><span className="font-semibold text-foreground/70">Explanation:</span> {ex.explanation}</div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {aiData.constraints && aiData.constraints.length > 0 && (
                                        <div className="mt-8">
                                            <h3 className="text-lg font-semibold mb-3">Constraints</h3>
                                            <ul className="list-disc pl-6 space-y-1">
                                                {aiData.constraints.map((c: string, i: number) => (
                                                    <li key={i} className="font-mono text-sm">{c}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </ScrollArea>
                    </ResizablePanel>

                    <ResizableHandle withHandle className="bg-border hover:bg-primary/50 transition-colors w-2" />

                    {/* RIGHT PANE: EDITOR & TEST CASES */}
                    <ResizablePanel defaultSize={55} minSize={30}>
                        <ResizablePanelGroup direction="vertical">

                            {/* TOP: EDITOR */}
                            <ResizablePanel defaultSize={70} minSize={20}>
                                <div className="flex flex-col h-full bg-zinc-950">
                                    {/* Editor Toolbar */}
                                    <div className="h-12 border-b border-border/40 flex items-center justify-between px-4 bg-zinc-900 shrink-0">
                                        <div className="flex items-center gap-2">
                                            <Select value={language.id} onValueChange={handleLanguageChange}>
                                                <SelectTrigger className="h-8 w-[140px] bg-zinc-800 border-zinc-700 text-xs text-zinc-200">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {LANGUAGES.map(lang => (
                                                        <SelectItem key={lang.id} value={lang.id} className="text-xs">
                                                            {lang.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-800"
                                            onClick={handleReset}
                                            title="Reset to default code"
                                        >
                                            <RefreshCw className="h-4 w-4" />
                                        </Button>
                                    </div>

                                    {/* Monaco Editor Container */}
                                    <div className="flex-1 w-full pt-4">
                                        <Editor
                                            height="100%"
                                            language={language.id}
                                            theme="vs-dark"
                                            value={code}
                                            onChange={(value) => setCode(value || "")}
                                            options={{
                                                minimap: { enabled: false },
                                                fontSize: 14,
                                                wordWrap: "on",
                                                scrollBeyondLastLine: false,
                                                automaticLayout: true,
                                                padding: { top: 16 },
                                                fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
                                            }}
                                            loading={
                                                <div className="flex h-full items-center justify-center text-muted-foreground text-sm gap-2">
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                    Loading editor...
                                                </div>
                                            }
                                        />
                                    </div>
                                </div>
                            </ResizablePanel>

                            <ResizableHandle withHandle className="bg-border hover:bg-primary/50 transition-colors h-2" />

                            {/* BOTTOM: TEST CASES & RESULTS */}
                            <ResizablePanel defaultSize={30} minSize={10}>
                                <div className="flex flex-col h-full bg-zinc-950 border-t border-border/40">
                                    <div className="h-10 flex border-b border-border/40 bg-zinc-900 items-center px-2 gap-2 text-xs font-medium text-zinc-400">
                                        <button
                                            onClick={() => setActiveBottomTab("testcase")}
                                            className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors ${activeBottomTab === "testcase" ? "bg-zinc-800 text-zinc-200" : "hover:bg-zinc-800/50 hover:text-zinc-300"}`}
                                        >
                                            <TerminalSquare className={`h-4 w-4 ${activeBottomTab === "testcase" ? "text-green-500" : ""}`} />
                                            Testcase
                                        </button>
                                        <button
                                            onClick={() => setActiveBottomTab("result")}
                                            className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors ${activeBottomTab === "result" ? "bg-zinc-800 text-zinc-200" : "hover:bg-zinc-800/50 hover:text-zinc-300"}`}
                                        >
                                            <Terminal className={`h-4 w-4 ${activeBottomTab === "result" ? "text-green-500" : ""}`} />
                                            Test Result
                                        </button>
                                    </div>
                                    <div className="flex-1 overflow-auto p-4">
                                        {activeBottomTab === "testcase" ? (
                                            aiData?.examples && aiData.examples.length > 0 ? (
                                                <div className="space-y-4">
                                                    <div className="flex gap-2">
                                                        {aiData.examples.map((_: any, i: number) => (
                                                            <button
                                                                key={i}
                                                                onClick={() => setActiveTestCase(i)}
                                                                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${activeTestCase === i ? 'bg-zinc-800 text-white' : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300'}`}
                                                            >
                                                                Case {i + 1}
                                                            </button>
                                                        ))}
                                                    </div>
                                                    <div className="space-y-4 max-w-3xl">
                                                        <div className="space-y-1.5">
                                                            <div className="text-xs text-zinc-500 font-medium">Input:</div>
                                                            <div className="bg-zinc-900 border border-zinc-800 rounded-md p-3 font-mono text-sm text-zinc-300 break-all whitespace-pre-wrap">
                                                                {aiData.examples[activeTestCase]?.input}
                                                            </div>
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            <div className="text-xs text-zinc-500 font-medium">Expected Output:</div>
                                                            <div className="bg-zinc-900 border border-zinc-800 rounded-md p-3 font-mono text-sm text-zinc-300 break-all whitespace-pre-wrap">
                                                                {aiData.examples[activeTestCase]?.output}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="h-full flex items-center justify-center text-zinc-500 text-sm">
                                                    No test cases available.
                                                </div>
                                            )
                                        ) : (
                                            !executionResults || (isExecuting && executionResults.pending) ? (
                                                <div className="h-full flex flex-col items-center justify-center text-zinc-500 font-medium pb-8 gap-3">
                                                    {isExecuting ? (
                                                        <>
                                                            <Loader2 className="h-8 w-8 animate-spin text-zinc-600" />
                                                            <span className="text-zinc-400">Executing Code on {executionResults?.mode === 'submit' ? 'All Massive Test Cases' : 'Sample Edge Cases'}...</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Terminal className="h-10 w-10 text-zinc-700" />
                                                            You must run your code first to see results.
                                                        </>
                                                    )}
                                                </div>
                                            ) : executionResults.error ? (
                                                <div className="h-full flex flex-col items-center justify-center text-red-500 font-medium pb-8 gap-3 max-w-xl mx-auto text-center">
                                                    <TerminalSquare className="h-10 w-10 text-red-500/50" />
                                                    <span className="text-lg">Execution Failed</span>
                                                    <span className="text-sm text-red-400/80 font-mono bg-red-500/10 p-4 rounded-md text-left w-full overflow-auto">
                                                        {executionResults.error}
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className="space-y-4">
                                                    <div className="flex gap-4 items-center">
                                                        <h3 className={`text-xl font-bold ${executionResults.data?.allPassed ? 'text-green-500' : 'text-red-500'}`}>
                                                            {executionResults.data?.allPassed ? 'Accepted' : 'Wrong Answer'}
                                                        </h3>
                                                        <span className="text-zinc-500 text-sm">
                                                            {executionResults.data?.results?.filter((r: any) => r.passed).length} / {executionResults.data?.results?.length} testcases passed
                                                        </span>
                                                    </div>
                                                    
                                                    {/* Tabs for Test Results */}
                                                    <div className="flex gap-2 border-b border-zinc-800 pb-2 overflow-x-auto">
                                                        {executionResults.data?.results?.map((res: any, idx: number) => (
                                                            <button 
                                                                key={idx}
                                                                onClick={() => setActiveResultTab(idx)}
                                                                className={`px-3 py-1.5 rounded flex items-center gap-2 text-sm font-medium transition-colors ${activeResultTab === idx ? (res.passed ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400') : 'hover:bg-zinc-800 text-zinc-500'}`}
                                                            >
                                                                <div className={`h-2 w-2 rounded-full ${res.passed ? 'bg-green-500' : 'bg-red-500'}`} />
                                                                Case {idx + 1}
                                                            </button>
                                                        ))}
                                                    </div>

                                                    {/* Selected Test Result Details */}
                                                    {executionResults.data?.results?.[activeResultTab] && (
                                                        <div className="space-y-4 max-w-3xl pt-2">
                                                            
                                                            {executionResults.data.results[activeResultTab].error && (
                                                                <div className="space-y-1.5 pt-2">
                                                                    <div className="text-xs text-red-400 font-medium">Runtime Error:</div>
                                                                    <div className="bg-red-950/30 border border-red-500/20 rounded-md p-3 font-mono text-sm text-red-300 break-all whitespace-pre-wrap">
                                                                        {executionResults.data.results[activeResultTab].error}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            <div className="space-y-1.5">
                                                                <div className="text-xs text-zinc-500 font-medium">Input:</div>
                                                                <div className="bg-zinc-900 border border-zinc-800 rounded-md p-3 font-mono text-sm text-zinc-300 break-all whitespace-pre-wrap">
                                                                    {executionResults.data.results[activeResultTab].inputSnippet 
                                                                        ? executionResults.data.results[activeResultTab].inputSnippet 
                                                                        : aiData?.examples?.[activeResultTab]?.input || 'Hidden Large Input'}
                                                                </div>
                                                            </div>
                                                            
                                                            <div className="space-y-1.5">
                                                                <div className="text-xs text-zinc-500 font-medium">Output:</div>
                                                                <div className={`border rounded-md p-3 font-mono text-sm break-all whitespace-pre-wrap ${executionResults.data.results[activeResultTab].passed ? 'bg-zinc-900 border-zinc-800 text-zinc-300' : 'bg-red-950/20 border-red-500/30 text-red-300'}`}>
                                                                    {executionResults.data.results[activeResultTab].userOutput || 'undefined'}
                                                                </div>
                                                            </div>

                                                            <div className="space-y-1.5">
                                                                <div className="text-xs text-zinc-500 font-medium">Expected:</div>
                                                                <div className="bg-zinc-900 border border-zinc-800 rounded-md p-3 font-mono text-sm text-zinc-300 break-all whitespace-pre-wrap">
                                                                    {executionResults.data.results[activeResultTab].expectedOutput}
                                                                </div>
                                                            </div>

                                                            {executionResults.data.results[activeResultTab].stdout && typeof executionResults.data.results[activeResultTab].stdout === 'string' && executionResults.data.results[activeResultTab].stdout.trim().length > 0 && (
                                                                <div className="space-y-1.5">
                                                                    <div className="text-xs text-zinc-500 font-medium">Stdout (Console Logs):</div>
                                                                    <div className="bg-black border border-zinc-800 rounded-md p-3 font-mono text-sm text-zinc-400 break-all whitespace-pre-wrap">
                                                                        {executionResults.data.results[activeResultTab].stdout}
                                                                    </div>
                                                                </div>
                                                            )}
                                                            
                                                            {executionResults.data.results[activeResultTab].runtimeMs && (
                                                                 <div className="text-xs text-zinc-500 pt-2 flex items-center gap-2">
                                                                     Runtime: <span className="font-mono text-zinc-300">{Math.round(executionResults.data.results[activeResultTab].runtimeMs)} ms</span>
                                                                 </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        )}
                                    </div>
                                </div>
                            </ResizablePanel>

                        </ResizablePanelGroup>
                    </ResizablePanel>
                </ResizablePanelGroup>
            </div>
        </div>
    );
}
