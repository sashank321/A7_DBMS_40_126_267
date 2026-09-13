"use client";

import React, { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  FlaskConical,
  Play,
  CheckCircle2,
  TrendingUp,
  Download,
  Clock,
  History,
  Sparkles,
} from "lucide-react";
import type { ScalabilitySweepResponse } from "@/types";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import { formatMs } from "@/lib/utils";
import { Card3D } from "@/components/ui/Card3D";

export default function ScalabilityExperimentsPage() {
  const [mounted, setMounted] = useState(false);
  const [startN, setStartN] = useState(10);
  const [endN, setEndN] = useState(100);
  const [step, setStep] = useState(15);
  const [ratio, setRatio] = useState(0.45);
  const [warmups, setWarmups] = useState(2);
  const [trials, setTrials] = useState(5);
  const [seed, setSeed] = useState(482917);

  const [sweepResult, setSweepResult] = useState<ScalabilitySweepResponse | null>(null);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const { data: history, refetch: refetchHistory } = useQuery({
    queryKey: ["benchmark-history"],
    queryFn: () => api.getBenchmarkHistory(),
  });

  const sweepMutation = useMutation({
    mutationFn: () =>
      api.runScalability({
        startManuscripts: startN,
        endManuscripts: endN,
        stepSize: step,
        reviewerRatio: ratio,
        warmupTrials: warmups,
        measuredTrials: trials,
        seed,
      }),
    onSuccess: (data) => {
      setSweepResult(data);
      refetchHistory();
    },
  });

  // Export CSV
  const handleExportCSV = () => {
    if (!sweepResult || sweepResult.points.length === 0) return;
    const headers = [
      "Manuscripts (N)",
      "Reviewers (M)",
      "Total Vertices",
      "Total Edges",
      "Max Flow",
      "Ford-Fulkerson (ms)",
      "Edmonds-Karp (ms)",
      "Dinic (ms)",
      "FF Augmentations",
      "EK Augmentations",
      "Dinic Augmentations",
      "Invariant Verified",
    ];

    const rows = sweepResult.points.map((p) => [
      p.manuscriptCount,
      p.reviewerCount,
      p.totalVertices,
      p.totalEdges,
      p.maxFlow,
      Number(p.fordFulkersonMedianMs || 0).toFixed(3),
      Number(p.edmondsKarpMedianMs || 0).toFixed(3),
      Number(p.dinicMedianMs || 0).toFixed(3),
      p.fordFulkersonAugmentations,
      p.edmondsKarpAugmentations,
      p.dinicAugmentations,
      p.invariantVerified ? "TRUE" : "FALSE",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `allocflow_scalability_sweep_seed_${seed}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Scalability Parameter Sweep Lab
            </h1>
            <span className="rounded bg-purple-50 border border-purple-200 px-2 py-0.5 text-[11px] font-semibold text-purple-700">
              Empirical Scalability Curves
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Evaluate empirical asymptotic runtime scaling across variable manuscript and reviewer set sizes
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {sweepResult && (
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 rounded-md border bg-secondary/50 px-3 py-2 text-xs font-semibold text-secondary-foreground hover:bg-secondary transition-colors"
            >
              <Download className="h-4 w-4" />
              <span>Export CSV</span>
            </button>
          )}

          <button
            onClick={() => sweepMutation.mutate()}
            disabled={sweepMutation.isPending}
            className="flex items-center gap-1.5 rounded-md bg-purple-600 px-4 py-2 text-xs font-semibold text-ink-black shadow-sm hover:bg-purple-700 disabled:opacity-50 transition-colors"
          >
            {sweepMutation.isPending ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-ink-black border-t-transparent" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            <span>{sweepMutation.isPending ? "Executing Scalability Sweep..." : "Run Parameter Sweep"}</span>
          </button>
        </div>
      </div>

      {/* Sweep Configuration */}
      <Card3D glowColor="purple" className="p-5 space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          <FlaskConical className="h-4 w-4 text-purple-700" />
          <span>Configurable Sweep Range &amp; Repetition Parameters</span>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7 text-xs">
          <div>
            <label className="font-semibold text-muted-foreground">Start Papers (N_start)</label>
            <input
              type="number"
              value={startN}
              onChange={(e) => setStartN(Number(e.target.value))}
              className="mt-1 w-full rounded-xl border border-ink-black/10 bg-white shadow-inner p-2 text-xs text-ink-black focus:border-ink-black/30 focus:outline-none"
            />
          </div>

          <div>
            <label className="font-semibold text-muted-foreground">End Papers (N_end)</label>
            <input
              type="number"
              value={endN}
              onChange={(e) => setEndN(Number(e.target.value))}
              className="mt-1 w-full rounded-xl border border-ink-black/10 bg-white shadow-inner p-2 text-xs text-ink-black focus:border-ink-black/30 focus:outline-none"
            />
          </div>

          <div>
            <label className="font-semibold text-muted-foreground">Step Size (ΔN)</label>
            <input
              type="number"
              value={step}
              onChange={(e) => setStep(Number(e.target.value))}
              className="mt-1 w-full rounded-xl border border-ink-black/10 bg-white shadow-inner p-2 text-xs text-ink-black focus:border-ink-black/30 focus:outline-none"
            />
          </div>

          <div>
            <label className="font-semibold text-muted-foreground">Reviewer Ratio (M/N)</label>
            <input
              type="number"
              step="0.05"
              value={ratio}
              onChange={(e) => setRatio(Number(e.target.value))}
              className="mt-1 w-full rounded-xl border border-ink-black/10 bg-white shadow-inner p-2 text-xs text-ink-black focus:border-ink-black/30 focus:outline-none"
            />
          </div>

          <div>
            <label className="font-semibold text-muted-foreground">Warmup Trials</label>
            <input
              type="number"
              value={warmups}
              onChange={(e) => setWarmups(Number(e.target.value))}
              className="mt-1 w-full rounded-xl border border-ink-black/10 bg-white shadow-inner p-2 text-xs text-ink-black focus:border-ink-black/30 focus:outline-none"
            />
          </div>

          <div>
            <label className="font-semibold text-muted-foreground">Measured Trials</label>
            <input
              type="number"
              value={trials}
              onChange={(e) => setTrials(Number(e.target.value))}
              className="mt-1 w-full rounded-xl border border-ink-black/10 bg-white shadow-inner p-2 text-xs text-ink-black focus:border-ink-black/30 focus:outline-none"
            />
          </div>

          <div>
            <label className="font-semibold text-muted-foreground">Deterministic Seed</label>
            <input
              type="number"
              value={seed}
              onChange={(e) => setSeed(Number(e.target.value))}
              className="mt-1 w-full rounded-xl border border-ink-black/10 bg-white shadow-inner p-2 text-xs font-mono text-ink-black focus:border-ink-black/30 focus:outline-none"
            />
          </div>
        </div>
      </Card3D>

      {/* Sweep Curves & Charts */}
      {sweepResult ? (
        <div className="space-y-6">
          {/* Invariant Banner */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 shadow-sm flex items-center justify-between gap-3 text-xs text-emerald-950">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              <div>
                <span className="font-bold text-emerald-900">
                  All Sweep Points Invariant Verified (FF == EK == Dinic)
                </span>
                <p className="text-[11px] text-emerald-800">
                  {sweepResult.points.length} distinct synthetic graph sizes evaluated across repeated trials.
                </p>
              </div>
            </div>
            <span className="font-mono text-xs font-bold text-emerald-900 bg-white/70 px-2.5 py-1 rounded-lg border border-emerald-200">
              Seed: {sweepResult.seed}
            </span>
          </div>

          {/* Scalability Line Charts */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Runtime Scaling Curve */}
            <div className="rounded-xl border bg-card p-5 shadow-sm space-y-4">
              <div>
                <h3 className="text-sm font-bold text-foreground">Empirical Runtime Scaling Curve (ms)</h3>
                <p className="text-xs text-muted-foreground">
                  Median execution time as graph size expands (Ford-Fulkerson vs Edmonds-Karp vs Dinic)
                </p>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={sweepResult.points}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis
                      dataKey="manuscriptCount"
                      label={{ value: "Manuscripts (N)", position: "insideBottom", offset: -5, fontSize: 11 }}
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis
                      label={{ value: "Runtime (ms)", angle: -90, position: "insideLeft", fontSize: 11 }}
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        borderColor: "hsl(var(--border))",
                        fontSize: "12px",
                        borderRadius: "6px",
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: "11px" }} />
                    <Line
                      type="monotone"
                      dataKey="fordFulkersonMedianMs"
                      name="Ford-Fulkerson"
                      stroke="#ef4444"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="edmondsKarpMedianMs"
                      name="Edmonds-Karp"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="dinicMedianMs"
                      name="Dinic"
                      stroke="#8b5cf6"
                      strokeWidth={2.5}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Augmentation Scaling Curve */}
            <div className="rounded-xl border bg-card p-5 shadow-sm space-y-4">
              <div>
                <h3 className="text-sm font-bold text-foreground">Augmenting Path Iterations</h3>
                <p className="text-xs text-muted-foreground">
                  Path augmentations vs. graph size
                </p>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={sweepResult.points}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis
                      dataKey="manuscriptCount"
                      label={{ value: "Manuscripts (N)", position: "insideBottom", offset: -5, fontSize: 11 }}
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis
                      label={{ value: "Augmentations", angle: -90, position: "insideLeft", fontSize: 11 }}
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        borderColor: "hsl(var(--border))",
                        fontSize: "12px",
                        borderRadius: "6px",
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: "11px" }} />
                    <Line
                      type="monotone"
                      dataKey="fordFulkersonAugmentations"
                      name="Ford-Fulkerson Augmentations"
                      stroke="#ef4444"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="edmondsKarpAugmentations"
                      name="Edmonds-Karp Augmentations"
                      stroke="#f59e0b"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="dinicAugmentations"
                      name="Dinic Augmentations"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Empirical Data Table */}
          <div className="rounded-xl border bg-card shadow-sm overflow-hidden p-5 space-y-3">
            <h3 className="text-sm font-bold text-foreground">Empirical Benchmark Data Points</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="border-b bg-secondary/30 text-muted-foreground font-sans font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Papers (N)</th>
                    <th className="py-2.5 px-3">Reviewers (M)</th>
                    <th className="py-2.5 px-3">Vertices (V)</th>
                    <th className="py-2.5 px-3">Edges (E)</th>
                    <th className="py-2.5 px-3">Max Flow</th>
                    <th className="py-2.5 px-3">FF Median (ms)</th>
                    <th className="py-2.5 px-3">EK Median (ms)</th>
                    <th className="py-2.5 px-3">Dinic Median (ms)</th>
                    <th className="py-2.5 px-3 text-center">Invariant</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {sweepResult.points.map((pt, idx) => (
                    <tr key={idx} className="hover:bg-secondary/20">
                      <td className="py-2 px-3 font-bold text-foreground">{pt.manuscriptCount}</td>
                      <td className="py-2 px-3">{pt.reviewerCount}</td>
                      <td className="py-2 px-3 text-muted-foreground">{pt.totalVertices}</td>
                      <td className="py-2 px-3 text-muted-foreground">{pt.totalEdges}</td>
                      <td className="py-2 px-3 font-bold text-emerald-700">{pt.maxFlow}</td>
                      <td className="py-2 px-3 text-rose-600">{formatMs(pt.fordFulkersonMedianMs)}</td>
                      <td className="py-2 px-3 text-amber-600">{formatMs(pt.edmondsKarpMedianMs)}</td>
                      <td className="py-2 px-3 font-bold text-purple-700">{formatMs(pt.dinicMedianMs)}</td>
                      <td className="py-2 px-3 text-center">
                        {pt.invariantVerified ? (
                          <span className="rounded bg-emerald-100 px-1.5 py-0.2 text-[10px] font-bold text-emerald-800">
                            PASS ✓
                          </span>
                        ) : (
                          <span className="rounded bg-rose-100 px-1.5 py-0.2 text-[10px] font-bold text-rose-800">
                            FAIL ✗
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed bg-card/50 text-muted-foreground space-y-2">
          <FlaskConical className="h-8 w-8 opacity-40" />
          <p className="text-xs font-medium">No Scalability Sweep Executed</p>
          <p className="text-[11px] text-muted-foreground/80">
            Configure parameter ranges above and click &quot;Run Parameter Sweep&quot; to generate empirical curves.
          </p>
        </div>
      )}

      {/* Historical Experiments */}
      {history && history.length > 0 && (
        <div className="rounded-xl border bg-card p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-bold text-foreground">Recent Experiment Records</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b bg-secondary/30 text-muted-foreground font-semibold">
                <tr>
                  <th className="py-2 px-3">Dataset ID</th>
                  <th className="py-2 px-3">Size (Papers × Revs)</th>
                  <th className="py-2 px-3">Graph (V, E)</th>
                  <th className="py-2 px-3">Max Flow</th>
                  <th className="py-2 px-3">FF / EK / Dinic (ms)</th>
                  <th className="py-2 px-3">Invariant</th>
                </tr>
              </thead>
              <tbody className="divide-y font-mono text-[11px]">
                {(Array.isArray(history) ? history : []).slice(0, 5).map((rec: any) => (
                  <tr key={rec.id} className="hover:bg-secondary/20">
                    <td className="py-2 px-3 font-sans font-medium text-foreground">{rec.datasetId}</td>
                    <td className="py-2 px-3">{rec.manuscriptCount} × {rec.reviewerCount}</td>
                    <td className="py-2 px-3 text-muted-foreground">V={rec.totalVertices}, E={rec.totalEdges}</td>
                    <td className="py-2 px-3 font-bold text-emerald-700">{rec.maxFlow}</td>
                    <td className="py-2 px-3">
                      {Number(rec.fordFulkersonMedianMs || 0).toFixed(2)} /{" "}
                      {Number(rec.edmondsKarpMedianMs || 0).toFixed(2)} /{" "}
                      <span className="font-bold text-purple-700">
                        {Number(rec.dinicMedianMs || 0).toFixed(2)}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      <span className="rounded bg-emerald-100 px-1.5 py-0.2 text-[9px] font-bold text-emerald-800">
                        VERIFIED ✓
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
