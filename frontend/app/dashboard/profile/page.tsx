"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/components/providers/UserProvider";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ActivityHeatmap } from "@/components/profile/ActivityHeatmap";
import { PerformanceMetrics } from "@/components/profile/PerformanceMetrics";
import { RecentActivity } from "@/components/profile/RecentActivity";
import { ImprovementTrend } from "@/components/profile/ImprovementTrend";

import { formatDistanceToNow, parseISO, format } from "date-fns";

export default function ProfilePage() {
    const { user, loading: userLoading } = useUser();
    const router = useRouter();
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [heatmapData, setHeatmapData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userLoading && !user) {
            router.push("/login");
        }
    }, [user, userLoading, router]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"}/submissions`, {
                    credentials: "include",
                });
                if (!res.ok) throw new Error("Failed to fetch submissions");
                const data = await res.json();
                
                setSubmissions(data.submissions || []);
                
                const mappedHeatmap = (data.heatmap || []).map((h: any) => ({
                    date: h.day.split('T')[0],
                    count: parseInt(h.count),
                    level: Math.min(Math.ceil(parseInt(h.count) / 2), 4)
                }));
                setHeatmapData(mappedHeatmap);

            } catch (err) {
                console.error("Profile data fetch error:", err);
            } finally {
                setLoading(false);
            }
        };

        if (user) fetchData();
    }, [user]);

    if (userLoading || loading || !user) {
        return <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>;
    }

    const profileUser = {
        name: user.display_name || (user.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : "User"),
        email: user.email,
        joinDate: user.created_at ? new Date(user.created_at).toLocaleDateString() : "N/A",
        avatarUrl: user.avatar_url ?? undefined,
    };

    const stats = {
        problemsReconstructed: submissions.length,
        totalSessions: new Set(submissions.map(s => s.submitted_at.split('T')[0])).size,
        currentStreak: 0,
        avgPracticeTime: "N/A",
    };

    const formattedActivities = submissions.slice(0, 10).map(s => ({
        id: s.id,
        problemName: s.problem_title || "Unknown Problem",
        difficulty: (s.difficulty || "Medium") as "Easy" | "Medium" | "Hard",
        company: s.company_name || "N/A",
        date: formatDistanceToNow(parseISO(s.submitted_at), { addSuffix: true }),
        status: (s.status === 'Accepted' ? 'Solved' : s.status === 'Wrong Answer' ? 'Failed' : 'Pending') as any
    }));

    const difficultyCounts = submissions.reduce((acc: any, s: any) => {
        const d = s.difficulty || 'Medium';
        acc[d] = (acc[d] || 0) + 1;
        return acc;
    }, {});
    const difficultyData = [
        { name: 'Easy', value: difficultyCounts['Easy'] || 0, color: '#22c55e' },
        { name: 'Medium', value: difficultyCounts['Medium'] || 0, color: '#eab308' },
        { name: 'Hard', value: difficultyCounts['Hard'] || 0, color: '#ef4444' },
    ];

    const companyCounts = submissions.reduce((acc: any, s: any) => {
        const c = s.company_name || 'N/A';
        acc[c] = (acc[c] || 0) + 1;
        return acc;
    }, {});
    const companyData = Object.entries(companyCounts)
        .map(([name, value]) => ({ name, value: value as number }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

    const trendData = heatmapData.slice(-7).map(h => ({
        day: format(parseISO(h.date), "MMM d"),
        minutes: h.count
    }));

    return (
        <div className="container mx-auto px-3 py-4 sm:p-6 space-y-4 sm:space-y-8 max-w-6xl">
            <ProfileHeader user={profileUser} stats={stats} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
                <div className="lg:col-span-2 space-y-4 sm:space-y-8">
                    <ActivityHeatmap data={heatmapData} />
                    <ImprovementTrend data={trendData.length > 0 ? trendData : undefined} />
                    <RecentActivity activities={formattedActivities} />
                </div>
                <div className="space-y-4 sm:space-y-8">
                    <PerformanceMetrics difficultyData={difficultyData} companyData={companyData} />
                </div>
            </div>
        </div>
    );
}
