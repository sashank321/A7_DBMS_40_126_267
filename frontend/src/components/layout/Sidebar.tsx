"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Sparkles,
  Search,
  Terminal,
  Network,
  Activity,
  ShieldAlert,
  Database,
  Lock
} from "lucide-react";
import { useAuth } from "@/lib/auth";

export function Sidebar() {
  const { user } = useAuth();
  const isAdmin = user?.role === "Admin" || user?.role === "SUPER_ADMIN";
  const pathname = usePathname();

  const coreNav = [
    { label: "System Overview", href: "/dashboard", icon: LayoutDashboard },
    { label: "Document Explorer", href: "/dashboard/documents", icon: FileText },
    { label: "Grounded RAG Copilot", href: "/dashboard/rag", icon: Sparkles, badge: "Pre-RBAC" },
    { label: "Hybrid Vector Search", href: "/dashboard/search", icon: Search, badge: "384-dim" },
    { label: "Safe Text-to-SQL", href: "/dashboard/text2sql", icon: Terminal, badge: "AST Safe" },
    { label: "Knowledge Graph", href: "/dashboard/graph-view", icon: Network },
    { label: "MongoDB Telemetry", href: "/dashboard/telemetry", icon: Activity, badge: "NoSQL" },
    ...(isAdmin ? [{ label: "Audit & Access Views", href: "/dashboard/audit", icon: ShieldAlert }] : []),
  ];

  return (
    <aside className="w-64 border-r border-ink-black/10 bg-beige-bg/80 backdrop-blur-md flex flex-col justify-between p-4 h-[calc(100vh-4rem)] sticky top-16 select-none font-sans text-ink-black">
      <div className="space-y-6 mt-2">
        <div>
          <div className="mb-3 flex items-center gap-2 font-space text-[10px] uppercase tracking-[0.2em] text-muted pl-2">
            <span className="h-[4px] w-[4px] bg-accent-orange"></span>
            <span>Platform Modules</span>
          </div>
          <nav className="space-y-1">
            {coreNav.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-3 py-2.5 text-[11px] font-space tracking-wider uppercase transition-all rounded ${
                    active
                      ? "bg-ink-black text-beige-bg font-bold border-l-2 border-accent-orange shadow-sm"
                      : "text-muted hover:bg-ink-black/5 hover:text-ink-black border-l-2 border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`h-4 w-4 ${active ? "text-accent-orange" : "text-muted"}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge ? (
                    <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded border ${
                      active ? "bg-accent-orange text-white border-accent-orange" : "border-ink-black/10 text-muted"
                    }`}>
                      {item.badge}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Database & Architecture Summary Card */}
        <div className="p-3 border border-ink-black/10 bg-white/60 rounded-xl space-y-2 text-xs font-space">
          <div className="flex items-center gap-2 text-accent-orange font-bold text-[10px] tracking-wider uppercase">
            <Database className="h-3.5 w-3.5" />
            <span>Polyglot Architecture</span>
          </div>
          <div className="space-y-1 text-[10px] text-muted">
            <div className="flex justify-between">
              <span>PostgreSQL 18.4:</span>
              <span className="font-bold text-ink-black">3NF ACID Core</span>
            </div>
            <div className="flex justify-between">
              <span>MongoDB 8.x:</span>
              <span className="font-bold text-ink-black">Aggregation Feeds</span>
            </div>
            <div className="flex justify-between">
              <span>Embeddings:</span>
              <span className="font-bold text-accent-orange">MiniLM 384-dim</span>
            </div>
          </div>
        </div>
      </div>

      {/* User Context Footer */}
      <div className="border-t border-ink-black/10 pt-3 text-[10px] font-space text-muted flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Lock className="h-3 w-3 text-accent-orange" />
          <span>RBAC: <strong className="text-ink-black">{user?.role || "Admin"}</strong></span>
        </div>
        <span className="px-1.5 py-0.5 bg-green-500/10 border border-green-500/30 text-green-700 font-bold rounded">LIVE</span>
      </div>
    </aside>
  );
}
