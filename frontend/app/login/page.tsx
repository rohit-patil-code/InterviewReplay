"use client";

import { useTransition, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2, Mail, ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useUser } from "@/components/providers/UserProvider";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api";
import { OTPInput } from "@/components/ui/otp-input";
import { useGoogleLogin } from "@react-oauth/google";

function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
            <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
            />
            <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
            />
            <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
            />
            <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
            />
        </svg>
    );
}

export default function LoginPage() {
    const router = useRouter();
    const { refreshUser } = useUser();
    const [step, setStep] = useState<"EMAIL" | "OTP">("EMAIL");
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");

    const [isGoogleLoading, startGoogleTransition] = useTransition();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const loginWithGoogle = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            setError("");
            startGoogleTransition(async () => {
                try {
                    // Send access_token instead of credential
                    await authApi.googleLogin(tokenResponse.access_token);
                    await refreshUser();
                    router.push("/dashboard");
                } catch (err: any) {
                    console.error("Google login API error:", err);
                    setError(err.response?.data?.message || err.response?.data?.error || "Google sign-in failed on our servers.");
                }
            });
        },
        onError: () => {
            setError("Google sign-in failed or was cancelled.");
        }
    });

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);
        try {
            await authApi.loginSendOtp(email);
            setStep("OTP");
        } catch (err: any) {
            console.log("FULL ERROR:", err.response?.data);
            setError(err.response?.data?.error?.userId?._errors?.[0] || err.response?.data?.error?.email?._errors?.[0] || err.response?.data?.message || "Failed to send OTP. Please try again.");
            // Also check for raw messages if formatted differently
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
            const res = await authApi.loginVerifyOtp(email, otp);
            await refreshUser();
            router.push("/dashboard");
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
                        {step === "EMAIL" ? "Welcome back" : "Enter Verification Code"}
                    </CardTitle>
                    <CardDescription>
                        {step === "EMAIL"
                            ? "Sign in to your account to continue practicing"
                            : `We sent a code to ${email}`}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">

                    <Button
                        variant="outline"
                        className="w-full h-11 relative"
                        onClick={() => loginWithGoogle()}
                        disabled={isGoogleLoading || isLoading}
                    >
                        {isGoogleLoading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <GoogleIcon className="mr-2 h-4 w-4" />
                        )}
                        Sign in with Google
                    </Button>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">Or continue with email</span>
                        </div>
                    </div>



                    {step === "EMAIL" ? (
                        <form onSubmit={handleSendOtp} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    placeholder="name@example.com"
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={isLoading || isGoogleLoading}
                                />
                            </div>
                            {error && <p className="text-sm text-destructive font-medium">{error}</p>}

                            <Button type="submit" className="w-full" disabled={isLoading || isGoogleLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {!isLoading && <Mail className="mr-2 h-4 w-4" />}
                                Send Login Code
                            </Button>
                            <p className="text-sm text-center text-muted-foreground">
                                Don&apos;t have an account?{" "}
                                <button
                                    type="button"
                                    onClick={() => router.push("/register")}
                                    className="text-primary hover:underline font-medium cursor-pointer"
                                >
                                    Sign up
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
                                Verify & Login
                            </Button>

                            <Button
                                variant="ghost"
                                type="button"
                                className="w-full"
                                onClick={() => { setStep("EMAIL"); setError(""); setOtp(""); }}
                                disabled={isLoading}
                            >
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Email
                            </Button>
                        </form>
                    )}

                </CardContent>
            </Card>
        </div>
    );
}
