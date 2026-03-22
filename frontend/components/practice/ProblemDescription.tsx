import { Badge } from "@/components/ui/badge";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ProblemDescriptionProps {
    problem: {
        title: string;
        difficulty: string;
        company: string;
    } | null;
    aiData: any;
}

export function ProblemDescription({ problem, aiData }: ProblemDescriptionProps) {
    if (!problem || !aiData) return null;

    return (
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
    );
}
