"use client";

import { updateProfile } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";

export default function OnboardingPage() {
    return (
        <div className="flex min-h-screen items-center justify-center p-4 bg-muted/40">
            <Card className="w-full max-w-md shadow-lg">
                <CardHeader className="text-center space-y-1">
                    <CardTitle className="text-2xl font-bold tracking-tight">Complete Profile</CardTitle>
                    <CardDescription>
                        Just a few more details before you start.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={updateProfile} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="fullName">Full Name</Label>
                            <Input
                                id="fullName"
                                name="fullName"
                                placeholder="John Doe"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="portfolioUrl">Portfolio URL (Optional)</Label>
                            <Input
                                id="portfolioUrl"
                                name="portfolioUrl"
                                placeholder="https://github.com/johndoe"
                                type="url"
                            />
                        </div>

                        <Button type="submit" className="w-full">
                            Get Started
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
