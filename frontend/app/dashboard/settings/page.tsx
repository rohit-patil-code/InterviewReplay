"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    User,
    Settings,
    Moon,
    Sun,
    Laptop,
    Shield,
    LogOut
} from "lucide-react";

export default function SettingsPage() {
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
                        <User className="h-4 w-4" />
                        Profile
                    </TabsTrigger>
                    <TabsTrigger value="appearance" className="flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        Appearance
                    </TabsTrigger>
                    <TabsTrigger value="account" className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Account
                    </TabsTrigger>
                </TabsList>

                {/* PROFILE TAB */}
                <TabsContent value="profile" className="space-y-6">
                    <div className="flex items-center gap-x-8 p-6 border rounded-lg bg-card text-card-foreground shadow-sm">
                        <Avatar className="h-24 w-24">
                            <AvatarImage src="/placeholder-user.jpg" alt="Avatar" />
                            <AvatarFallback className="text-xl">JD</AvatarFallback>
                        </Avatar>
                        <div className="space-y-2">
                            <h3 className="text-lg font-medium">Profile Picture</h3>
                            <div className="flex gap-2">
                                <Button size="sm" variant="secondary">Change</Button>
                                <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10">Remove</Button>
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-6 p-6 border rounded-lg bg-card text-card-foreground shadow-sm">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Display Name</Label>
                            <Input id="name" defaultValue="John Doe" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" defaultValue="john@example.com" type="email" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="bio">Bio</Label>
                            <Input id="bio" placeholder="Tell us a little about yourself" />
                        </div>
                        <div className="flex justify-end">
                            <Button>Save Changes</Button>
                        </div>
                    </div>
                </TabsContent>

                {/* APPEARANCE TAB */}
                <TabsContent value="appearance" className="space-y-6">
                    <div className="p-6 border rounded-lg bg-card text-card-foreground shadow-sm space-y-6">
                        <div>
                            <h3 className="text-lg font-medium">Theme</h3>
                            <p className="text-sm text-muted-foreground">Customize the look and feel of the application.</p>
                        </div>
                        <div className="grid grid-cols-3 gap-4 max-w-lg">
                            <div className="space-y-2 cursor-pointer">
                                <div className="h-24 rounded-md border-2 border-primary bg-background p-2 shadow-sm flex items-center justify-center">
                                    <Sun className="h-6 w-6 text-primary" />
                                </div>
                                <span className="block text-center text-sm font-medium">Light</span>
                            </div>
                            <div className="space-y-2 cursor-pointer opacity-50 hover:opacity-100 transition-opacity">
                                <div className="h-24 rounded-md border border-muted bg-slate-950 p-2 shadow-sm flex items-center justify-center">
                                    <Moon className="h-6 w-6 text-white" />
                                </div>
                                <span className="block text-center text-sm font-medium">Dark</span>
                            </div>
                            <div className="space-y-2 cursor-pointer opacity-50 hover:opacity-100 transition-opacity">
                                <div className="h-24 rounded-md border border-muted bg-slate-900 p-2 shadow-sm flex items-center justify-center">
                                    <Laptop className="h-6 w-6 text-white" />
                                </div>
                                <span className="block text-center text-sm font-medium">System</span>
                            </div>
                        </div>
                    </div>
                </TabsContent>

                {/* ACCOUNT TAB */}
                <TabsContent value="account" className="space-y-6">
                    <div className="p-6 border rounded-lg bg-card text-card-foreground shadow-sm space-y-6">
                        <div>
                            <h3 className="text-lg font-medium text-destructive">Danger Zone</h3>
                            <p className="text-sm text-muted-foreground">Irreversible and destructive actions.</p>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="font-medium">Delete Account</p>
                                <p className="text-sm text-muted-foreground">Permanently delete your account and all of your content.</p>
                            </div>
                            <Button variant="destructive">Delete Account</Button>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
