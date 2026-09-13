"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Lock, Mail, ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import type { UserRole } from "@/types";

export default function LoginPage() {
  const router = useRouter();
  const { login, quickLogin, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      setIsTransitioning(true);
      await login(email, password);
      router.push("/dashboard");
    } catch (err: any) {
      setIsTransitioning(false);
      setError(err.response?.data?.message || "Invalid email or password");
    }
  };

  const handleDemoLogin = async (role: UserRole) => {
    try {
      setIsTransitioning(true);
      await quickLogin(role);
      router.push("/dashboard");
    } catch (err: any) {
      setIsTransitioning(false);
      setError("Failed to sign in with demo account");
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-beige-bg text-ink-black flex flex-col justify-center items-center p-6 select-none">
      {/* Fullscreen Video Background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 h-full w-full object-cover z-0 opacity-100 pointer-events-none"
      >
        <source
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260314_131748_f2ca2a28-fed7-44c8-b9a9-bd9acdd5ec31.mp4"
          type="video/mp4"
        />
      </video>

      {/* Cinematic Gradient Overlay */}
      

      <div className="relative z-10 w-full max-w-md space-y-6 bg-white/10 backdrop-blur-xl p-8 rounded-3xl border border-white/20 shadow-2xl">
        {/* Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <Link href="/" className="group flex items-center gap-1 text-ink-black">
              <svg className="h-8 w-8 text-accent-orange transition-transform duration-300 group-hover:scale-110 mr-2" viewBox="0 0 32 32" fill="none"><circle cx="6" cy="16" r="4" fill="#E57D25" /><circle cx="26" cy="16" r="4" fill="#E57D25" /><path d="M6 16 C 12 8, 20 24, 26 16" stroke="#E57D25" strokeWidth="2" strokeLinecap="round" /></svg>
              <span
                className="text-4xl tracking-tight text-ink-black transition-opacity group-hover:opacity-90"
                style={{ fontFamily: "'Instrument Serif', serif" }}
              >
                AllocFlow
              </span>
            <sup className="text-xs text-muted-foreground">®</sup>
          </Link>
          <p className="text-xs text-muted-foreground">
            Academic Conference Reviewer Allocation Platform
          </p>
        </div>

        {/* Liquid Glass Form Card */}
        <div className="liquid-glass rounded-2xl p-7 shadow-2xl space-y-5 border border-ink-black/10">
          {error && (
            <div className="rounded-lg bg-rose-500/10 border border-rose-500/30 p-2.5 text-xs text-rose-600 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="font-medium text-ink-black/90">Email Address</label>
              <div className="relative mt-1.5">
                <Mail className="absolute left-3.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="email"
                  required
                  placeholder="admin@allocflow.io"
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
              disabled={isLoading}
              className="w-full liquid-glass rounded-lg py-2.5 text-xs font-semibold text-ink-black transition-transform hover:scale-[1.02] disabled:opacity-50 mt-2"
            >
              {isLoading ? "Signing In..." : "Sign In with Credentials"}
            </button>
          </form>

          {/* Quick Demo Access */}
          <div className="pt-4 border-t border-ink-black/10 space-y-2.5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground text-center">
              Or Instant Demo Role Access:
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleDemoLogin("SUPER_ADMIN")}
                className="rounded-lg border border-ink-black/5 bg-ink-black/[0.03] p-2.5 text-left hover:bg-ink-black/[0.08] hover:border-ink-black/20 transition-all"
              >
                <p className="font-semibold text-ink-black">System Admin</p>
                <p className="text-[10px] text-muted-foreground">Full privileges</p>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin("CONFERENCE_ADMIN")}
                className="rounded-lg border border-ink-black/5 bg-ink-black/[0.03] p-2.5 text-left hover:bg-ink-black/[0.08] hover:border-ink-black/20 transition-all"
              >
                <p className="font-semibold text-ink-black">Conference Chair</p>
                <p className="text-[10px] text-muted-foreground">Manage matching</p>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin("REVIEWER")}
                className="rounded-lg border border-ink-black/5 bg-ink-black/[0.03] p-2.5 text-left hover:bg-ink-black/[0.08] hover:border-ink-black/20 transition-all"
              >
                <p className="font-semibold text-ink-black">PC Reviewer</p>
                <p className="text-[10px] text-muted-foreground">Reviewer profile</p>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin("AUTHOR")}
                className="rounded-lg border border-ink-black/5 bg-ink-black/[0.03] p-2.5 text-left hover:bg-ink-black/[0.08] hover:border-ink-black/20 transition-all"
              >
                <p className="font-semibold text-ink-black">Author</p>
                <p className="text-[10px] text-muted-foreground">Submit papers</p>
              </button>
            </div>
          </div>
        </div>

        {/* Back Link */}
        <div className="text-center">
          <Link href="/" className="text-xs text-muted-foreground hover:text-ink-black transition-colors">
            &larr; Back to AllocFlow Home
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
            <svg className="absolute inset-0 h-full w-full animate-spin text-accent-orange/20" viewBox="0 0 32 32" fill="none">
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
              Establishing secure session...
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}