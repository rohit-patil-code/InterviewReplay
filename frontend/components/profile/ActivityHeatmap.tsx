"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ActivityCalendar } from "react-activity-calendar";
import { format, subDays } from "date-fns";

interface ActivityHeatmapProps {
    data?: {
        date: string;
        count: number;
        level: number;
    }[];
}

// Generate mock data for the last 365 days
const generateMockData = () => {
    const data = [];
    const today = new Date();
    for (let i = 365; i >= 0; i--) {
        const date = subDays(today, i);
        // Random activity level
        const count = Math.random() > 0.7 ? Math.floor(Math.random() * 5) + 1 : 0;
        const level = count === 0 ? 0 : count > 3 ? 4 : count > 2 ? 3 : count > 1 ? 2 : 1;
        data.push({
            date: format(date, "yyyy-MM-dd"),
            count,
            level,
        });
    }
    return data;
};

const mockData = generateMockData();

export function ActivityHeatmap({ data = mockData }: ActivityHeatmapProps) {
    return (
        <Card className="w-full border-zinc-800 bg-zinc-950/50 shadow-sm">
            <CardHeader>
                <CardTitle className="text-lg font-semibold text-zinc-100 flex items-center justify-between">
                    <span>Practice Activity</span>
                    <span className="text-xs font-normal text-zinc-500">{data.filter(d => d.count > 0).length} active days</span>
                </CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center md:justify-start">
                <ActivityCalendar
                    data={data}
                    theme={{
                        dark: ["#18181b", "#3f2c00", "#7c5600", "#b98100", "#facc15"], // Zinc-900 to Yellow-400
                        light: ["#f4f4f5", "#fef08a", "#fde047", "#eab308", "#ca8a04"],
                    }}
                    blockSize={12}
                    blockMargin={4}
                    fontSize={12}
                    showColorLegend={true}
                    showTotalCount={false}
                    labels={{
                        legend: {
                            less: "Less",
                            more: "More",
                        },
                        totalCount: "{{count}} submissions in {{year}}",
                    }}
                    showWeekdayLabels
                />
            </CardContent>
        </Card>
    );
}
