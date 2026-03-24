"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format, parseISO, subDays, eachDayOfInterval } from "date-fns";
import { CheckCircle2, XCircle, Clock, AlertTriangle, Code2, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Editor from "@monaco-editor/react";

// --- Types ---
interface Submission {
    id: string;
    problem_id: string;
    problem_title: string;
    difficulty: string;
    language: string;
    code: string;
    status: string;
    runtime_ms: number | null;
    submitted_at: string;
}

interface HeatmapDay {
    day: string;
    count: number;
    accepted_count: number;
}

// --- Status Config ---
const STATUS_CONFIG: Record<string, { color: string; icon: React.ElementType; badge: string }> = {
    "Accepted": { color: "text-emerald-400", icon: CheckCircle2, badge: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
    "Wrong Answer": { color: "text-red-400", icon: XCircle, badge: "bg-red-500/15 text-red-400 border-red-500/30" },
    "Time Limit Exceeded": { color: "text-yellow-400", icon: Clock, badge: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" },
    "Runtime Error": { color: "text-orange-400", icon: AlertTriangle, badge: "bg-orange-500/15 text-orange-400 border-orange-500/30" },
};

const LANG_MAP: Record<string, string> = { python: "Python 3", java: "Java 21", cpp: "C++17" };
const MONACO_LANG: Record<string, string> = { python: "python", java: "java", cpp: "cpp" };

// --- Heatmap ---
function SubmissionHeatmap({ heatmap }: { heatmap: HeatmapDay[] }) {
    const today = new Date();
    const start = subDays(today, 364);
    const days = eachDayOfInterval({ start, end: today });

    const countMap = new Map<string, number>();
    heatmap.forEach(h => countMap.set(h.day.split("T")[0], h.count));

    const weeks: Date[][] = [];
    let currentWeek: Date[] = [];
    days.forEach((d, i) => {
        currentWeek.push(d);
        if (currentWeek.length === 7 || i === days.length - 1) {
            weeks.push(currentWeek);
            currentWeek = [];
        }
    });

    const getColor = (count: number) => {
        if (count === 0) return "bg-secondary/30";
        if (count === 1) return "bg-emerald-900";
        if (count <= 3) return "bg-emerald-700";
        if (count <= 6) return "bg-emerald-500";
        return "bg-emerald-400";
    };

    const totalSubmissions = heatmap.reduce((sum, h) => sum + h.count, 0);
    const acceptedSubmissions = heatmap.reduce((sum, h) => sum + h.accepted_count, 0);
    const activeDays = heatmap.filter(h => h.count > 0).length;

    return (
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-foreground">Submission Activity</h2>
                <div className="flex items-center gap-6 text-xs text-muted-foreground">
                    <span><span className="text-foreground font-semibold">{totalSubmissions}</span> total</span>
                    <span><span className="text-emerald-400 font-semibold">{acceptedSubmissions}</span> accepted</span>
                    <span><span className="text-foreground font-semibold">{activeDays}</span> active days</span>
                </div>
            </div>
            <div className="overflow-x-auto">
                <div className="flex gap-1">
                    {weeks.map((week, wi) => (
                        <div key={wi} className="flex flex-col gap-1">
                            {week.map((day, di) => {
                                const key = format(day, "yyyy-MM-dd");
                                const count = countMap.get(key) || 0;
                                return (
                                    <div
                                        key={di}
                                        className={`w-3 h-3 rounded-sm ${getColor(count)} transition-colors`}
                                        title={`${format(day, "MMM d, yyyy")}: ${count} submission${count !== 1 ? "s" : ""}`}
                                    />
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <span>Less</span>
                {["bg-secondary/30", "bg-emerald-900", "bg-emerald-700", "bg-emerald-500", "bg-emerald-400"].map((c, i) => (
                    <div key={i} className={`w-3 h-3 rounded-sm ${c}`} />
                ))}
                <span>More</span>
            </div>
        </div>
    );
}

// --- Main Page ---
export default function HistoryPage() {
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [heatmap, setHeatmap] = useState<HeatmapDay[]>([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<Submission | null>(null);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await fetch("http://localhost:3001/api/submissions", {
                    credentials: "include",
                });
                if (!res.ok) throw new Error("Failed to fetch submissions");
                const data = await res.json();
                setSubmissions(data.submissions || []);
                setHeatmap(data.heatmap || []);
            } catch (err) {
                console.error("Failed to load history:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, []);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Submission History</h1>
                <p className="text-muted-foreground text-sm mt-1">Track your coding progress and review past submissions.</p>
            </div>

            {/* Heatmap */}
            <SubmissionHeatmap heatmap={heatmap} />

            {/* Submissions Table */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-border">
                    <h2 className="text-sm font-semibold">Recent Submissions</h2>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mr-3" />
                        Loading submissions...
                    </div>
                ) : submissions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
                        <Code2 className="h-10 w-10 opacity-20" />
                        <p className="text-sm">No submissions yet. Start practicing!</p>
                        <Link href="/dashboard/practice" className="text-xs text-primary hover:underline">Browse problems →</Link>
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent border-border">
                                <TableHead className="text-xs font-medium text-muted-foreground w-[180px]">Status</TableHead>
                                <TableHead className="text-xs font-medium text-muted-foreground">Problem</TableHead>
                                <TableHead className="text-xs font-medium text-muted-foreground">Language</TableHead>
                                <TableHead className="text-xs font-medium text-muted-foreground">Runtime</TableHead>
                                <TableHead className="text-xs font-medium text-muted-foreground">Submitted</TableHead>
                                <TableHead className="w-10" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {submissions.map((s) => {
                                const cfg = STATUS_CONFIG[s.status] || STATUS_CONFIG["Runtime Error"];
                                const Icon = cfg.icon;
                                return (
                                    <TableRow
                                        key={s.id}
                                        className="cursor-pointer hover:bg-secondary/30 border-border transition-colors"
                                        onClick={() => setSelected(s)}
                                    >
                                        <TableCell>
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${cfg.badge}`}>
                                                <Icon className="h-3 w-3" />
                                                {s.status}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <span className="font-medium text-sm hover:text-primary transition-colors">
                                                {s.problem_title || "Unknown Problem"}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-xs text-muted-foreground">{LANG_MAP[s.language] || s.language}</span>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-xs text-muted-foreground">
                                                {s.runtime_ms != null ? `${s.runtime_ms} ms` : "—"}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-xs text-muted-foreground">
                                                {format(parseISO(s.submitted_at), "MMM d, yyyy · h:mm a")}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-50" />
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                )}
            </div>

            {/* Code Snapshot Drawer */}
            <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
                <SheetContent side="right" className="w-full sm:max-w-2xl flex flex-col p-0">
                    {selected && (() => {
                        const cfg = STATUS_CONFIG[selected.status] || STATUS_CONFIG["Runtime Error"];
                        const Icon = cfg.icon;
                        return (
                            <>
                                <SheetHeader className="px-6 py-5 border-b border-border">
                                    <div className="flex items-center gap-3">
                                        <Icon className={`h-5 w-5 ${cfg.color}`} />
                                        <div>
                                            <SheetTitle className="text-base font-semibold leading-tight">
                                                {selected.problem_title || "Submission"}
                                            </SheetTitle>
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                {LANG_MAP[selected.language] || selected.language} · {selected.runtime_ms != null ? `${selected.runtime_ms} ms` : "—"} · {format(parseISO(selected.submitted_at), "MMM d, yyyy")}
                                            </p>
                                        </div>
                                        <span className={`ml-auto inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${cfg.badge}`}>
                                            {selected.status}
                                        </span>
                                    </div>
                                </SheetHeader>
                                <div className="flex-1 overflow-hidden">
                                    <Editor
                                        height="100%"
                                        language={MONACO_LANG[selected.language] || "plaintext"}
                                        value={selected.code}
                                        theme="vs-dark"
                                        options={{
                                            readOnly: true,
                                            minimap: { enabled: false },
                                            fontSize: 13,
                                            lineNumbers: "on",
                                            scrollBeyondLastLine: false,
                                            padding: { top: 16, bottom: 16 },
                                        }}
                                    />
                                </div>
                                <div className="px-6 py-4 border-t border-border">
                                    <Link
                                        href={`/practice/${selected.problem_id}`}
                                        className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                                    >
                                        Re-open problem <ExternalLink className="h-3 w-3" />
                                    </Link>
                                </div>
                            </>
                        );
                    })()}
                </SheetContent>
            </Sheet>
        </div>
    );
}
