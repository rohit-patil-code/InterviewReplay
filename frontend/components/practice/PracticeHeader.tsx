import { ArrowLeft, Loader2, Play, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface PracticeHeaderProps {
    problem: {
        title: string;
        company: string;
    } | null;
    isExecuting: boolean;
    executionResults: any;
    handleExecute: (mode: 'run' | 'submit') => void;
}

export function PracticeHeader({
    problem,
    isExecuting,
    executionResults,
    handleExecute,
}: PracticeHeaderProps) {
    if (!problem) return null;

    return (
        <div className="h-14 border-b flex items-center justify-between px-4 shrink-0 bg-card/50 backdrop-blur-sm z-10 w-full relative">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild className="h-8 w-8 rounded-full">
                    <Link href="/dashboard">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div className="font-semibold text-sm flex items-center gap-3">
                    {problem.title}
                    <Badge variant="secondary" className="font-normal border-amber-500/20 text-amber-500/80 bg-amber-500/10 hover:bg-amber-500/20 hidden sm:inline-flex">
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
                    <span className="hidden sm:inline-block">{isExecuting && executionResults?.mode === 'run' ? 'Running...' : 'Run Code'}</span>
                    <span className="sm:hidden">{isExecuting && executionResults?.mode === 'run' ? 'Running...' : 'Run'}</span>
                </Button>
                <Button
                    onClick={() => handleExecute('submit')}
                    disabled={isExecuting}
                    variant="default"
                    size="sm"
                    className={`h-8 gap-2 text-white ${isExecuting && executionResults?.mode === 'submit' ? 'bg-green-700' : 'bg-green-600 hover:bg-green-700'}`}
                >
                    {isExecuting && executionResults?.mode === 'submit' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                    <span className="hidden sm:inline-block">{isExecuting && executionResults?.mode === 'submit' ? 'Submitting...' : 'Submit'}</span>
                    <span className="sm:hidden">{isExecuting && executionResults?.mode === 'submit' ? 'Submitting...' : 'Submit'}</span>
                </Button>
            </div>
        </div>
    );
}
