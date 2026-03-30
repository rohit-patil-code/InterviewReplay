"use client";

import { useEffect, useState, useTransition } from "react";
import { useUser } from "@/components/providers/UserProvider";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { CheckCircle2, AlertCircle, Clock, Loader2 } from "lucide-react";

interface ProfileData {
    email: string;
    first_name: string;
    last_name: string;
    display_name: string;
    can_change_name: boolean;
    next_name_change_date: string | null;
}

export function SettingsTabs() {
    const { user } = useUser();
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [displayName, setDisplayName] = useState("");
    const [status, setStatus] = useState<"idle" | "success" | "error" | "cooldown">("idle");
    const [message, setMessage] = useState("");
    const [isPending, startTransition] = useTransition();

    // Fetch real profile data from backend
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"}/profile`, {
                    credentials: "include",
                });
                if (!res.ok) throw new Error("Failed to fetch profile");
                const data = await res.json();
                setProfile(data);
                setDisplayName(data.display_name || "");
            } catch (err) {
                console.error("Failed to load profile settings:", err);
                // Fallback to UserProvider data
                if (user) {
                    const fallback = user.display_name ||
                        (user.first_name ? `${user.first_name} ${user.last_name || ""}`.trim() : "");
                    setDisplayName(fallback);
                }

            }
        };
        if (user) fetchProfile();
    }, [user]);

    const handleSave = async () => {
        if (!displayName.trim()) return;

        startTransition(async () => {
            setStatus("idle");
            setMessage("");
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"}/profile`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({ display_name: displayName.trim() }),
                });

                const data = await res.json();

                if (res.status === 429) {
                    setStatus("cooldown");
                    setMessage(data.error || "Name change on cooldown.");
                } else if (!res.ok) {
                    setStatus("error");
                    setMessage(data.error || "Failed to save changes.");
                } else {
                    setStatus("success");
                    setMessage("Display name updated successfully!");
                    setProfile((prev) => prev ? { ...prev, display_name: displayName.trim(), can_change_name: false } : prev);
                    setTimeout(() => setStatus("idle"), 4000);
                }
            } catch (err) {
                setStatus("error");
                setMessage("An unexpected error occurred.");
            }
        });
    };

    const email = profile?.email ?? user?.email ?? "";
    const canChange = profile?.can_change_name ?? true;
    const nextDate = profile?.next_name_change_date;

    return (
        <Tabs defaultValue="account" className="w-full">
            <TabsContent value="account">
                <Card className="border-zinc-800 bg-zinc-950/50">
                    <CardHeader>
                        <CardTitle className="text-zinc-100">Account Information</CardTitle>
                        <CardDescription className="text-zinc-500">
                            Manage your account details. Display name can be changed once every 30 days.
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        {/* Display Name */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="name" className="text-zinc-300">Display Name</Label>
                                {!canChange && nextDate && (
                                    <span className="flex items-center gap-1 text-xs text-amber-400">
                                        <Clock className="h-3 w-3" />
                                        Next change: {new Date(nextDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                    </span>
                                )}
                            </div>
                            <Input
                                id="name"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                disabled={!canChange || isPending}
                                maxLength={50}
                                placeholder="Your display name"
                                className={`bg-zinc-900 border-zinc-700 text-zinc-100 focus-visible:ring-zinc-600 ${!canChange ? "opacity-60 cursor-not-allowed" : ""}`}
                            />
                            {!canChange && (
                                <p className="text-xs text-zinc-500">
                                    You can only change your display name once every 30 days.
                                </p>
                            )}
                        </div>

                        {/* Email (read-only) */}
                        <div className="space-y-1.5">
                            <Label htmlFor="email" className="text-zinc-300">Email</Label>
                            <Input
                                id="email"
                                value={email}
                                disabled
                                className="bg-zinc-900/50 border-zinc-800 text-zinc-500 cursor-not-allowed"
                            />
                            <p className="text-xs text-zinc-600">Email cannot be changed.</p>
                        </div>

                        {/* Status Message */}
                        {status !== "idle" && (
                            <div className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-xs ${
                                status === "success"
                                    ? "border-emerald-800 bg-emerald-950/50 text-emerald-400"
                                    : status === "cooldown"
                                    ? "border-amber-800 bg-amber-950/50 text-amber-400"
                                    : "border-red-800 bg-red-950/50 text-red-400"
                            }`}>
                                {status === "success" && <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" />}
                                {status === "error" && <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />}
                                {status === "cooldown" && <Clock className="h-3.5 w-3.5 mt-0.5 shrink-0" />}
                                <span>{message}</span>
                            </div>
                        )}
                    </CardContent>

                    <CardFooter>
                        <Button
                            onClick={handleSave}
                            disabled={!canChange || isPending || !displayName.trim()}
                            className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200 disabled:opacity-50"
                        >
                            {isPending ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                "Save Changes"
                            )}
                        </Button>
                    </CardFooter>
                </Card>
            </TabsContent>
        </Tabs>
    );
}
