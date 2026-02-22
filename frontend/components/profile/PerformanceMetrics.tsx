"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
    PieChart, Pie, Legend
} from 'recharts';

interface PerformanceMetricsProps {
    difficultyData?: { name: string; value: number; color: string }[];
    companyData?: { name: string; value: number }[];
}

const mockDifficultyData = [
    { name: 'Easy', value: 12, color: '#22c55e' }, // emerald-500
    { name: 'Medium', value: 25, color: '#eab308' }, // yellow-500
    { name: 'Hard', value: 5, color: '#ef4444' }, // red-500
];

const mockCompanyData = [
    { name: 'Amazon', value: 8 },
    { name: 'Google', value: 6 },
    { name: 'Meta', value: 4 },
    { name: 'Uber', value: 3 },
    { name: 'Netflix', value: 2 },
];

export function PerformanceMetrics({
    difficultyData = mockDifficultyData,
    companyData = mockCompanyData
}: PerformanceMetricsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Difficulty Distribution */}
            <Card className="border-zinc-800 bg-zinc-950/50">
                <CardHeader>
                    <CardTitle className="text-lg text-zinc-100">Difficulty Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={difficultyData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#27272a" />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={60} stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip
                                    cursor={{ fill: '#27272a' }}
                                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#f4f4f5' }}
                                />
                                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={30}>
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
            <Card className="border-zinc-800 bg-zinc-950/50">
                <CardHeader>
                    <CardTitle className="text-lg text-zinc-100">Top Companies</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={companyData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
                                <XAxis dataKey="name" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis hide />
                                <Tooltip
                                    cursor={{ fill: '#27272a' }}
                                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#f4f4f5' }}
                                />
                                <Bar dataKey="value" fill="#facc15" radius={[4, 4, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

        </div>
    );
}
