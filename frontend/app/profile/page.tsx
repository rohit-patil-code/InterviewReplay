"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/components/providers/UserProvider";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ActivityHeatmap } from "@/components/profile/ActivityHeatmap";
import { PerformanceMetrics } from "@/components/profile/PerformanceMetrics";
import { RecentActivity } from "@/components/profile/RecentActivity";
import { SettingsTabs } from "@/components/profile/SettingsTabs";
import { ImprovementTrend } from "@/components/profile/ImprovementTrend";

export default function ProfilePage() {
    const { user, loading } = useUser();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
        }
    }, [user, loading, router]);

    if (loading || !user) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    // Transform user data for ProfileHeader
    const profileUser = {
        name: user.first_name ? `${user.first_name} ${user.last_name || ''}` : "User",
        email: user.email,
        joinDate: user.created_at ? new Date(user.created_at).toLocaleDateString() : "N/A",
        avatarUrl: undefined, // Or a placeholder
    };

    // Placeholder stats
    const stats = {
        problemsReconstructed: 42,
        totalSessions: 15,
        currentStreak: 5,
        avgPracticeTime: "45m",
    };

    return (
        <div className="container mx-auto p-6 space-y-8 max-w-6xl">
            <ProfileHeader user={profileUser} stats={stats} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <ActivityHeatmap />
                    <ImprovementTrend />
                    <RecentActivity />
                </div>
                <div className="space-y-8">
                    <PerformanceMetrics />
                    <SettingsTabs />
                </div>
            </div>
        </div>
    );
}
