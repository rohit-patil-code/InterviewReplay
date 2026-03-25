"use client"

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle, Clock } from "lucide-react";
import Link from "next/link";

interface ActivityItem {
    id: string;
    problemName: string;
    difficulty: "Easy" | "Medium" | "Hard";
    company: string;
    date: string;
    status: "Solved" | "Failed" | "Pending";
}

const mockActivity: ActivityItem[] = [
    { id: "1", problemName: "Two Sum", difficulty: "Easy", company: "Amazon", date: "2 hours ago", status: "Solved" },
    { id: "2", problemName: "LRU Cache", difficulty: "Medium", company: "Google", date: "Yesterday", status: "Solved" },
];

const difficultyStyle: Record<string, string> = {
    Easy: "border-emerald-500/20 text-emerald-500 bg-emerald-500/10",
    Medium: "border-yellow-500/20 text-yellow-500 bg-yellow-500/10",
    Hard: "border-red-500/20 text-red-500 bg-red-500/10",
};

const statusIcon = {
    Solved: <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />,
    Failed: <XCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />,
    Pending: <Clock className="w-3.5 h-3.5 text-yellow-500 shrink-0" />,
};

const statusText: Record<string, string> = {
    Solved: "text-green-500",
    Failed: "text-red-500",
    Pending: "text-zinc-400",
};

export function RecentActivity({ activities = [] }: { activities?: ActivityItem[] }) {
    const displayActivities = activities.length > 0 ? activities : mockActivity;

    return (
        <Card className="border-zinc-800 bg-zinc-950/50 min-h-[300px]">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg text-zinc-100">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="p-0 sm:p-6 sm:pt-0">
                {/* Mobile: Card list */}
                <div className="flex flex-col divide-y divide-zinc-800 sm:hidden">
                    {displayActivities.map((a) => (
                        <Link key={a.id} href="/dashboard/history" className="flex flex-col gap-1.5 px-4 py-3 hover:bg-zinc-900/40 transition-colors">
                            <div className="flex items-start justify-between gap-2">
                                <span className="font-semibold text-zinc-200 text-sm leading-tight">{a.problemName}</span>
                                <div className="flex items-center gap-1 shrink-0">
                                    {statusIcon[a.status]}
                                    <span className={`text-xs ${statusText[a.status]}`}>{a.status}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${difficultyStyle[a.difficulty]}`}>
                                    {a.difficulty}
                                </Badge>
                                <span className="text-xs text-zinc-500">{a.company}</span>
                                <span className="text-xs text-zinc-600 ml-auto">{a.date}</span>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* Desktop: Table */}
                <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-zinc-800">
                                <th className="text-left py-2 px-3 text-zinc-400 font-medium">Problem</th>
                                <th className="text-left py-2 px-3 text-zinc-400 font-medium">Difficulty</th>
                                <th className="text-left py-2 px-3 text-zinc-400 font-medium">Company</th>
                                <th className="text-left py-2 px-3 text-zinc-400 font-medium">Status</th>
                                <th className="text-right py-2 px-3 text-zinc-400 font-medium">Time</th>
                            </tr>
                        </thead>
                        <tbody>
                            {displayActivities.map((a) => (
                                <tr key={a.id} className="border-b border-zinc-800/60 hover:bg-zinc-900/40 transition-colors">
                                    <td className="py-2.5 px-3 font-semibold text-zinc-200">{a.problemName}</td>
                                    <td className="py-2.5 px-3">
                                        <Badge variant="outline" className={difficultyStyle[a.difficulty]}>{a.difficulty}</Badge>
                                    </td>
                                    <td className="py-2.5 px-3 text-zinc-400">{a.company}</td>
                                    <td className="py-2.5 px-3">
                                        <div className="flex items-center gap-1.5">
                                            {statusIcon[a.status]}
                                            <span className={statusText[a.status]}>{a.status}</span>
                                        </div>
                                    </td>
                                    <td className="py-2.5 px-3 text-right text-xs text-zinc-500 whitespace-nowrap">{a.date}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
}
