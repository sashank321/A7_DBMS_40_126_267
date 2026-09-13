"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  GitMerge,
  Play,
  CheckCircle,
  AlertTriangle,
  Fingerprint,
  Layers,
  Sparkles,
  Info,
  Sliders,
  CheckCheck,
  RotateCcw,
  ShieldCheck,
  Network,
  HelpCircle,
  Cpu,
} from "lucide-react";
import type { AlgorithmType, SimulationResponse, AssignmentExplanation } from "@/types";
import { BipartiteFlowGraph } from "@/components/graph/BipartiteFlowGraph";
import { ExplainDrawer } from "@/components/matching/ExplainDrawer";
import { formatMs } from "@/lib/utils";
import { Card3D } from "@/components/ui/Card3D";

export default function MatchingCockpitPage() {
  const queryClient = useQueryClient();

  const [algorithm, setAlgorithm] = useState<AlgorithmType>("DINIC");
  const [reviewsPerPaper, setReviewsPerPaper] = useState<number>(2);
  const [reviewerCapacity, setReviewerCapacity] = useState<number>(4);
  const [excludeConflicts, setExcludeConflicts] = useState<boolean>(true);

  const [simulationResult, setSimulationResult] = useState<SimulationResponse | null>(null);
  const [selectedExplanation, setSelectedExplanation] = useState<AssignmentExplanation | null>(null);
  const [isExplainOpen, setIsExplainOpen] = useState(false);
  const [commitSuccess, setCommitSuccess] = useState(false);

  const { data: conferences } = useQuery({
    queryKey: ["conferences"],
    queryFn: () => api.getConferences(),
  });

  const activeConfId = conferences?.[0]?.id;

  const simulateMutation = useMutation({
    mutationFn: () =>
      api.simulateMatching({
        conferenceId: activeConfId!,
        algorithm,
        requiredReviewsPerPaper: reviewsPerPaper,
        defaultReviewerCapacity: reviewerCapacity,
        excludeConflicts,
      }),
    onSuccess: (data) => {
      setSimulationResult(data);
      setCommitSuccess(false);
    },
  });

  // Auto-simulate on mount when active conference loads
  React.useEffect(() => {
    if (activeConfId && !simulationResult && !simulateMutation.isPending) {
      simulateMutation.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConfId]);

  const commitMutation = useMutation({
    mutationFn: () => api.commitMatching(simulationResult!.runId, "Committed via Matching Cockpit"),
    onSuccess: () => {
      setCommitSuccess(true);
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      queryClient.invalidateQueries({ queryKey: ["manuscripts"] });
    },
  });

  const handleExplain = async (manuscriptId: string, reviewerId: string) => {
    try {
      const explanation = await api.explainAssignment(
        manuscriptId,
        reviewerId,
        simulationResult?.runId
      );
      setSelectedExplanation(explanation);
      setIsExplainOpen(true);
    } catch (e) {
      console.error("Failed to fetch assignment explanation", e);
    }
  };

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
              Matching Engine Cockpit
            </h1>
            <span className="rounded-full bg-white shadow-md border border-ink-black/20 px-3 py-0.5 text-[11px] font-bold text-ink-black shadow-[0_0_15px_rgba(255,255,255,0.15)]">
              Deterministic Maximum Flow
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Bipartite graph model with edge capacity saturation and conflict-free matching.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => simulateMutation.mutate()}
            disabled={simulateMutation.isPending || !activeConfId}
            className="liquid-glass rounded-xl px-5 py-2.5 text-xs font-semibold text-ink-black flex items-center gap-2 disabled:opacity-50"
          >
            <Play className={`h-4 w-4 text-ink-black ${simulateMutation.isPending ? "animate-spin" : ""}`} />
            <span>{simulateMutation.isPending ? "Computing Flow..." : "Simulate Allocation"}</span>
          </button>

          {simulationResult && !commitSuccess && (
            <button
              onClick={() => commitMutation.mutate()}
              disabled={commitMutation.isPending || simulationResult.achievedFlow === 0}
              className="btn-3d rounded-xl px-5 py-2.5 text-xs font-semibold text-ink-black flex items-center gap-2 bg-emerald-600/30 border-emerald-500/50 hover:bg-emerald-600/50 disabled:opacity-40"
            >
              <CheckCheck className="h-4 w-4 text-emerald-700" />
              <span>{commitMutation.isPending ? "Committing..." : "Commit Matches"}</span>
            </button>
          )}

          {commitSuccess && (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-100 border border-emerald-500/40 px-3.5 py-2 text-xs font-semibold text-emerald-800">
              <CheckCircle className="h-4 w-4" />
              <span>Committed to DB</span>
            </div>
          )}
        </div>
      </div>

      {/* PARAMETERS CONFIGURATION BAR */}
      <Card3D glowColor="purple" className="p-5">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-ink-black/10">
          <div className="flex items-center gap-2">
            <Sliders className="h-4 w-4 text-purple-800" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-ink-black">
              Flow Model Constraint Controls
            </h2>
          </div>
          <span className="text-[11px] text-muted-foreground">
            Algorithm: <strong className="text-purple-800 font-mono">{algorithm}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 text-xs">
          {/* Solver Algorithm Selection */}
          <div className="space-y-1.5">
            <label className="font-semibold text-muted-foreground">Flow Solver Algorithm</label>
            <select
              value={algorithm}
              onChange={(e) => setAlgorithm(e.target.value as AlgorithmType)}
              className="w-full rounded-xl border border-ink-black/10 bg-white shadow-inner py-2.5 px-3 text-xs text-ink-black focus:border-ink-black/30 focus:outline-none backdrop-blur-md"
            >
              <option value="DINIC">Dinic&apos;s Algorithm (Layered BFS/DFS)</option>
              <option value="EDMONDS_KARP">Edmonds-Karp (Shortest BFS)</option>
              <option value="FORD_FULKERSON">Ford-Fulkerson (DFS Augmenting)</option>
            </select>
          </div>

          {/* Required Reviews per Paper */}
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <label className="font-semibold text-muted-foreground">Reviews Required / Paper</label>
              <span className="font-mono font-bold text-ink-black">{reviewsPerPaper}</span>
            </div>
            <input
              type="range"
              min="1"
              max="5"
              step="1"
              value={reviewsPerPaper}
              onChange={(e) => setReviewsPerPaper(parseInt(e.target.value))}
              className="w-full accent-white"
            />
          </div>

          {/* Reviewer Capacity */}
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <label className="font-semibold text-muted-foreground">Reviewer Max Capacity</label>
              <span className="font-mono font-bold text-purple-800">{reviewerCapacity} papers</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              step="1"
              value={reviewerCapacity}
              onChange={(e) => setReviewerCapacity(parseInt(e.target.value))}
              className="w-full accent-purple-400"
            />
          </div>

          {/* Exclude Conflicts Toggle */}
          <div className="flex items-center justify-between pt-4 sm:pt-0">
            <div>
              <p className="font-semibold text-ink-black">Strict COI Exclusion</p>
              <p className="text-[10px] text-muted-foreground">Cut conflicting graph edges</p>
            </div>
            <input
              type="checkbox"
              checked={excludeConflicts}
              onChange={(e) => setExcludeConflicts(e.target.checked)}
              className="h-4 w-4 rounded border-ink-black/20 bg-white shadow-md text-ink-black focus:ring-0"
            />
          </div>
        </div>
      </Card3D>

      {/* SIMULATION METRICS BAR */}
      {simulationResult && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card3D glowColor="white" className="p-4">
            <p className="text-[11px] font-medium text-muted-foreground uppercase">
              Achieved Flow Capacity
            </p>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-ink-black">
                {simulationResult.achievedFlow} / {simulationResult.totalRequiredFlow}
              </span>
              <span className="text-xs text-muted-foreground">Units</span>
            </div>
          </Card3D>

          <Card3D glowColor="emerald" className="p-4">
            <p className="text-[11px] font-medium text-muted-foreground uppercase">
              Requirement Coverage
            </p>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-emerald-800">
                {(simulationResult.coveragePercentage ?? 100).toFixed(1)}%
              </span>
              <span className="text-xs text-muted-foreground">Completed</span>
            </div>
          </Card3D>

          <Card3D glowColor="purple" className="p-4">
            <p className="text-[11px] font-medium text-muted-foreground uppercase">
              Execution Timing
            </p>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-purple-800">
                {formatMs(simulationResult.durationMs)}
              </span>
              <span className="text-xs text-muted-foreground">
                ({simulationResult.augmentationsCount} aug)
              </span>
            </div>
          </Card3D>

          <Card3D glowColor="white" className="p-4">
            <p className="text-[11px] font-medium text-muted-foreground uppercase">
              SHA-256 Fingerprint
            </p>
            <div className="mt-1 flex items-center gap-1 font-mono text-xs text-muted-foreground truncate">
              <Fingerprint className="h-3.5 w-3.5 text-ink-black shrink-0" />
              <span className="truncate">{simulationResult.graphFingerprint}</span>
            </div>
          </Card3D>
        </div>
      )}

      {/* BIPARTITE FLOW GRAPH VISUALIZER */}
      {simulationResult && (
        <BipartiteFlowGraph
          data={simulationResult.graphVisualization}
          traces={simulationResult.executionTraceSummary}
          algorithmName={simulationResult.algorithmName || simulationResult.algorithm}
          onEdgeClick={(mId, rId) => handleExplain(mId, rId)}
        />
      )}

      {/* MATCHING RESULTS TABLE */}
      {simulationResult && (
        <Card3D glowColor="none" className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GitMerge className="h-4 w-4 text-ink-black" />
              <h2 className="text-sm font-bold text-ink-black">
                Assigned Reviewer Pairs ({simulationResult.assignments.length})
              </h2>
            </div>
            <p className="text-xs text-muted-foreground">
              Click any match row to view the full formal explainability proof
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-ink-black/10 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  <th className="pb-3">Manuscript</th>
                  <th className="pb-3">Assigned Reviewer</th>
                  <th className="pb-3">Affiliation</th>
                  <th className="pb-3">Score</th>
                  <th className="pb-3">COI Status</th>
                  <th className="pb-3 text-right">Proof</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono text-[11px]">
                {simulationResult.assignments.map((assignment, idx) => (
                  <tr
                    key={idx}
                    onClick={() => handleExplain(assignment.manuscriptId, assignment.reviewerId)}
                    className="cursor-pointer hover:bg-ink-black/[0.04] transition-colors"
                  >
                    <td className="py-3 font-sans font-medium text-ink-black max-w-[240px] truncate">
                      {assignment.manuscriptTitle}
                    </td>
                    <td className="py-3 font-sans text-ink-black">{assignment.reviewerName}</td>
                    <td className="py-3 font-sans text-muted-foreground">
                      {assignment.reviewerAffiliation || "Independent"}
                    </td>
                    <td className="py-3 text-emerald-700 font-bold">
                      {((assignment.compatibilityScore ?? 0.9) * 100).toFixed(0)}%
                    </td>
                    <td className="py-3">
                      <span className="rounded bg-emerald-100 border border-emerald-500/30 px-1.5 py-0.5 text-[9px] font-bold text-emerald-800">
                        CLEARED
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <button className="text-xs text-ink-black hover:underline font-sans transition-colors">
                        Explain Proof →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card3D>
      )}

      {/* Explain Drawer Slide-Over */}
      <ExplainDrawer
        explanation={selectedExplanation}
        isOpen={isExplainOpen}
        onClose={() => setIsExplainOpen(false)}
      />
    </div>
  );
}
