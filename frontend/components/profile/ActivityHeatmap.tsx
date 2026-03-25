"use client";

import { useMemo } from "react";
import {
    subDays,
    format,
    eachDayOfInterval,
    parseISO,
    startOfWeek,
    addDays,
} from "date-fns";

interface HeatmapEntry {
    date: string; // "yyyy-MM-dd"
    count: number;
    level: number; // 0-4
}

interface ActivityHeatmapProps {
    data?: HeatmapEntry[];
}

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAY_LABELS   = ["", "Mon", "", "Wed", "", "Fri", ""];

function getColor(level: number, count: number) {
    if (count === 0) return "bg-zinc-800 border-zinc-700";
    if (level === 1) return "bg-emerald-900 border-emerald-800";
    if (level === 2) return "bg-emerald-700 border-emerald-600";
    if (level === 3) return "bg-emerald-500 border-emerald-400";
    return "bg-emerald-400 border-emerald-300";
}

export function ActivityHeatmap({ data }: ActivityHeatmapProps) {
    const { weeks, monthPositions, totalSubmissions, activeDays } = useMemo(() => {
        const today      = new Date();
        const startRaw   = subDays(today, 364);
        // Align to the Sunday/start of week
        const start      = startOfWeek(startRaw, { weekStartsOn: 0 });
        const allDays    = eachDayOfInterval({ start, end: today });

        // Build a lookup from date string to heatmap entry
        const lookup = new Map<string, HeatmapEntry>();
        (data || []).forEach((d) => lookup.set(d.date, d));

        // Group into weeks (columns of 7)
        const weeksArr: { date: Date; entry: HeatmapEntry | null }[][] = [];
        let currentWeek: { date: Date; entry: HeatmapEntry | null }[] = [];

        for (const day of allDays) {
            const key   = format(day, "yyyy-MM-dd");
            const entry = lookup.get(key) ?? null;
            currentWeek.push({ date: day, entry });
            if (currentWeek.length === 7) {
                weeksArr.push(currentWeek);
                currentWeek = [];
            }
        }
        if (currentWeek.length > 0) weeksArr.push(currentWeek);

        // Calculate month label positions: which column index each month first appears
        const monthPos: { label: string; col: number }[] = [];
        let lastMonth = -1;
        weeksArr.forEach((week, colIdx) => {
            const firstDay = week.find((d) => d.date <= today);
            if (!firstDay) return;
            const month = firstDay.date.getMonth();
            if (month !== lastMonth) {
                lastMonth = month;
                monthPos.push({ label: MONTH_LABELS[month], col: colIdx });
            }
        });

        const total   = (data || []).reduce((s, d) => s + d.count, 0);
        const actDays = (data || []).filter((d) => d.count > 0).length;

        return { weeks: weeksArr, monthPositions: monthPos, totalSubmissions: total, activeDays: actDays };
    }, [data]);

    return (
        <div className="bg-card border border-border rounded-xl p-5 space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">Practice Activity</h3>
                <div className="flex gap-4 text-xs text-muted-foreground">
                    <span><span className="text-emerald-400 font-semibold">{totalSubmissions}</span> submissions</span>
                    <span><span className="text-foreground font-semibold">{activeDays}</span> active days</span>
                </div>
            </div>

            {/* Calendar */}
            <div className="overflow-x-auto">
                <div className="inline-block min-w-full">
                    {/* Month labels row */}
                    <div className="flex mb-1 ml-7">
                        {monthPositions.map((mp, i) => {
                            const nextCol = monthPositions[i + 1]?.col ?? weeks.length;
                            const width   = (nextCol - mp.col) * 14; // 11px cell + 3px gap
                            return (
                                <div
                                    key={mp.col}
                                    className="text-[10px] text-muted-foreground overflow-hidden"
                                    style={{ minWidth: width, maxWidth: width }}
                                >
                                    {mp.label}
                                </div>
                            );
                        })}
                    </div>

                    {/* Grid: day-labels + week columns */}
                    <div className="flex gap-0">
                        {/* Day-of-week labels */}
                        <div className="flex flex-col gap-[3px] mr-1.5">
                            {DAY_LABELS.map((label, i) => (
                                <div key={i} className="h-[11px] text-[9px] leading-[11px] text-muted-foreground w-5 text-right pr-0.5">
                                    {label}
                                </div>
                            ))}
                        </div>

                        {/* Week columns */}
                        <div className="flex gap-[3px]">
                            {weeks.map((week, wi) => (
                                <div key={wi} className="flex flex-col gap-[3px]">
                                    {week.map(({ date, entry }, di) => {
                                        const count    = entry?.count ?? 0;
                                        const level    = entry?.level ?? 0;
                                        const dateStr  = format(date, "MMM d, yyyy");
                                        const isFuture = date > new Date();
                                        return (
                                            <div
                                                key={di}
                                                title={isFuture ? "" : `${dateStr}: ${count} submission${count !== 1 ? "s" : ""}`}
                                                className={`w-[11px] h-[11px] rounded-[2px] border transition-colors ${
                                                    isFuture
                                                        ? "bg-transparent border-transparent"
                                                        : getColor(level, count)
                                                }`}
                                            />
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Legend */}
                    <div className="flex items-center gap-1 mt-2 ml-7 text-[10px] text-muted-foreground">
                        <span>Less</span>
                        {["bg-zinc-800", "bg-emerald-900", "bg-emerald-700", "bg-emerald-500", "bg-emerald-400"].map((c, i) => (
                            <div key={i} className={`w-[11px] h-[11px] rounded-[2px] ${c}`} />
                        ))}
                        <span>More</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
