"use client";

import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  Scale,
  Play,
  CheckCircle2,
  AlertCircle,
  Fingerprint,
  Layers,
  Sparkles,
  Info,
  Clock,
  ShieldCheck,
  TrendingDown,
  Cpu,
  Zap,
} from "lucide-react";
import type { BenchmarkComparisonResponse } from "@/types";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import { formatMs } from "@/lib/utils";
import { Card3D } from "@/components/ui/Card3D";

export default function AlgorithmComparisonPage() {
  const [mounted, setMounted] = useState(false);
  const [manuscripts, setManuscripts] = useState(30);
  const [reviewers, setReviewers] = useState(15);
  const [reviewsPerPaper, setReviewsPerPaper] = useState(2);
  const [capacity, setCapacity] = useState(4);
  const [seed, setSeed] = useState(482917);
  const [warmups, setWarmups] = useState(3);
  const [trials, setTrials] = useState(10);

  const [benchmarkResult, setBenchmarkResult] = useState<BenchmarkComparisonResponse | null>(null);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const compareMutation = useMutation({
    mutationFn: () =>
      api.runComparison({
        manuscriptCount: manuscripts,
        reviewerCount: reviewers,
        requiredReviewsPerPaper: reviewsPerPaper,
        reviewerCapacity: capacity,
        randomSeed: seed,
        warmupTrials: warmups,
        measuredTrials: trials,
      }),
    onSuccess: (data) => {
      setBenchmarkResult(data);
    },
  });

  React.useEffect(() => {
    if (!benchmarkResult && !compareMutation.isPending) {
      compareMutation.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Chart data
  const runtimeChartData =
    benchmarkResult?.algorithms.map((algo) => ({
      name: algo.algorithmName,
      "Median Runtime (ms)": algo.medianDurationMs,
      "p95 Runtime (ms)": algo.p95DurationMs,
      "Augmentations / Paths": algo.augmentations,
    })) || [];

  return (
    <div className="space-y-6 select-none text-ink-black">
      {/* Header */}
      <div className="bg-white shadow-2xl rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4 border border-ink-black/10">
        <div>
          <div className="flex items-center gap-3">
            <h1
              className="text-3xl tracking-tight text-ink-black"
              style={{ fontFamily: "'Instrument Serif', serif" }}
            >
              Tri-Algorithm Max-Flow Comparison
            </h1>
            <span className="rounded-full bg-purple-100 border border-purple-500/40 px-3 py-0.5 text-[11px] font-bold text-purple-800 shadow-[0_0_15px_rgba(168,85,247,0.25)]">
              Rigorous Research Protocol
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Sequential evaluation (same graph → clone → FF → clone → EK → clone → Dinic) with median/p95 latency &amp; SHA-256 fingerprint.
          </p>
        </div>

        <button
          onClick={() => compareMutation.mutate()}
          disabled={compareMutation.isPending}
          className="liquid-glass rounded-xl px-5 py-2.5 text-xs font-semibold text-ink-black flex items-center gap-2 disabled:opacity-50"
        >
          {compareMutation.isPending ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-ink-black border-t-transparent" />
          ) : (
            <Play className="h-4 w-4 text-ink-black" />
          )}
          <span>
            {compareMutation.isPending
              ? "Executing Sequential Trials..."
              : "Run Tri-Algorithm Benchmark"}
          </span>
        </button>
      </div>

      {/* BENCHMARK PARAMETERS CONTROLS */}
      <Card3D glowColor="purple" className="p-5">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-ink-black/10">
          <h2 className="text-xs font-bold uppercase tracking-wider text-ink-black">
            Synthetic Benchmark Parameters
          </h2>
          <span className="text-[11px] font-mono text-muted-foreground">
            Seed: <strong className="text-ink-black">{seed}</strong> • {warmups} Warmups • {trials} Measured Trials
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6 text-xs">
          <div>
            <label className="text-muted-foreground font-medium">Manuscripts (|P|)</label>
            <input
              type="number"
              min="5"
              max="200"
              value={manuscripts}
              onChange={(e) => setManuscripts(parseInt(e.target.value) || 30)}
              className="mt-1.5 w-full rounded-xl border border-ink-black/10 bg-white shadow-inner py-2 px-3 text-xs font-mono text-ink-black focus:border-ink-black/30 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-muted-foreground font-medium">Reviewers (|R|)</label>
            <input
              type="number"
              min="5"
              max="100"
              value={reviewers}
              onChange={(e) => setReviewers(parseInt(e.target.value) || 15)}
              className="mt-1.5 w-full rounded-xl border border-ink-black/10 bg-white shadow-inner py-2 px-3 text-xs font-mono text-ink-black focus:border-ink-black/30 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-muted-foreground font-medium">Reviews / Paper (k)</label>
            <input
              type="number"
              min="1"
              max="5"
              value={reviewsPerPaper}
              onChange={(e) => setReviewsPerPaper(parseInt(e.target.value) || 2)}
              className="mt-1.5 w-full rounded-xl border border-ink-black/10 bg-white shadow-inner py-2 px-3 text-xs font-mono text-ink-black focus:border-ink-black/30 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-muted-foreground font-medium">Reviewer Cap (C_r)</label>
            <input
              type="number"
              min="1"
              max="10"
              value={capacity}
              onChange={(e) => setCapacity(parseInt(e.target.value) || 4)}
              className="mt-1.5 w-full rounded-xl border border-ink-black/10 bg-white shadow-inner py-2 px-3 text-xs font-mono text-ink-black focus:border-ink-black/30 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-muted-foreground font-medium">Warmup Trials</label>
            <input
              type="number"
              min="1"
              max="10"
              value={warmups}
              onChange={(e) => setWarmups(parseInt(e.target.value) || 3)}
              className="mt-1.5 w-full rounded-xl border border-ink-black/10 bg-white shadow-inner py-2 px-3 text-xs font-mono text-ink-black focus:border-ink-black/30 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-muted-foreground font-medium">Measured Trials</label>
            <input
              type="number"
              min="3"
              max="50"
              value={trials}
              onChange={(e) => setTrials(parseInt(e.target.value) || 10)}
              className="mt-1.5 w-full rounded-xl border border-ink-black/10 bg-white shadow-inner py-2 px-3 text-xs font-mono text-ink-black focus:border-ink-black/30 focus:outline-none"
            />
          </div>
        </div>
      </Card3D>

      {/* MATHEMATICAL INVARIANT BADGE */}
      {benchmarkResult && (
        <div
          className={`bg-white shadow-2xl rounded-2xl p-5 flex items-center justify-between border ${
            benchmarkResult.invariantSatisfied
              ? "border-emerald-500/40 bg-emerald-950/20"
              : "border-rose-500/40 bg-rose-950/20"
          }`}
        >
          <div className="flex items-center gap-3">
            {benchmarkResult.invariantSatisfied ? (
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 border border-emerald-500/40 text-emerald-800 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                <CheckCircle2 className="h-6 w-6" />
              </div>
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 border border-rose-500/40 text-rose-800">
                <AlertCircle className="h-6 w-6" />
              </div>
            )}
            <div>
              <p className="text-sm font-bold text-ink-black">
                Mathematical Invariant Status:{" "}
                {benchmarkResult.invariantSatisfied
                  ? "VERIFIED & EQUIVALENT"
                  : "VIOLATION DETECTED"}
              </p>
              <p className="text-xs text-muted-foreground font-mono mt-0.5">
                Ford-Fulkerson (MaxFlow={benchmarkResult.invariantMaxFlow}) == Edmonds-Karp (MaxFlow=
                {benchmarkResult.invariantMaxFlow}) == Dinic (MaxFlow=
                {benchmarkResult.invariantMaxFlow})
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 font-mono text-xs text-muted-foreground bg-white shadow-2xl rounded-2xl px-3 py-1.5 rounded-xl border border-ink-black/10">
            <Fingerprint className="h-4 w-4 text-ink-black/80" />
            <span>Fingerprint: {benchmarkResult.graphFingerprint ? benchmarkResult.graphFingerprint.substring(0, 16) : ""}…</span>
          </div>
        </div>
      )}

      {/* SIDE-BY-SIDE 3D ALGORITHM CARDS */}
      {benchmarkResult && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {benchmarkResult.algorithms.map((algo, index) => {
            const glow =
              algo.algorithmName === "Dinic"
                ? "white"
                : algo.algorithmName === "Edmonds-Karp"
                ? "purple"
                : "amber";

            return (
              <Card3D key={algo.algorithmName} glowColor={glow} className="p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-ink-black/10 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-ink-black">{algo.algorithmName}</h3>
                    <p className="text-[11px] text-muted-foreground font-mono">
                      {algo.algorithmName === "Ford-Fulkerson"
                        ? "O(E · |f*|) DFS Augmenting"
                        : algo.algorithmName === "Edmonds-Karp"
                        ? "O(V · E²) Shortest BFS Path"
                        : "O(V² · E) Layered BFS/DFS"}
                    </p>
                  </div>
                  <span className="rounded-full bg-white shadow-md border border-ink-black/10 px-2.5 py-0.5 text-[10px] font-mono text-ink-black">
                    Rank #{index + 1}
                  </span>
                </div>

                {/* Metrics */}
                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between items-baseline">
                    <span className="text-muted-foreground">Calculated Max Flow:</span>
                    <span className="font-mono font-bold text-ink-black text-sm">{algo.maxFlow} units</span>
                  </div>

                  <div className="flex justify-between items-baseline">
                    <span className="text-muted-foreground">Median Runtime:</span>
                    <span className="font-mono font-bold text-ink-black text-sm">
                      {formatMs(algo.medianDurationMs)}
                    </span>
                  </div>

                  <div className="flex justify-between items-baseline">
                    <span className="text-muted-foreground">p95 Tail Latency:</span>
                    <span className="font-mono text-muted-foreground">{formatMs(algo.p95DurationMs)}</span>
                  </div>

                  <div className="flex justify-between items-baseline">
                    <span className="text-muted-foreground">Augmenting Iterations:</span>
                    <span className="font-mono font-semibold text-purple-800">{algo.augmentations}</span>
                  </div>

                  {algo.phases > 0 && (
                    <div className="flex justify-between items-baseline">
                      <span className="text-muted-foreground">Layered BFS Phases:</span>
                      <span className="font-mono font-semibold text-emerald-800">{algo.phases}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-baseline">
                    <span className="text-muted-foreground">Validity Check:</span>
                    <span className="rounded bg-emerald-100 border border-emerald-500/30 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                      {algo.validityStatus}
                    </span>
                  </div>
                </div>

                {/* Graph Specs */}
                <div className="rounded-xl border border-ink-black/10 bg-white shadow-2xl rounded-2xl p-3 text-[11px] font-mono text-muted-foreground space-y-1">
                  <div>Vertices: {benchmarkResult.vertexCount}</div>
                  <div>Edges: {benchmarkResult.edgeCount}</div>
                  <div>Trials: {algo.measuredTrials} runs (Sequential isolated)</div>
                </div>
              </Card3D>
            );
          })}
        </div>
      )}

      {/* 3D LATENCY COMPARISON CHART */}
      {benchmarkResult && (
        <Card3D glowColor="purple" className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-ink-black">Runtime Latency Benchmarking (ms)</h2>
              <p className="text-xs text-muted-foreground">
                Sequential execution on identical cloned canonical graphs (Median vs p95)
              </p>
            </div>
          </div>

          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={runtimeChartData} margin={{ top: 10, right: 20, left: -10, bottom: 20 }}>
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={{ stroke: "rgba(255,255,255,0.15)" }}
                  tick={{ fontSize: 12, fill: "#94A3B8" }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={{ stroke: "rgba(255,255,255,0.15)" }}
                  tick={{ fontSize: 11, fill: "#94A3B8" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(10, 10, 10, 0.95)",
                    backdropFilter: "blur(12px)",
                    borderColor: "rgba(255, 255, 255, 0.15)",
                    borderRadius: "12px",
                    color: "#FFFFFF",
                    fontSize: "12px",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.9)",
                  }}
                />
                <Legend />
                <Bar dataKey="Median Runtime (ms)" fill="#FFFFFF" radius={[6, 6, 0, 0]} barSize={32} />
                <Bar dataKey="p95 Runtime (ms)" fill="#8B5CF6" radius={[6, 6, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card3D>
      )}
    </div>
  );
}
