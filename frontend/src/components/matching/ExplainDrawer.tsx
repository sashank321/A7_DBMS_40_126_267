"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  X,
  CheckCircle2,
  AlertCircle,
  FileText,
  User,
  Tag,
  Hash,
  Activity,
  Layers,
  Fingerprint,
  Sparkles,
} from "lucide-react";
import type { AssignmentExplanation } from "@/types";

interface ExplainDrawerProps {
  explanation: AssignmentExplanation | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ExplainDrawer({ explanation, isOpen, onClose }: ExplainDrawerProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!isOpen || !explanation) return null;
  const content = (
    <div className="fixed inset-0 z-[100] flex justify-end bg-black/20 backdrop-blur-sm transition-opacity">
      <div className="flex h-full w-full max-w-lg flex-col border-l border-ink-black/10 bg-white p-6 shadow-2xl animate-in slide-in-from-right duration-300 text-ink-black">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-ink-black/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink-black/5 border border-ink-black/10 text-ink-black shadow-sm">
              <Sparkles className="h-5 w-5 text-ink-black" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-ink-black">Assignment Explanation</h2>
              <p className="text-xs text-muted-foreground">Deterministic Bipartite Matching Proof</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-ink-black/5 hover:text-ink-black transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto py-5 space-y-4 font-sans">
          {/* Plain English Summary Pill */}
          <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-50 text-xs shadow-sm">
            <div className="flex items-center gap-2 font-bold text-emerald-800">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>Valid Match Verified</span>
            </div>
            <p className="mt-1.5 text-[11px] leading-relaxed text-emerald-900/90 font-medium">
              {explanation.explanationSummary}
            </p>
          </div>

          {/* Manuscript & Reviewer Cards */}
          <div className="grid grid-cols-2 gap-3">
            {/* Manuscript Card */}
            <div className="p-3.5 space-y-1.5 rounded-xl border border-ink-black/10 bg-white shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-ink-black">
                <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Manuscript</span>
              </div>
              <p className="font-bold text-xs text-ink-black line-clamp-2">{explanation.manuscriptTitle}</p>
              {explanation.manuscriptTrack && (
                <span className="inline-block rounded-md bg-ink-black/5 border border-ink-black/10 px-2 py-0.5 text-[9px] font-medium text-ink-black">
                  {explanation.manuscriptTrack}
                </span>
              )}
            </div>

            {/* Reviewer Card */}
            <div className="p-3.5 space-y-1.5 rounded-xl border border-ink-black/10 bg-white shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-purple-700">
                <User className="h-3.5 w-3.5" />
                <span>Assigned Reviewer</span>
              </div>
              <p className="font-bold text-xs text-ink-black">{explanation.reviewerName}</p>
              <p className="text-[11px] text-muted-foreground">{explanation.reviewerAffiliation || "Independent"}</p>
            </div>
          </div>

          {/* Match Criteria & Overlaps */}
          <div className="p-4 space-y-3 rounded-xl border border-ink-black/10 bg-white shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Explainable Compatibility Criteria
            </h3>

            {/* Topic Overlap */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-muted-foreground font-medium">
                  <Tag className="h-3.5 w-3.5 text-ink-black/70" /> Topic Overlap:
                </span>
                <span className="font-bold text-ink-black">
                  {explanation.topicOverlapCount} matches
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {explanation.matchingTopics && explanation.matchingTopics.length > 0 ? (
                  explanation.matchingTopics.map((topic, i) => (
                    <span
                      key={i}
                      className="rounded-md bg-ink-black/5 border border-ink-black/10 px-2 py-0.5 text-[10px] font-semibold text-ink-black"
                    >
                      {topic}
                    </span>
                  ))
                ) : (
                  <span className="text-[10px] text-muted-foreground italic font-medium">General track alignment</span>
                )}
              </div>
            </div>

            {/* Keyword Matches */}
            <div className="space-y-1.5 pt-2.5 border-t border-ink-black/10">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-muted-foreground font-medium">
                  <Hash className="h-3.5 w-3.5 text-purple-600" /> Keyword Matches:
                </span>
                <span className="font-bold text-ink-black">
                  {explanation.keywordOverlapCount} matches
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {explanation.matchingKeywords && explanation.matchingKeywords.length > 0 ? (
                  explanation.matchingKeywords.map((kw, i) => (
                    <span
                      key={i}
                      className="rounded-md bg-purple-100 border border-purple-200 px-2 py-0.5 text-[10px] font-semibold text-purple-800"
                    >
                      #{kw}
                    </span>
                  ))
                ) : (
                  <span className="text-[10px] text-muted-foreground italic font-medium">Domain broad match</span>
                )}
              </div>
            </div>

            {/* Compatibility Score */}
            <div className="flex items-center justify-between pt-2.5 border-t border-ink-black/10 text-xs">
              <span className="text-muted-foreground font-medium">Compatibility Score:</span>
              <span className="font-mono font-bold text-emerald-600 text-sm">
                {((explanation.compatibilityScore ?? 0.9) * 100).toFixed(0)}%
              </span>
            </div>
          </div>

          {/* Reviewer Capacity & COI Verification */}
          <div className="p-4 space-y-3 rounded-xl border border-ink-black/10 bg-white shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Constraint &amp; Conflict Verification
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground font-medium">Reviewer Capacity:</span>
                <span className="font-bold text-ink-black">
                  {explanation.reviewerWorkloadAssigned} / {explanation.reviewerMaxCapacity} slots used
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-ink-black/10 overflow-hidden shadow-inner">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, (explanation.reviewerWorkloadAssigned / (explanation.reviewerMaxCapacity || 1)) * 100)}%`
                  }}
                />
              </div>

              <div className="pt-2 border-t border-ink-black/10 flex items-start gap-2 text-[11px] text-muted-foreground font-medium">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{explanation.conflictVerificationDetails}</span>
              </div>
            </div>
          </div>

          {/* Algorithmic Provenance */}
          <div className="p-4 space-y-2.5 text-xs rounded-xl border border-ink-black/10 bg-beige-bg/50 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Algorithmic Execution Provenance
            </h3>
            <div className="flex justify-between">
              <span className="text-muted-foreground font-medium">Algorithm:</span>
              <span className="font-bold text-purple-700">{explanation.algorithmName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground font-medium">Flow Pushed:</span>
              <span className="font-mono font-bold text-ink-black">{explanation.flow} unit</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground font-medium">Run ID:</span>
              <span className="font-mono text-[10px] text-muted-foreground truncate max-w-[200px] font-semibold">
                {explanation.algorithmRunId}
              </span>
            </div>
            <div className="pt-2 border-t border-ink-black/10 flex items-center justify-between text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1 font-medium">
                <Fingerprint className="h-3.5 w-3.5 text-ink-black/70" /> Graph Fingerprint:
              </span>
              <span className="font-mono truncate max-w-[160px] text-ink-black/80 font-semibold">{explanation.graphFingerprint}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-ink-black/10 pt-4">
          <button
            onClick={onClose}
            className="w-full rounded-xl bg-ink-black py-2.5 text-xs font-bold text-white hover:bg-ink-black/90 transition-colors shadow-md"
          >
            Close Explanation
          </button>
        </div>
      </div>
    </div>
  );
  return mounted ? createPortal(content, document.body) : null;
}
