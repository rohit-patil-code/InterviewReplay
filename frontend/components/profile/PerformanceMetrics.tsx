"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

interface PerformanceMetricsProps {
    difficultyData?: { name: string; value: number; color: string }[];
    companyData?: { name: string; value: number }[];
}

const mockDifficultyData = [
    { name: 'Easy', value: 0, color: '#22c55e' },
    { name: 'Medium', value: 0, color: '#eab308' },
    { name: 'Hard', value: 0, color: '#ef4444' },
];

const mockCompanyData = [
    { name: 'No Data', value: 0 },
];

export function PerformanceMetrics({
    difficultyData = mockDifficultyData,
    companyData = mockCompanyData
}: PerformanceMetricsProps) {
    const hasCompanyData = companyData.length > 0 && companyData[0].name !== 'No Data';

    return (
        <div className="grid grid-cols-1 gap-6">

            {/* Difficulty Distribution */}
            <Card className="border-zinc-800 bg-zinc-950/50 shadow-sm">
                <CardHeader className="pb-2">
                    <CardTitle className="text-md font-semibold text-zinc-100">Difficulty Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[200px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={difficultyData} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#27272a" />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={70} stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip
                                    cursor={{ fill: '#27272a' }}
                                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#f4f4f5', borderRadius: '8px' }}
                                />
                                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
                                    {difficultyData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            {/* Company Breakdown */}
            <Card className="border-zinc-800 bg-zinc-950/50 shadow-sm">
                <CardHeader className="pb-2">
                    <CardTitle className="text-md font-semibold text-zinc-100">Top Companies</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[200px] w-full">
                        {hasCompanyData ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={companyData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
                                    <XAxis dataKey="name" stroke="#a1a1aa" fontSize={11} tickLine={false} axisLine={false} />
                                    <YAxis hide />
                                    <Tooltip
                                        cursor={{ fill: '#27272a' }}
                                        contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#f4f4f5', borderRadius: '8px' }}
                                    />
                                    <Bar dataKey="value" fill="#22c55e" radius={[4, 4, 0, 0]} barSize={32} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-zinc-500 text-sm italic">
                                No company data available yet.
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

        </div>
    );
}
