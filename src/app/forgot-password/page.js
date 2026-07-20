"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import { Phone, KeyRound, Cpu, ArrowLeft, LockKeyhole } from "lucide-react";
import Link from "next/link";
import { fetchApi } from "@/lib/api";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { digitsOnly, getPasswordError, getPhoneError } from "@/lib/validation";

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [step, setStep] = useState(1); // 1: Phone, 2: OTP, 3: New Password
    const [phoneNumber, setPhoneNumber] = useState("");
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    const handleSendOtp = async (e) => {
        e.preventDefault();
        setErrorMsg("");
        setSuccessMsg("");

        const phoneError = getPhoneError(phoneNumber);
        if (phoneError) {
            setErrorMsg(phoneError);
            return;
        }

        setIsLoading(true);

        const data = await fetchApi("/auth/send-reset-otp", {
            method: "POST",
            body: JSON.stringify({ phoneNumber })
        });

        if (data.success) {
            setSuccessMsg(data.message);
            setStep(2);
        } else {
            setErrorMsg(data.message);
        }
        setIsLoading(false);
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        if (otp.length !== 6) {
            setErrorMsg("Please enter a valid 6-digit OTP.");
            return;
        }

        setErrorMsg("");
        setSuccessMsg("");
        setIsLoading(true);

        const data = await fetchApi("/auth/verify-reset-otp", {
            method: "POST",
            body: JSON.stringify({ phoneNumber, otp })
        });

        if (data.success) {
            setStep(3);
            setSuccessMsg("OTP verified. Please enter your new password.");
        } else {
            setErrorMsg(data.message);
        }
        setIsLoading(false);
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setErrorMsg("");
        setSuccessMsg("");

        const passwordError = getPasswordError(newPassword, { required: true });
        if (passwordError) {
            setErrorMsg(passwordError);
            return;
        }

        if (newPassword !== confirmPassword) {
            setErrorMsg("Passwords do not match!");
            return;
        }

        setIsLoading(true);

        const data = await fetchApi("/auth/reset-password", {
            method: "POST",
            body: JSON.stringify({ phoneNumber, otp, newPassword })
        });

        if (data.success) {
            setSuccessMsg(data.message);
            setPhoneNumber("");
            setOtp("");
            setNewPassword("");
            setConfirmPassword("");

            toast.success("Password reset successfully!");

            // Auto redirect to login page after 1.5s
            setTimeout(() => {
                router.push("/login");
            }, 1500);
        } else {
            setErrorMsg(data.message);
        }
        setIsLoading(false);
    };

    const handleResendOtp = async () => {
        setErrorMsg("");
        setSuccessMsg("");

        const phoneError = getPhoneError(phoneNumber);
        if (phoneError) {
            setErrorMsg(phoneError);
            return;
        }

        setIsLoading(true);
        const data = await fetchApi("/auth/send-reset-otp", {
            method: "POST",
            body: JSON.stringify({ phoneNumber })
        });

        if (data.success) {
            setSuccessMsg("A new OTP has been sent to your phone.");
        } else {
            setErrorMsg(data.message);
        }
        setIsLoading(false);
    };

    return (
        <main className="min-h-screen flex relative">
            {/* Left side - Decorative / Branding */}
            <div className="hidden lg:flex flex-col justify-between w-1/2 bg-foreground text-white p-12 relative overflow-hidden">
                {/* Background gradient effects */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                    <div className="absolute -top-1/4 -left-1/4 w-[800px] h-[800px] bg-primary/40 rounded-full blur-[100px] animate-pulse"></div>
                    <div className="absolute -bottom-1/4 -right-1/4 w-[600px] h-[600px] bg-secondary/20 rounded-full blur-[100px]"></div>
                </div>

                <div className="relative z-10">
                    <Link href="/home" className="flex items-center gap-2 w-max group">
                        <Cpu className="w-8 h-8 text-primary group-hover:text-secondary transition-colors" />
                        <span className="font-bold text-2xl tracking-tight">Techno-Hub</span>
                    </Link>
                </div>

                <div className="relative z-10 max-w-lg">
                    <h1 className="text-5xl font-bold leading-tight mb-6">
                        <span className="text-primary">Recover</span> your account.
                    </h1>
                    <p className="text-lg text-white/80 leading-relaxed mb-8">
                        Don't worry, we'll help you get back to your learning journey in no time. Follow the simple steps to securely reset your password.
                    </p>
                </div>

                <div className="relative z-10 text-sm text-white/60">
                    © {new Date().getFullYear()} Techno-Hub. All rights reserved.
                </div>
            </div>

            {/* Right side - Form */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 sm:p-12 bg-white dark:bg-[#1e293b] relative overflow-y-auto">
                <Link href="/home" className="lg:hidden absolute top-6 left-6 flex items-center gap-2">
                    <Cpu className="w-6 h-6 text-primary" />
                </Link>

                <div className="w-full max-w-md my-auto">
                    <div className="mb-10 text-center lg:text-left mt-10 lg:mt-0">
                        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
                            {step === 1 && "Forgot Password?"}
                            {step === 2 && "Verify your phone"}
                            {step === 3 && "Create New Password"}
                        </h2>
                        <p className="text-zinc-500">
                            {step === 1 && "Enter your registered phone number to receive a reset code."}
                            {step === 2 && `Enter the 6-digit code sent to ${phoneNumber}`}
                            {step === 3 && "Please enter your new password."}
                        </p>
                    </div>

                    {errorMsg && <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 dark:border-red-900/50 text-red-600 text-sm font-medium">{errorMsg}</div>}
                    {successMsg && <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-200 dark:border-green-900/50 text-green-600 text-sm font-medium">{successMsg}</div>}

                    <div className="space-y-5">
                        {step === 1 && (
                            <form onSubmit={handleSendOtp} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-medium mb-2 text-foreground">Phone Number</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <Phone className="h-5 w-5 text-zinc-400" />
                                        </div>
                                        <input
                                            type="tel"
                                            value={phoneNumber}
                                            onChange={(e) => setPhoneNumber(digitsOnly(e.target.value))}
                                            inputMode="numeric"
                                            pattern="[0-9]*"
                                            className="w-full pl-12 pr-4 py-3 rounded-xl border border-black/10 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary dark:bg-[#0f172a] transition-all bg-zinc-50/50"
                                            placeholder="07x xxx xxxx"
                                            required
                                        />
                                    </div>
                                </div>
                                <Button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full py-6 text-lg rounded-xl shadow-[0_4px_14px_0_rgba(26,60,182,0.39)]"
                                >
                                    {isLoading ? "Sending Code..." : "Send Verification Code"}
                                </Button>
                            </form>
                        )}

                        {step === 2 && (
                            <form onSubmit={handleVerifyOtp} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-medium mb-2 text-foreground text-center">Verification Code</label>
                                    <div className="relative max-w-[240px] mx-auto">
                                        <input
                                            type="text"
                                            value={otp}
                                            onChange={(e) => setOtp(digitsOnly(e.target.value).slice(0, 6))}
                                            inputMode="numeric"
                                            pattern="[0-9]*"
                                            className="w-full px-4 py-4 text-center text-2xl tracking-widest rounded-xl border border-black/10 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary dark:bg-[#0f172a] transition-all bg-zinc-50/50"
                                            placeholder="------"
                                            maxLength={6}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="text-center">
                                    <button
                                        type="button"
                                        onClick={handleResendOtp}
                                        disabled={isLoading}
                                        className="text-sm font-medium text-primary hover:text-secondary transition-colors"
                                    >
                                        Didn't receive a code? Resend
                                    </button>
                                </div>

                                <div className="text-center pt-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setStep(1);
                                            setSuccessMsg("");
                                            setErrorMsg("");
                                        }}
                                        className="text-sm text-zinc-500 hover:text-foreground transition-colors"
                                    >
                                        Change phone number
                                    </button>
                                </div>

                                <Button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full py-6 text-lg rounded-xl shadow-[0_4px_14px_0_rgba(26,60,182,0.39)]"
                                >
                                    {isLoading ? "Verifying..." : "Verify Code"}
                                </Button>
                            </form>
                        )}

                        {step === 3 && (
                            <form onSubmit={handleResetPassword} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-medium mb-2 text-foreground">New Password</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <LockKeyhole className="h-5 w-5 text-zinc-400" />
                                        </div>
                                        <input
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="w-full pl-12 pr-4 py-3 rounded-xl border border-black/10 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary dark:bg-[#0f172a] transition-all bg-zinc-50/50"
                                            placeholder="••••••••"
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2 text-foreground">Confirm New Password</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <LockKeyhole className="h-5 w-5 text-zinc-400" />
                                        </div>
                                        <input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full pl-12 pr-4 py-3 rounded-xl border border-black/10 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary dark:bg-[#0f172a] transition-all bg-zinc-50/50"
                                            placeholder="••••••••"
                                            required
                                        />
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full py-6 text-lg rounded-xl shadow-[0_4px_14px_0_rgba(26,60,182,0.39)]"
                                >
                                    {isLoading ? "Resetting..." : "Reset Password"}
                                </Button>
                            </form>
                        )}
                    </div>

                    <div className="mt-8 pt-8 border-t border-black/5 text-center">
                        <p className="text-sm text-zinc-600">
                            Remembered your password? <Link href="/login" className="font-semibold text-primary hover:text-secondary transition-colors">Sign in</Link>
                        </p>
                    </div>

                    <div className="mt-8 text-center lg:text-left pb-10 lg:pb-0">
                        <Link href="/home" className="text-sm font-medium text-zinc-500 hover:text-foreground transition-colors inline-flex items-center gap-2 group">
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to home
                        </Link>
                    </div>
                </div>
            </div>
        </main>
    );
}
