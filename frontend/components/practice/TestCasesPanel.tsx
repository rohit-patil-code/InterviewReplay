import { useState, useEffect } from "react";
import { TerminalSquare, Terminal, Loader2 } from "lucide-react";

interface TestCasesPanelProps {
    aiData: any;
    isExecuting: boolean;
    executionResults: any;
}

export function TestCasesPanel({
    aiData,
    isExecuting,
    executionResults,
}: TestCasesPanelProps) {
    const [activeBottomTab, setActiveBottomTab] = useState<"testcase" | "result">("testcase");
    const [activeTestCase, setActiveTestCase] = useState(0);
    const [activeResultTab, setActiveResultTab] = useState<number>(0);

    // Auto-switch to "Test Result" tab when execution begins
    useEffect(() => {
        if (executionResults?.pending) {
            setActiveBottomTab("result");
        }
    }, [executionResults?.pending]);

    // Auto-switch to first test case when execution finishes
    useEffect(() => {
        if (executionResults?.data) {
            setActiveResultTab(0);
        }
    }, [executionResults?.data]);

    return (
        <div className="flex flex-col h-full bg-zinc-950 border-t border-border/40 min-h-[300px]">
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
    );
}
