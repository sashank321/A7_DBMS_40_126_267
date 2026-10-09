"use client";

import { usePlatform, useDemoAccounts } from "@/lib/platform";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { LogOut, Database, Shield, BrainCircuit } from "lucide-react";
import { BackendStatusPill } from "./BackendStatusPill";

export function Navbar() {
  const platform = usePlatform();
  const demoAccounts = useDemoAccounts();
  const { user, logout, quickLogin, isAuthenticated } = useAuth();
  const pathname = usePathname();
  const [roleError, setRoleError] = React.useState<string | null>(null);

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-ink-black/10 bg-beige-bg/90 px-3 sm:px-6 backdrop-blur-md text-ink-black font-sans">
      {/* Brand & Database Badge */}
      <div className="flex items-center gap-2 xl:gap-6 min-w-0">
        <Link href="/dashboard" aria-label="KnowledgeSphere dashboard" className="flex items-center gap-2.5 group">
          <div className="h-8 w-8 rounded-lg bg-ink-black flex items-center justify-center text-accent-orange shadow-md group-hover:scale-105 transition-transform">
            <BrainCircuit className="h-5 w-5" />
          </div>
          <span className="hidden sm:inline font-heading text-2xl font-bold tracking-tight text-ink-black">
            Knowledge<span className="text-accent-orange font-normal italic">Sphere</span>
          </span>
          <span className="hidden xl:inline ml-1 px-2 py-0.5 text-[9px] font-mono font-bold tracking-wider text-accent-orange border border-accent-orange/30 bg-accent-orange/10 uppercase">
            AI Platform
          </span>
        </Link>

        <div className="hidden 2xl:flex items-center gap-2 px-3 py-1 font-space text-xs text-muted border-l border-ink-black/10">
          <Database className="h-3.5 w-3.5 text-accent-orange" />
          <span className="font-bold text-ink-black uppercase tracking-widest">{platform.pgLabel} + {platform.mongoLabel}</span>
          <span className="text-[10px] opacity-60">{"// POLYGLOT"}</span>
        </div>
      </div>

      {/* Mode Indicator & Quick Action Pills */}
      <div className="flex items-center gap-2 lg:gap-4">
        {roleError && <span role="alert" className="text-xs text-red-700">{roleError}</span>}
        <BackendStatusPill />

        {/* Active Role Indicator (Read-Only) */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 text-xs font-space border border-ink-black/10 bg-ink-black/5 rounded-md">
          <Shield className="h-3.5 w-3.5 text-accent-orange" />
          <span className="text-[10px] uppercase text-muted tracking-widest font-bold">Role:</span>
          <span className="text-[10px] font-mono font-bold uppercase text-ink-black px-1.5 py-0.5 bg-ink-black/10 rounded">
            {user?.role || "User"}
          </span>
        </div>

        {/* User Profile & Logout */}
        {isAuthenticated ? (
          <div className="flex items-center gap-3 pl-2 border-l border-ink-black/10">
            <div className="hidden lg:block text-right font-space">
              <p className="text-[11px] font-bold uppercase text-ink-black">{user?.fullName}</p>
              <p className="text-[9px] text-muted tracking-widest">
                <span className="font-bold text-accent-orange">[{user?.role}]</span> {user?.email}
              </p>
            </div>
            <button
              onClick={logout}
              className="flex h-8 w-8 items-center justify-center border border-ink-black/10 text-muted hover:bg-ink-black/10 hover:text-ink-black transition-colors rounded"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : null}
      </div>
    </header>
  );
}
