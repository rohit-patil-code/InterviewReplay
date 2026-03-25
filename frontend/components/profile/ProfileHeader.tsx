import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
            <CardContent className="p-4 sm:p-6">
                {/* Top row: avatar + name, flexible wrap */}
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start sm:items-center justify-between">
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                        <Avatar className="h-14 w-14 sm:h-20 sm:w-20 shrink-0 border-2 border-zinc-800">
                            <AvatarImage src={user.avatarUrl} alt={user.name} />
                            <AvatarFallback className="text-lg sm:text-xl bg-zinc-900 text-zinc-400">
                                {user.name.charAt(0)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                            <h1 className="text-xl sm:text-2xl font-bold text-zinc-100 truncate">{user.name}</h1>
                            <p className="text-zinc-400 text-xs sm:text-sm truncate">{user.email}</p>
                            <div className="flex items-center gap-1.5 mt-1.5 text-xs text-zinc-500">
                                <Calendar className="w-3 h-3 shrink-0" />
                                <span>Member since {user.joinDate}</span>
                            </div>
                        </div>
                    </div>

                    {/* Stats grid – 2 cols on mobile, 4 on sm+ */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 w-full sm:w-auto">
                        <StatBadge icon={<Trophy className="w-4 h-4 text-yellow-500" />} value={stats.problemsReconstructed} label="Problems" />
                        <StatBadge icon={<Activity className="w-4 h-4 text-blue-500" />} value={stats.totalSessions} label="Sessions" />
                        <StatBadge icon={<Flame className="w-4 h-4 text-orange-500" />} value={stats.currentStreak} label="Streak" />
                        <StatBadge icon={<Clock className="w-4 h-4 text-emerald-500" />} value={stats.avgPracticeTime} label="Avg Time" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function StatBadge({ icon, value, label }: { icon: React.ReactNode; value: number | string; label: string }) {
    return (
        <div className="flex flex-col items-center justify-center p-2 sm:p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/50">
            <div className="mb-1">{icon}</div>
            <span className="text-base sm:text-lg font-bold text-zinc-100">{value}</span>
            <span className="text-[10px] sm:text-xs text-zinc-500 uppercase tracking-wider">{label}</span>
        </div>
    );
}
