"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const mockTrendData = [
    { day: '1', minutes: 30 },
    { day: '5', minutes: 45 },
    { day: '10', minutes: 20 },
    { day: '15', minutes: 60 },
    { day: '20', minutes: 50 },
    { day: '25', minutes: 90 },
    { day: '30', minutes: 75 },
];

export function ImprovementTrend({ data = mockTrendData }) {
    return (
        <Card className="border-zinc-800 bg-zinc-950/50">
            <CardHeader>
                <CardTitle className="text-lg text-zinc-100">Practice Time Trend (Last 30 Days)</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                            <XAxis dataKey="day" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#f4f4f5' }}
                            />
                            <Line type="monotone" dataKey="minutes" stroke="#facc15" strokeWidth={2} dot={{ r: 4, fill: '#facc15' }} activeDot={{ r: 6 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
