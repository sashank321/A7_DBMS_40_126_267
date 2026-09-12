"use client";

import React, { useEffect, useState } from "react";
import { api, apiClient } from "@/lib/api";
import { Server, Activity, ShieldCheck, AlertCircle } from "lucide-react";

type HealthStatus = "connected" | "connecting" | "failed";

export function BackendStatusPill() {
  const [status, setStatus] = useState<HealthStatus>("connecting");
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [backendType, setBackendType] = useState<string>("Spring Boot 3 / DSA Engine");

  const checkHealth = async () => {
    const startTime = performance.now();
    try {
      // Test basic endpoint
      await apiClient.get("/conferences", { timeout: 15000 });
      const elapsed = Math.round(performance.now() - startTime);
      setLatencyMs(elapsed);
      setStatus("connected");
      setBackendType("Spring Boot 3 Engine");
    } catch (err: any) {
      // If error occurs, check if it's fallback or offline
      setStatus("failed");
      setLatencyMs(null);
    }
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative group flex items-center">
      <div
        className={`flex items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] font-mono transition-all backdrop-blur-md ${
          status === "connected"
            ? "border-emerald-500/30 bg-emerald-950/20 text-emerald-300"
            : status === "connecting"
            ? "border-amber-500/30 bg-amber-950/20 text-amber-300"
            : "border-rose-500/30 bg-rose-950/20 text-rose-300"
        }`}
      >
        {/* Status Dot */}
        <span className="relative flex h-2 w-2">
          {status === "connected" && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          )}
          {status === "connecting" && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
          )}
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${
              status === "connected"
                ? "bg-emerald-400"
                : status === "connecting"
                ? "bg-amber-400"
                : "bg-rose-500"
            }`}
          />
        </span>

        {/* Text */}
        <span className="font-sans font-medium text-[10.5px]">
          {status === "connected"
            ? `Backend Live ${latencyMs !== null ? `(${latencyMs}ms)` : ""}`
            : status === "connecting"
            ? "Connecting..."
            : "Backend Offline"}
        </span>
      </div>

      {/* Glassmorphic Hover Popover */}
      <div className="absolute right-0 top-full mt-2 hidden group-hover:block z-50 w-64 rounded-xl border border-white/10 bg-black/95 p-3 shadow-2xl backdrop-blur-xl text-xs text-white pointer-events-none">
        <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2 font-sans font-semibold">
          <span className="flex items-center gap-1.5 text-white">
            <Server className="h-3.5 w-3.5 text-white/80" />
            <span>Service Health</span>
          </span>
          <span
            className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${
              status === "connected"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                : "bg-rose-500/20 text-rose-300 border border-rose-500/40"
            }`}
          >
            {status.toUpperCase()}
          </span>
        </div>
        <div className="space-y-1 text-[10px] font-mono text-muted-foreground">
          <div>Engine: <span className="text-white">{backendType}</span></div>
          <div>Latency: <span className="text-white">{latencyMs !== null ? `${latencyMs} ms` : "N/A"}</span></div>
          <div>Protocol: <span className="text-white">Pure DSA Max-Flow (FF·EK·Dinic)</span></div>
        </div>
      </div>
    </div>
  );
}
