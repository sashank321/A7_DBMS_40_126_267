"use client";

import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  Sparkles,
  Send,
  ShieldAlert,
  ShieldCheck,
  BookOpen,
  Info,
  ChevronDown,
  ChevronUp,
  Cpu,
  Layers
} from "lucide-react";
import type { RAGResponse } from "@/types";

export default function RAGCopilotPage() {
  const { user } = useAuth();
  const [question, setQuestion] = useState("");
  const [topK, setTopK] = useState(4);
  const [ragResult, setRagResult] = useState<RAGResponse | null>(null);
  const [expandedCitation, setExpandedCitation] = useState<number | null>(null);

  const ragMutation = useMutation({
    mutationFn: (q: string) => api.ragQuery(q, topK),
    onSuccess: (data) => {
      setRagResult(data);
    }
  });

  const handleAsk = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    ragMutation.mutate(question.trim());
  };

  const sampleQuestions = [
    "What is the annual leave entitlement and remote working hours?",
    "How does our system handle database optimization and indexing?",
    "What are the SOC2 security compliance requirements?",
    "Explain the confidential System Architecture Blueprint."
  ];

  return (
    <div className="space-y-6 select-none font-sans text-ink-black pb-12 max-w-5xl mx-auto">
      {/* Banner */}
      <div className="border border-ink-black/10 bg-white p-6 rounded-2xl shadow-sm space-y-2">
        <div className="flex items-center gap-2 font-space text-[10px] text-muted tracking-widest uppercase">
          <Sparkles className="h-3.5 w-3.5 text-accent-orange" />
          <span>[ GROUNDED RAG INTELLIGENCE ]</span>
          <span>//</span>
          <span className="text-accent-orange font-bold">Pre-Retrieval RBAC Security Gate</span>
        </div>
        <h1 className="text-3xl font-heading font-bold text-ink-black">
          Grounded RAG <span className="text-accent-orange italic font-normal">Copilot</span>
        </h1>
        <p className="text-xs font-space text-muted">
          Current Role: <strong className="text-ink-black font-bold">[{user?.role}]</strong> {user?.email}.
          Unauthorized document chunks are purged <em>before</em> context construction.
        </p>
      </div>

      {/* Query Form */}
      <div className="border border-ink-black/10 bg-white p-6 rounded-2xl shadow-sm space-y-4 font-space">
        <form onSubmit={handleAsk} className="space-y-3">
          <div className="relative">
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask any question about enterprise documents, policies, or technical guides..."
              rows={3}
              className="w-full p-4 border border-ink-black/15 rounded-xl text-xs focus:outline-none focus:border-accent-orange font-sans leading-relaxed"
            />
            <button
              type="submit"
              disabled={ragMutation.isPending || !question.trim()}
              className="absolute right-3 bottom-4 flex items-center gap-2 px-5 py-2 bg-ink-black text-beige-bg font-bold text-xs rounded-lg hover:bg-accent-orange transition-colors disabled:opacity-50"
            >
              {ragMutation.isPending ? "Retrieving & Grounding..." : (
                <>
                  <span>Ask Copilot</span>
                  <Send className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Sample Prompts */}
        <div className="space-y-1.5">
          <span className="text-[10px] text-muted uppercase font-bold tracking-wider">Sample Questions:</span>
          <div className="flex flex-wrap gap-2">
            {sampleQuestions.map((sq, i) => (
              <button
                key={i}
                onClick={() => {
                  setQuestion(sq);
                  ragMutation.mutate(sq);
                }}
                className="px-3 py-1 bg-black/5 hover:bg-black/10 rounded-md text-[10px] text-muted hover:text-ink-black transition-colors text-left"
              >
                "{sq}"
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* RAG Answer Display */}
      {ragResult && (
        <div className="border border-ink-black/10 bg-white p-6 rounded-2xl shadow-lg space-y-5 font-space">
          {/* Metadata badges */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-black/10 pb-4">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-accent-orange/10 border border-accent-orange/30 text-accent-orange font-mono text-[10px] font-bold rounded">
                Intent: {ragResult.route_intent}
              </span>
              <span className="px-2 py-0.5 bg-black/5 border border-black/10 text-muted font-mono text-[10px] rounded">
                Confidence: {Math.round(ragResult.confidence * 100)}%
              </span>
              <span className={`px-2 py-0.5 border font-mono text-[10px] rounded flex items-center gap-1 ${
                ragResult.is_generative_llm
                  ? "bg-purple-50 text-purple-700 border-purple-200"
                  : "bg-blue-50 text-blue-700 border-blue-200"
              }`}>
                <Cpu className="h-3 w-3" />
                {ragResult.llm_provider}
              </span>
            </div>

            {/* RBAC Filter count */}
            <div className="flex items-center gap-1.5 text-xs">
              {ragResult.unauthorized_documents_filtered > 0 ? (
                <span className="flex items-center gap-1 px-2.5 py-0.5 bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold rounded-full">
                  <ShieldAlert className="h-3 w-3" />
                  {ragResult.unauthorized_documents_filtered} Unauthorized Doc(s) Blocked
                </span>
              ) : (
                <span className="flex items-center gap-1 px-2.5 py-0.5 bg-green-50 border border-green-200 text-green-800 text-[10px] font-bold rounded-full">
                  <ShieldCheck className="h-3 w-3" />
                  All Documents Authorized
                </span>
              )}
            </div>
          </div>

          {/* Answer Text */}
          <div className="space-y-2">
            <h3 className="text-xs uppercase font-bold text-muted tracking-wider">Grounded Response:</h3>
            <div className="p-4 bg-[#F9F8F3] border border-ink-black/10 rounded-xl font-sans text-sm leading-relaxed whitespace-pre-wrap text-ink-black shadow-inner">
              {ragResult.answer}
            </div>
          </div>

          {/* Verified Citations */}
          {ragResult.citations && ragResult.citations.length > 0 && (
            <div className="space-y-3 pt-2">
              <h3 className="text-xs uppercase font-bold text-muted tracking-wider flex items-center gap-2">
                <BookOpen className="h-3.5 w-3.5 text-accent-orange" />
                Verified Context Citations ({ragResult.citations.length}):
              </h3>

              <div className="space-y-2">
                {ragResult.citations.map((cit, idx) => (
                  <div key={idx} className="border border-ink-black/10 rounded-lg p-3 bg-white text-xs">
                    <div
                      onClick={() => setExpandedCitation(expandedCitation === idx ? null : idx)}
                      className="flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-2 font-mono">
                        <span className="text-accent-orange font-bold">[{idx + 1}]</span>
                        <strong className="text-ink-black font-sans text-xs">{cit.title}</strong>
                        <span className="text-[10px] text-muted">(v{cit.version_number} / Chunk #{cit.chunk_id})</span>
                      </div>
                      {expandedCitation === idx ? <ChevronUp className="h-4 w-4 text-muted" /> : <ChevronDown className="h-4 w-4 text-muted" />}
                    </div>

                    {expandedCitation === idx && (
                      <div className="mt-2.5 pt-2 border-t border-ink-black/5 text-muted font-sans text-xs leading-relaxed bg-black/[0.02] p-2 rounded">
                        "{cit.snippet}"
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
