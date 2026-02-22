"use client"

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
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";

export function SettingsTabs() {
    return (
        <Tabs defaultValue="account" className="w-full">
            <TabsList className="grid w-full md:w-[400px] grid-cols-2 bg-zinc-900">
                <TabsTrigger value="account" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-100 text-zinc-400">Account</TabsTrigger>
                <TabsTrigger value="password" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-100 text-zinc-400">Password</TabsTrigger>
            </TabsList>

            <TabsContent value="account">
                <Card className="border-zinc-800 bg-zinc-950/50">
                    <CardHeader>
                        <CardTitle className="text-zinc-100">Account Information</CardTitle>
                        <CardDescription className="text-zinc-500">
                            Make changes to your account here. Click save when you're done.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-1">
                            <Label htmlFor="name" className="text-zinc-300">Display Name</Label>
                            <Input id="name" defaultValue="Rohit Patil" className="bg-zinc-900 border-zinc-700 text-zinc-100 focus-visible:ring-zinc-600" />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="email" className="text-zinc-300">Email</Label>
                            <Input id="email" defaultValue="rohit@example.com" disabled className="bg-zinc-900/50 border-zinc-800 text-zinc-500" />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200">Save Changes</Button>
                    </CardFooter>
                </Card>
            </TabsContent>

            <TabsContent value="password">
                <Card className="border-zinc-800 bg-zinc-950/50">
                    <CardHeader>
                        <CardTitle className="text-zinc-100">Password</CardTitle>
                        <CardDescription className="text-zinc-500">
                            Change your password here. After saving, you'll be logged out.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-1">
                            <Label htmlFor="current" className="text-zinc-300">Current Password</Label>
                            <Input id="current" type="password" className="bg-zinc-900 border-zinc-700 text-zinc-100 focus-visible:ring-zinc-600" />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="new" className="text-zinc-300">New Password</Label>
                            <Input id="new" type="password" className="bg-zinc-900 border-zinc-700 text-zinc-100 focus-visible:ring-zinc-600" />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200">Change Password</Button>
                    </CardFooter>
                </Card>
            </TabsContent>
        </Tabs>
    );
}
