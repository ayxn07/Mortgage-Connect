"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { AlertCircle, Loader2, Mail } from "lucide-react";
import Image from "next/image";
import { verifyOTP, resendOTP } from "@/lib/otp-service";
import { useAuth } from "@/lib/auth-context";

export default function VerifyOTPPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const email = searchParams.get("email");
    const { completeSignIn } = useAuth();

    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [countdown, setCountdown] = useState(60);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        if (!email) {
            router.push("/login");
        }
    }, [email, router]);

    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    const handleChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value.slice(-1);
        setOtp(newOtp);
        setError("");

        // Auto-focus next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData("text").slice(0, 6);
        if (!/^\d+$/.test(pastedData)) return;

        const newOtp = [...otp];
        pastedData.split("").forEach((char, i) => {
            if (i < 6) newOtp[i] = char;
        });
        setOtp(newOtp);
        inputRefs.current[Math.min(pastedData.length, 5)]?.focus();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const otpCode = otp.join("");

        if (otpCode.length !== 6) {
            setError("Please enter all 6 digits");
            return;
        }

        setError("");
        setLoading(true);

        try {
            await verifyOTP(email!, otpCode);
            await completeSignIn(email!);
            router.push("/dashboard");
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Invalid OTP. Please try again.";
            setError(message);
            setOtp(["", "", "", "", "", ""]);
            inputRefs.current[0]?.focus();
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (countdown > 0) return;

        setResending(true);
        setError("");

        try {
            await resendOTP(email!);
            setCountdown(60);
            setOtp(["", "", "", "", "", ""]);
            inputRefs.current[0]?.focus();
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to resend OTP. Please try again.";
            setError(message);
        } finally {
            setResending(false);
        }
    };

    if (!email) return null;

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center space-y-2">
                    <div className="mx-auto mb-2 flex items-center justify-center">
                        <Image
                            src="/splash-icon.png"
                            alt="MortgageConnect Logo"
                            width={120}
                            height={120}
                            className="rounded-xl"
                        />
                    </div>
                    <CardTitle className="text-2xl font-bold">Verify Your Email</CardTitle>
                    <CardDescription>
                        We've sent a 6-digit code to <br />
                        <span className="font-medium text-foreground">{email}</span>
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-lg">
                                <AlertCircle className="h-4 w-4 shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        <div className="space-y-4">
                            <div className="flex justify-center gap-2">
                                {otp.map((digit, index) => (
                                    <Input
                                        key={index}
                                        ref={(el) => (inputRefs.current[index] = el)}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={1}
                                        value={digit}
                                        onChange={(e) => handleChange(index, e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(index, e)}
                                        onPaste={handlePaste}
                                        className="w-12 h-12 text-center text-lg font-semibold"
                                        disabled={loading}
                                    />
                                ))}
                            </div>

                            <div className="text-center text-sm text-muted-foreground">
                                {countdown > 0 ? (
                                    <p>Resend code in {countdown}s</p>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={handleResend}
                                        disabled={resending}
                                        className="text-primary hover:underline disabled:opacity-50"
                                    >
                                        {resending ? "Sending..." : "Resend code"}
                                    </button>
                                )}
                            </div>
                        </div>

                        <Button type="submit" className="w-full" disabled={loading || otp.some(d => !d)}>
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    Verifying...
                                </>
                            ) : (
                                "Verify & Continue"
                            )}
                        </Button>

                        <Button
                            type="button"
                            variant="ghost"
                            className="w-full"
                            onClick={() => router.push("/login")}
                            disabled={loading}
                        >
                            Back to Login
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
