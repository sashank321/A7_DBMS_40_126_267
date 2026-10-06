"use client";

import { usePlatform, useDemoAccounts } from "@/lib/platform";
import { apiErrorMessage } from "@/lib/utils";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Lock, Mail, ArrowRight, ShieldCheck, KeyRound, RotateCw, ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const demoAccounts = useDemoAccounts();
  const router = useRouter();
  const { requestOTP, verifyOTP, resendOTP, quickLogin, isLoading } = useAuth();

  // Login Stage: "credentials" -> "otp"
  const [step, setStep] = useState<"credentials" | "otp">("credentials");

  // Form Fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");

  // OTP State & Timers
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(300);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [infoMessage, setInfoMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const otpInputRef = useRef<HTMLInputElement>(null);

  // Countdown timer for OTP expiration
  useEffect(() => {
    if (step !== "otp") return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [step]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const cooldown = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(cooldown);
  }, [resendCooldown]);

  // Focus OTP input on step change
  useEffect(() => {
    if (step === "otp") {
      setTimeout(() => otpInputRef.current?.focus(), 150);
    }
  }, [step]);

  // Step 1: Request OTP with credentials
  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInfoMessage("");
    setIsSubmitting(true);

    try {
      const res = await requestOTP(email, password);
      setStep("otp");
      setTimeLeft(res.expires_in_seconds || 300);
      setResendCooldown(30);
      if (res.dev_otp) {
        setDevOtp(res.dev_otp);
      }
      setInfoMessage("Verification code has been dispatched!");
    } catch (err: any) {
      setError(apiErrorMessage(err, "Sign-in failed. Check your credentials and service connection."));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2: Verify OTP
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.trim().length !== 6) {
      setError("Please enter the complete 6-digit verification code.");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      setIsTransitioning(true);
      await verifyOTP(email, otp.trim());
      router.push("/dashboard");
    } catch (err: any) {
      setIsTransitioning(false);
      setIsSubmitting(false);
      setError(apiErrorMessage(err, "Invalid or expired verification code. Please try again."));
    }
  };

  // Resend OTP
  const handleResend = async () => {
    if (resendCooldown > 0 || isSubmitting) return;
    setError("");
    setInfoMessage("");
    setIsSubmitting(true);

    try {
      const res = await resendOTP(email);
      setTimeLeft(res.expires_in_seconds || 300);
      setResendCooldown(30);
      if (res.dev_otp) {
        setDevOtp(res.dev_otp);
      }
      setInfoMessage("A fresh verification code has been dispatched!");
    } catch (err: any) {
      setError(apiErrorMessage(err, "Failed to resend code. Please try again."));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Demo Account Quick Select
  const handleDemoSelect = async (accountEmail: string, roleName: string) => {
    const demoPassword = process.env.NEXT_PUBLIC_DEMO_PASSWORD || "password123";
    setEmail(accountEmail);
    setPassword(demoPassword);
    setError("");
    setInfoMessage("");
    setIsSubmitting(true);

    try {
      const res = await requestOTP(accountEmail, demoPassword);
      setStep("otp");
      setTimeLeft(res.expires_in_seconds || 300);
      setResendCooldown(30);
      if (res.dev_otp) {
        setDevOtp(res.dev_otp);
      }
      setInfoMessage(`Selected ${roleName} account. Verification code generated.`);
    } catch (err: any) {
      setError("Failed to initialize verification for demo account.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-beige-bg text-ink-black flex flex-col justify-center items-center p-6 select-none">
      {/* Background Video */}
      {process.env.NEXT_PUBLIC_LOGIN_VIDEO_URL && (
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 h-full w-full object-cover z-0 opacity-100 pointer-events-none"
        >
          <source src={process.env.NEXT_PUBLIC_LOGIN_VIDEO_URL} type="video/mp4" />
        </video>
      )}

      <div className="relative z-10 w-full max-w-md space-y-6 bg-white/10 backdrop-blur-xl p-8 rounded-3xl border border-white/20 shadow-2xl">
        {/* Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <Link href="/" className="group flex items-center gap-1 text-ink-black">
            <svg
              className="h-8 w-8 text-accent-orange transition-transform duration-300 group-hover:scale-110 mr-2"
              viewBox="0 0 32 32"
              fill="none"
            >
              <circle cx="6" cy="16" r="4" fill="#E57D25" />
              <circle cx="26" cy="16" r="4" fill="#E57D25" />
              <path d="M6 16 C 12 8, 20 24, 26 16" stroke="#E57D25" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span className="text-3xl font-bold tracking-tight text-ink-black transition-opacity group-hover:opacity-90 font-mono">
              KnowledgeSphere<span className="text-accent-orange font-normal">.AI</span>
            </span>
          </Link>
          <p className="text-xs text-muted-foreground">
            Enterprise Knowledge Intelligence Platform
          </p>
        </div>

        {/* Liquid Glass Form Card */}
        <div className="liquid-glass rounded-2xl p-7 shadow-2xl space-y-5 border border-ink-black/10">
          {/* Status Banners */}
          {error && (
            <div className="rounded-lg bg-rose-500/10 border border-rose-500/30 p-2.5 text-xs text-rose-600 font-medium">
              {error}
            </div>
          )}

          {infoMessage && (
            <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-2.5 text-xs text-emerald-700 font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>{infoMessage}</span>
            </div>
          )}

          {/* STEP 1: CREDENTIALS */}
          {step === "credentials" && (
            <form onSubmit={handleCredentialsSubmit} className="space-y-4 text-xs">
              <div className="flex items-center justify-between pb-1">
                <span className="font-semibold text-ink-black/80 flex items-center gap-1.5">
                  <KeyRound className="h-3.5 w-3.5 text-accent-orange" />
                  Step 1: Sign-In Credentials
                </span>
                <span className="text-[10px] bg-accent-orange/10 text-accent-orange font-mono px-2 py-0.5 rounded-full font-medium">
                  2FA Protected
                </span>
              </div>

              <div>
                <label className="font-medium text-ink-black/90">Email Address</label>
                <div className="relative mt-1.5">
                  <Mail className="absolute left-3.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border border-ink-black/10 bg-ink-black/[0.04] py-2.5 pl-10 pr-3 text-xs text-ink-black placeholder:text-muted-foreground focus:border-ink-black/30 focus:outline-none backdrop-blur-md"
                  />
                </div>
              </div>

              <div>
                <label className="font-medium text-ink-black/90">Password</label>
                <div className="relative mt-1.5">
                  <Lock className="absolute left-3.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-lg border border-ink-black/10 bg-ink-black/[0.04] py-2.5 pl-10 pr-3 text-xs text-ink-black placeholder:text-muted-foreground focus:border-ink-black/30 focus:outline-none backdrop-blur-md"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || isLoading}
                className="w-full liquid-glass rounded-lg py-2.5 text-xs font-semibold text-ink-black transition-transform hover:scale-[1.02] disabled:opacity-50 mt-2 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  "Verifying Credentials..."
                ) : (
                  <>
                    Continue to OTP Verification
                    <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* STEP 2: TWO-FACTOR OTP VERIFICATION */}
          {step === "otp" && (
            <form onSubmit={handleOtpSubmit} className="space-y-4 text-xs">
              <div className="flex items-center justify-between pb-1 border-b border-ink-black/10">
                <button
                  type="button"
                  onClick={() => {
                    setStep("credentials");
                    setOtp("");
                    setError("");
                  }}
                  className="text-muted-foreground hover:text-ink-black flex items-center gap-1 text-[11px] font-mono transition-colors"
                >
                  <ArrowLeft className="h-3 w-3" />
                  Back
                </button>
                <span className="font-semibold text-ink-black/90 flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-accent-orange" />
                  Two-Factor Authentication
                </span>
              </div>

              <div>
                <p className="text-muted-foreground text-center text-[11px] mb-2">
                  Enter the 6-digit verification code dispatched via Telegram / notification for <strong className="text-ink-black">{email}</strong>
                </p>

                {/* 6-Digit Monospace Input */}
                <div className="relative mt-2">
                  <input
                    ref={otpInputRef}
                    type="text"
                    required
                    maxLength={6}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="000000"
                    value={otp}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                      setOtp(val);
                    }}
                    className="w-full text-center tracking-[0.5em] font-mono text-xl font-bold py-3 rounded-lg border border-ink-black/20 bg-ink-black/[0.04] text-ink-black placeholder:text-muted-foreground/30 focus:border-accent-orange focus:outline-none focus:ring-1 focus:ring-accent-orange backdrop-blur-md"
                  />
                </div>
              </div>

              {/* Expiration Timer & Resend Controls */}
              <div className="flex items-center justify-between text-[11px] pt-1">
                <span className={`font-mono ${timeLeft < 60 ? "text-rose-600 font-bold" : "text-muted-foreground"}`}>
                  Expires in {formatTime(timeLeft)}
                </span>

                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendCooldown > 0 || isSubmitting}
                  className="text-accent-orange hover:underline disabled:opacity-40 disabled:no-underline font-medium flex items-center gap-1"
                >
                  <RotateCw className="h-3 w-3" />
                  {resendCooldown > 0 ? `Resend (${resendCooldown}s)` : "Resend Code"}
                </button>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || otp.length !== 6 || timeLeft === 0}
                className="w-full liquid-glass rounded-lg py-2.5 text-xs font-semibold text-ink-black transition-transform hover:scale-[1.02] disabled:opacity-50 mt-2 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  "Verifying Code..."
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    Verify & Access Dashboard
                  </>
                )}
              </button>
            </form>
          )}

          {/* Quick Demo Access (Step 1 only) */}
          {step === "credentials" && demoAccounts.length > 0 && (
            <div className="pt-4 border-t border-ink-black/10 space-y-2.5">
              <p className="text-xs text-center text-muted">Demo account access (with 2FA verification)</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {demoAccounts.map((account) => (
                  <button
                    key={account.email}
                    type="button"
                    disabled={isSubmitting || isLoading}
                    onClick={() => handleDemoSelect(account.email, account.role)}
                    className="rounded-lg border border-ink-black/10 p-2.5 text-left hover:border-accent-orange/40 transition-colors bg-white/5"
                  >
                    <p className="font-bold flex items-center justify-between">
                      {account.role}
                      <span className="text-[9px] text-accent-orange font-mono">2FA</span>
                    </p>
                    <p className="text-muted text-[10px] truncate">
                      {account.name} · {account.department_name}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Back Link */}
        <div className="text-center">
          <Link
            href="/"
            className="text-xs text-muted-foreground hover:text-ink-black transition-colors font-mono"
          >
            &larr; Back to KnowledgeSphere Home
          </Link>
        </div>
      </div>

      {/* Cinematic Transition Overlay */}
      <div
        className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-beige-bg transition-all duration-700 ease-in-out ${
          isTransitioning ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="flex flex-col items-center space-y-6">
          <div className="relative flex h-16 w-16 items-center justify-center">
            <svg
              className="absolute inset-0 h-full w-full animate-spin text-accent-orange/20"
              viewBox="0 0 32 32"
              fill="none"
            >
              <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="2" strokeDasharray="60 20" />
            </svg>
            <svg className="h-8 w-8 text-accent-orange animate-pulse" viewBox="0 0 32 32" fill="none">
              <circle cx="6" cy="16" r="4" fill="#E57D25" />
              <circle cx="26" cy="16" r="4" fill="#E57D25" />
              <path d="M6 16 C 12 8, 20 24, 26 16" stroke="#E57D25" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <div className="flex flex-col items-center">
            <span className="font-space text-[10px] font-bold uppercase tracking-[0.3em] text-ink-black animate-pulse">
              Authenticating
            </span>
            <span className="mt-1 font-body text-xs text-muted-foreground opacity-60">
              Establishing secure 2FA session...
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}