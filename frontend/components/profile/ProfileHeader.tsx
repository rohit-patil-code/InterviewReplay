import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Clock, Flame, Trophy, Activity } from "lucide-react";

interface ProfileHeaderProps {
    user: {
        name: string;
        email: string;
        joinDate: string;
        avatarUrl?: string;
    };
    stats: {
        problemsReconstructed: number;
        totalSessions: number;
        currentStreak: number;
        avgPracticeTime: string;
    };
}

export function ProfileHeader({ user, stats }: ProfileHeaderProps) {
    return (
        <Card className="w-full border-zinc-800 bg-zinc-950/50 shadow-sm">
            <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">

                    {/* User Info */}
                    <div className="flex items-center gap-4">
                        <Avatar className="h-20 w-20 border-2 border-zinc-800">
                            <AvatarImage src={user.avatarUrl} alt={user.name} />
                            <AvatarFallback className="text-xl bg-zinc-900 text-zinc-400">
                                {user.name.charAt(0)}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <h1 className="text-2xl font-bold text-zinc-100">{user.name}</h1>
                            <p className="text-zinc-400 text-sm">{user.email}</p>
                            <div className="flex items-center gap-2 mt-2 text-xs text-zinc-500">
                                <Calendar className="w-3 h-3" />
                                <span>Member since {user.joinDate}</span>
                            </div>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full md:w-auto mt-6 md:mt-0">
                        <StatBadge
                            icon={<Trophy className="w-4 h-4 text-yellow-500" />}
                            value={stats.problemsReconstructed}
                            label="Problems"
                        />
                        <StatBadge
                            icon={<Activity className="w-4 h-4 text-blue-500" />}
                            value={stats.totalSessions}
                            label="Sessions"
                        />
                        <StatBadge
                            icon={<Flame className="w-4 h-4 text-orange-500" />}
                            value={stats.currentStreak}
                            label="Day Streak"
                        />
                        <StatBadge
                            icon={<Clock className="w-4 h-4 text-emerald-500" />}
                            value={stats.avgPracticeTime}
                            label="Avg Time"
                        />
                    </div>

                </div>
            </CardContent>
        </Card>
    );
}

function StatBadge({ icon, value, label }: { icon: React.ReactNode, value: number | string, label: string }) {
    return (
        <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/50 min-w-[100px]">
            <div className="mb-1">{icon}</div>
            <span className="text-lg font-bold text-zinc-100">{value}</span>
            <span className="text-xs text-zinc-500 uppercase tracking-wider">{label}</span>
        </div>
    );
}
