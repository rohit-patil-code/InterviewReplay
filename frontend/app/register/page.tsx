"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { OTPInput } from "@/components/ui/otp-input";
import { Loader2, Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api";

type Step = "FORM" | "OTP";

export default function RegisterPage() {
    const router = useRouter();
    const [step, setStep] = useState<Step>("FORM");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!firstName.trim() || !lastName.trim()) {
            setError("First name and last name are required");
            return;
        }

        setIsLoading(true);
        try {
            await authApi.registerSendOtp(email);
            setStep("OTP");
        } catch (err: any) {
            setError(err.response?.data?.error?.email?._errors?.[0] || err.response?.data?.message || "Failed to send OTP. Please try again.");
            if (err.response?.data?.error && typeof err.response.data.error === 'string') {
                setError(err.response.data.error);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        setIsLoading(true);
        try {
            const res = await authApi.registerVerifyOtp(email, otp, firstName, lastName);
            // localStorage.setItem("token", res.data.token);
            // localStorage.setItem("user", JSON.stringify(res.data.user)); // Optional
            router.push("/dashboard"); // Successful registration logs you in
        } catch (err: any) {
            setError(err.response?.data?.error?.otp?._errors?.[0] || err.response?.data?.message || "Invalid OTP. Please try again.");
            if (err.response?.data?.error && typeof err.response.data.error === 'string') {
                setError(err.response.data.error);
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center p-4 bg-muted/40">
            <Card className="w-full max-w-md shadow-lg">
                <CardHeader className="text-center space-y-1">
                    <CardTitle className="text-2xl font-bold tracking-tight">
                        {step === "FORM" ? "Create Account" : "Enter Verification Code"}
                    </CardTitle>
                    <CardDescription>
                        {step === "FORM"
                            ? "Sign up to start practicing"
                            : `We sent a code to ${email}`}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {step === "FORM" ? (
                        <form onSubmit={handleRegister} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="firstName">First Name</Label>
                                <Input
                                    id="firstName"
                                    placeholder="John"
                                    type="text"
                                    required
                                    value={firstName}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                        setFirstName(e.target.value)
                                    }
                                    disabled={isLoading}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="lastName">Last Name</Label>
                                <Input
                                    id="lastName"
                                    placeholder="Doe"
                                    type="text"
                                    required
                                    value={lastName}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                        setLastName(e.target.value)
                                    }
                                    disabled={isLoading}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    placeholder="name@example.com"
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                        setEmail(e.target.value)
                                    }
                                    disabled={isLoading}
                                />
                            </div>

                            {error && <p className="text-sm text-destructive font-medium">{error}</p>}

                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {!isLoading && <Mail className="mr-2 h-4 w-4" />}
                                Send Verification Code
                            </Button>

                            <p className="text-sm text-center text-muted-foreground">
                                Already have an account?{" "}
                                <button
                                    type="button"
                                    onClick={() => router.push("/login")}
                                    className="text-primary hover:underline font-medium cursor-pointer"
                                >
                                    Sign in
                                </button>
                            </p>
                        </form>
                    ) : (
                        <form onSubmit={handleVerifyOtp} className="space-y-6">
                            <div className="space-y-3">
                                <Label className="text-center block text-sm font-medium">Enter 6-digit code</Label>
                                <OTPInput
                                    value={otp}
                                    onChange={setOtp}
                                    disabled={isLoading}
                                    length={6}
                                />
                                <p className="text-xs text-center text-muted-foreground mt-2">
                                    Didn&apos;t receive a code? Check your spam folder
                                </p>
                            </div>

                            {error && <p className="text-sm text-destructive font-medium text-center">{error}</p>}

                            <Button
                                type="submit"
                                className="w-full"
                                disabled={isLoading || otp.length !== 6}
                            >
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {!isLoading && <CheckCircle2 className="mr-2 h-4 w-4" />}
                                Verify & Create Account
                            </Button>

                            <Button
                                variant="ghost"
                                type="button"
                                className="w-full"
                                onClick={() => {
                                    setStep("FORM");
                                    setError("");
                                    setOtp("");
                                }}
                                disabled={isLoading}
                            >
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Registration
                            </Button>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
