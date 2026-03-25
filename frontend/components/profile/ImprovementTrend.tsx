"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const mockTrendData = [
    { day: 'No Data', minutes: 0 },
];

export function ImprovementTrend({ data = mockTrendData }) {
    const hasData = data && data.length > 0 && data[0].day !== 'No Data';

    return (
        <Card className="border-zinc-800 bg-zinc-950/50 shadow-sm">
            <CardHeader>
                <CardTitle className="text-lg font-semibold text-zinc-100">Practice Activity Trend (Recent)</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[250px] w-full">
                    {hasData ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
                                <XAxis dataKey="day" stroke="#a1a1aa" fontSize={11} tickLine={false} axisLine={false} />
                                <YAxis hide />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#f4f4f5', borderRadius: '8px' }}
                                />
                                <Line 
                                    type="monotone" 
                                    dataKey="minutes" 
                                    stroke="#22c55e" 
                                    strokeWidth={3} 
                                    dot={{ r: 4, fill: '#22c55e', strokeWidth: 2, stroke: '#09090b' }} 
                                    activeDot={{ r: 6, fill: '#4ade80' }} 
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-full text-zinc-500 text-sm italic">
                            Keep practicing to see your trend!
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
