"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/components/providers/UserProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    User,
    Settings,
    Shield,
    Moon,
    Upload,
    Trash2,
    CheckCircle2,
    AlertCircle,
    Clock,
    Loader2,
    TriangleAlert,
} from "lucide-react";
import { authApi } from "@/lib/api";

interface ProfileData {
    email: string;
    display_name: string;
    bio: string;
    avatar_url: string | null;
    can_change_name: boolean;
    next_name_change_date: string | null;
}

type StatusType = "idle" | "loading" | "success" | "error" | "cooldown";

function StatusBanner({ status, message }: { status: StatusType; message: string }) {
    if (status === "idle" || status === "loading") return null;
    const styles: Record<string, string> = {
        success: "border-emerald-800 bg-emerald-950/50 text-emerald-400",
        error: "border-red-800 bg-red-950/50 text-red-400",
        cooldown: "border-amber-800 bg-amber-950/50 text-amber-400",
    };
    const Icon = status === "success" ? CheckCircle2 : status === "cooldown" ? Clock : AlertCircle;
    return (
        <div className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-sm ${styles[status]}`}>
            <Icon className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{message}</span>
        </div>
    );
}

export default function SettingsPage() {
    const { user, setUser } = useUser();
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [displayName, setDisplayName] = useState("");
    const [bio, setBio] = useState("");
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

    const [profileStatus, setProfileStatus] = useState<StatusType>("idle");
    const [profileMessage, setProfileMessage] = useState("");

    const [deleteConfirmText, setDeleteConfirmText] = useState("");
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleteStatus, setDeleteStatus] = useState<StatusType>("idle");
    const [deleteMessage, setDeleteMessage] = useState("");

    const [isPending, startTransition] = useTransition();

    // Fetch real profile data
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await fetch("http://localhost:3001/api/profile", { credentials: "include" });
                if (!res.ok) throw new Error();
                const data: ProfileData = await res.json();
                setProfile(data);
                setDisplayName(data.display_name || "");
                setBio(data.bio ?? "");
                setAvatarUrl(data.avatar_url || null);

            } catch {
                if (user) {
                    setDisplayName(user.display_name || (user.first_name ? `${user.first_name} ${user.last_name || ""}`.trim() : ""));
                }
            }
        };
        if (user) fetchProfile();
    }, [user]);

    // Handle profile picture file selection (convert to base64 data URL for preview; store URL on save)
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) {
            setProfileStatus("error");
            setProfileMessage("Image must be under 2MB.");
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
            setAvatarPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleRemoveAvatar = () => {
        setAvatarPreview(null);
        setAvatarUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    // Save profile changes
    const handleSaveProfile = async () => {
        startTransition(async () => {
            setProfileStatus("loading");
            setProfileMessage("");
            try {
                // Upload avatar if a new one was selected (base64 stored as data URL)
                const finalAvatarUrl = avatarPreview ?? avatarUrl;

                const res = await fetch("http://localhost:3001/api/profile", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({
                        display_name: displayName.trim() || undefined,
                        bio: bio.trim(),
                        avatar_url: finalAvatarUrl,
                    }),
                });
                const data = await res.json();

                if (!res.ok) {
                    setProfileStatus("error");
                    setProfileMessage(data.error || "Failed to save changes.");
                } else if (data.name_change_blocked) {
                    // Bio/avatar were saved, but name change was blocked by cooldown
                    setProfileStatus("cooldown");
                    setProfileMessage(data.error);
                    setAvatarPreview(null);
                    setAvatarUrl(finalAvatarUrl);
                } else {
                    setProfileStatus("success");
                    setProfileMessage("Profile updated successfully!");
                    setAvatarPreview(null);
                    setAvatarUrl(finalAvatarUrl);
                    // Update UserProvider so sidebar refreshes
                    if (user) {
                        setUser({ ...user, display_name: displayName.trim(), avatar_url: finalAvatarUrl } as any);
                    }
                    setTimeout(() => setProfileStatus("idle"), 4000);
                }
            } catch {
                setProfileStatus("error");
                setProfileMessage("An unexpected error occurred.");
            }
        });
    };

    // Delete account
    const handleDeleteAccount = async () => {
        if (deleteConfirmText !== "DELETE") return;
        setDeleteStatus("loading");
        try {
            const res = await fetch("http://localhost:3001/api/profile", {
                method: "DELETE",
                credentials: "include",
            });
            const data = await res.json();
            if (!res.ok) {
                setDeleteStatus("error");
                setDeleteMessage(data.error || "Failed to delete account.");
            } else {
                await authApi.logout().catch(() => {});
                window.location.href = "/";
            }
        } catch {
            setDeleteStatus("error");
            setDeleteMessage("An unexpected error occurred.");
        }
    };

    const displayedAvatar = avatarPreview ?? avatarUrl;
    const initials = (displayName || user?.email || "U").charAt(0).toUpperCase();
    const canChangeName = profile?.can_change_name ?? true;
    const email = profile?.email ?? user?.email ?? "";

    return (
        <div className="space-y-6 max-w-4xl">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground">Manage your account settings and preferences.</p>
            </div>

            <Separator />

            <Tabs defaultValue="profile" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="profile" className="flex items-center gap-2">
                        <User className="h-4 w-4" /> Profile
                    </TabsTrigger>
                    <TabsTrigger value="appearance" className="flex items-center gap-2">
                        <Settings className="h-4 w-4" /> Appearance
                    </TabsTrigger>
                    <TabsTrigger value="account" className="flex items-center gap-2">
                        <Shield className="h-4 w-4" /> Account
                    </TabsTrigger>
                </TabsList>

                {/* PROFILE TAB */}
                <TabsContent value="profile" className="space-y-6">
                    {/* Avatar */}
                    <div className="flex items-center gap-x-6 p-6 border rounded-lg bg-card shadow-sm">
                        <div className="relative">
                            <Avatar className="h-24 w-24 border-2 border-border">
                                {displayedAvatar
                                    ? <AvatarImage src={displayedAvatar} alt="Profile picture" className="object-cover" />
                                    : null}
                                <AvatarFallback className="text-2xl bg-primary/10 text-primary">{initials}</AvatarFallback>
                            </Avatar>
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-base font-medium">Profile Picture</h3>
                            <p className="text-sm text-muted-foreground">JPG or PNG, max 2MB.</p>
                            <div className="flex gap-2">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    className="hidden"
                                    onChange={handleFileChange}
                                    id="avatar-upload"
                                />
                                <Button size="sm" variant="secondary" onClick={() => fileInputRef.current?.click()}>
                                    <Upload className="h-3.5 w-3.5 mr-1.5" />
                                    {displayedAvatar ? "Change" : "Upload"}
                                </Button>
                                {displayedAvatar && (
                                    <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={handleRemoveAvatar}>
                                        <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                                        Remove
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Profile Fields */}
                    <div className="grid gap-5 p-6 border rounded-lg bg-card shadow-sm">
                        {/* Display Name */}
                        <div className="grid gap-1.5">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="name">Display Name</Label>
                                {!canChangeName && profile?.next_name_change_date && (
                                    <span className="flex items-center gap-1 text-xs text-amber-400">
                                        <Clock className="h-3 w-3" />
                                        Next change: {new Date(profile.next_name_change_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                    </span>
                                )}
                            </div>
                            <Input
                                id="name"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                disabled={!canChangeName || isPending}
                                maxLength={50}
                                placeholder="Your display name"
                                className={!canChangeName ? "opacity-60 cursor-not-allowed" : ""}
                            />
                            {!canChangeName && <p className="text-xs text-muted-foreground">Display name can only be changed once every 30 days.</p>}
                        </div>

                        {/* Email */}
                        <div className="grid gap-1.5">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" value={email} disabled className="opacity-60 cursor-not-allowed" />
                            <p className="text-xs text-muted-foreground">Email address cannot be changed.</p>
                        </div>

                        {/* Bio */}
                        <div className="grid gap-1.5">
                            <Label htmlFor="bio">Bio</Label>
                            <Textarea
                                id="bio"
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                disabled={isPending}
                                maxLength={500}
                                rows={3}
                                placeholder="Tell us a little about yourself..."
                            />
                            <p className="text-xs text-muted-foreground text-right">{bio.length}/500</p>
                        </div>

                        <StatusBanner status={profileStatus} message={profileMessage} />

                        <div className="flex justify-end">
                            <Button onClick={handleSaveProfile} disabled={isPending}>
                                {isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</> : "Save Changes"}
                            </Button>
                        </div>
                    </div>
                </TabsContent>

                {/* APPEARANCE TAB */}
                <TabsContent value="appearance" className="space-y-6">
                    <div className="p-6 border rounded-lg bg-card shadow-sm space-y-6">
                        <div>
                            <h3 className="text-lg font-medium">Theme</h3>
                            <p className="text-sm text-muted-foreground">Currently only dark mode is available.</p>
                        </div>
                        <div className="flex gap-4 max-w-xs">
                            <div className="space-y-2 cursor-pointer">
                                <div className="h-24 w-24 rounded-md border-2 border-primary bg-slate-950 p-2 shadow-sm flex items-center justify-center">
                                    <Moon className="h-6 w-6 text-white" />
                                </div>
                                <span className="block text-center text-sm font-medium">Dark</span>
                            </div>
                        </div>
                    </div>
                </TabsContent>

                {/* ACCOUNT TAB */}
                <TabsContent value="account" className="space-y-6">
                    <div className="p-6 border border-destructive/30 rounded-lg bg-destructive/5 shadow-sm space-y-5">
                        <div>
                            <h3 className="text-lg font-semibold text-destructive flex items-center gap-2">
                                <TriangleAlert className="h-5 w-5" />
                                Danger Zone
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">These actions are irreversible. Please proceed with caution.</p>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between gap-4">
                            <div className="space-y-1">
                                <p className="font-medium">Delete Account</p>
                                <p className="text-sm text-muted-foreground">
                                    Permanently deletes your account, all submissions, and all associated data. This cannot be undone.
                                </p>
                            </div>
                            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="destructive" className="shrink-0">
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete Account
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-md">
                                    <DialogHeader>
                                        <DialogTitle className="text-destructive flex items-center gap-2">
                                            <TriangleAlert className="h-5 w-5" />
                                            Delete Account
                                        </DialogTitle>
                                        <DialogDescription>
                                            This will permanently delete your account and remove all your submissions, history, and data from our servers. <strong>This action cannot be undone.</strong>
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-3 py-2">
                                        <Label htmlFor="confirm-delete" className="text-sm">
                                            Type <span className="font-mono font-bold text-destructive">DELETE</span> to confirm
                                        </Label>
                                        <Input
                                            id="confirm-delete"
                                            value={deleteConfirmText}
                                            onChange={(e) => setDeleteConfirmText(e.target.value)}
                                            placeholder="DELETE"
                                            className="font-mono"
                                        />
                                        {deleteStatus === "error" && (
                                            <p className="text-sm text-destructive flex items-center gap-1">
                                                <AlertCircle className="h-3.5 w-3.5" /> {deleteMessage}
                                            </p>
                                        )}
                                    </div>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => { setDeleteDialogOpen(false); setDeleteConfirmText(""); }}>
                                            Cancel
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            onClick={handleDeleteAccount}
                                            disabled={deleteConfirmText !== "DELETE" || deleteStatus === "loading"}
                                        >
                                            {deleteStatus === "loading"
                                                ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Deleting...</>
                                                : "Permanently Delete"}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
