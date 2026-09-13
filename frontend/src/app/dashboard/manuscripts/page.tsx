"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  FileText,
  Plus,
  Search,
  Filter,
  Tag,
  Hash,
  CheckCircle2,
  Clock,
  Building,
  User,
  X,
} from "lucide-react";
import type { Manuscript, ManuscriptStatus } from "@/types";

export default function ManuscriptsPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [abstractText, setAbstractText] = useState("");
  const [requiredReviews, setRequiredReviews] = useState(2);
  const [topicsInput, setTopicsInput] = useState("Distributed Systems, Graph Algorithms");
  const [keywordsInput, setKeywordsInput] = useState("consensus, flow, routing");
  const [affiliationsInput, setAffiliationsInput] = useState("MIT CSAIL");

  const { data: conferences } = useQuery({
    queryKey: ["conferences"],
    queryFn: () => api.getConferences(),
  });

  const activeConfId = conferences?.[0]?.id;

  const { data: manuscripts, isLoading } = useQuery({
    queryKey: ["manuscripts", activeConfId],
    queryFn: () => api.getManuscripts(activeConfId),
    enabled: !!activeConfId,
  });

  const createMutation = useMutation({
    mutationFn: (payload: any) => api.createManuscript(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["manuscripts"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      setIsSubmitModalOpen(false);
      setTitle("");
      setAbstractText("");
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.updateManuscriptStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["manuscripts"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConfId || !title.trim()) return;

    createMutation.mutate({
      conferenceId: activeConfId,
      title: title.trim(),
      abstractText: abstractText.trim(),
      requiredReviews,
      topics: topicsInput.split(",").map((s) => s.trim()).filter(Boolean),
      keywords: keywordsInput.split(",").map((s) => s.trim()).filter(Boolean),
      authorAffiliations: affiliationsInput.split(",").map((s) => s.trim()).filter(Boolean),
    });
  };

  const filteredManuscripts = (manuscripts || []).filter((m) => {
    const matchesSearch =
      m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.authorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.topics.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = selectedStatus === "ALL" || m.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Manuscripts &amp; Submissions
          </h1>
          <p className="text-xs text-muted-foreground">
            Author papers, topic requirements, and assignment statuses
          </p>
        </div>

        <button
          onClick={() => setIsSubmitModalOpen(true)}
          className="liquid-glass rounded-xl px-4 py-2 text-xs font-semibold text-ink-black flex items-center gap-2"
        >
          <Plus className="h-4 w-4 text-ink-black" />
          <span>Submit Manuscript</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by title, author, topic..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-ink-black/10 bg-white shadow-2xl rounded-2xl py-2.5 pl-9 pr-4 text-xs text-ink-black placeholder:text-muted-foreground focus:border-ink-black/30 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Status:</span>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="rounded-xl border border-ink-black/10 bg-white shadow-2xl rounded-2xl px-3 py-2 text-xs text-ink-black focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="SUBMITTED">SUBMITTED</option>
            <option value="UNDER_REVIEW">UNDER_REVIEW</option>
            <option value="REVIEWS_COMPLETE">REVIEWS_COMPLETE</option>
            <option value="ACCEPTED">ACCEPTED</option>
            <option value="REJECTED">REJECTED</option>
          </select>
        </div>
      </div>

      {/* Manuscripts Table */}
      <div className="bg-white shadow-2xl rounded-2xl overflow-hidden border border-ink-black/10 rounded-xl bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-ink-black/10 bg-white shadow-xl text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                <th className="py-3 px-4">Title &amp; Track</th>
                <th className="py-3 px-4">Author &amp; Affiliation</th>
                <th className="py-3 px-4">Topics &amp; Keywords</th>
                <th className="py-3 px-4 text-center">Req. Reviews</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground">
                    Loading manuscripts...
                  </td>
                </tr>
              ) : filteredManuscripts.length > 0 ? (
                filteredManuscripts.map((m) => (
                  <tr key={m.id} className="hover:bg-white shadow-xl transition-colors">
                    <td className="py-3 px-4 max-w-xs">
                      <p className="font-bold text-ink-black line-clamp-1">{m.title}</p>
                      <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                        {m.abstractText || "No abstract provided"}
                      </p>
                      {m.trackName && (
                        <span className="inline-block rounded bg-white shadow-md border border-ink-black/15 px-1.5 py-0.5 text-[9px] font-medium text-ink-black/90 mt-1">
                          {m.trackName}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <p className="font-medium text-ink-black">{m.authorName}</p>
                      <p className="text-[11px] text-muted-foreground">{m.authorEmail}</p>
                      {m.authorAffiliations && m.authorAffiliations.length > 0 && (
                        <p className="text-[10px] text-muted-foreground/80 mt-0.5">
                          {m.authorAffiliations.join(", ")}
                        </p>
                      )}
                    </td>

                    <td className="py-3 px-4 max-w-xs">
                      <div className="flex flex-wrap gap-1">
                        {m.topics.map((t, idx) => (
                          <span
                            key={idx}
                            className="rounded bg-white shadow-md border border-ink-black/15 px-1.5 py-0.5 text-[10px] font-medium text-ink-black/90"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {m.keywords.map((k, idx) => (
                          <span
                            key={idx}
                            className="rounded bg-ink-black/5 px-1.5 py-0.5 text-[9px] text-muted-foreground"
                          >
                            #{k}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-center font-mono font-bold text-ink-black">
                      {m.requiredReviews}
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold border ${
                          m.status === "SUBMITTED"
                            ? "bg-white shadow-md text-ink-black border-ink-black/20"
                            : m.status === "UNDER_REVIEW"
                            ? "bg-purple-100 text-purple-800 border-purple-500/40"
                            : m.status === "ACCEPTED"
                            ? "bg-emerald-100 text-emerald-800 border-emerald-500/40"
                            : "bg-ink-black/5 text-muted-foreground border-ink-black/10"
                        }`}
                      >
                        {m.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <select
                        value={m.status}
                        onChange={(e) =>
                          statusMutation.mutate({ id: m.id, status: e.target.value })
                        }
                        className="rounded border bg-card px-2 py-1 text-[11px] text-foreground focus:outline-none"
                      >
                        <option value="SUBMITTED">SUBMITTED</option>
                        <option value="UNDER_REVIEW">UNDER_REVIEW</option>
                        <option value="REVIEWS_COMPLETE">REVIEWS_COMPLETE</option>
                        <option value="ACCEPTED">ACCEPTED</option>
                        <option value="REJECTED">REJECTED</option>
                      </select>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground">
                    No manuscripts matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Submit Manuscript Modal */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white shadow-2xl rounded-2xl backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <h2 className="text-base font-bold text-foreground">Submit New Manuscript</h2>
              </div>
              <button
                onClick={() => setIsSubmitModalOpen(false)}
                className="rounded-md p-1 text-muted-foreground hover:bg-secondary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-foreground">Paper Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Distributed Consensus on Large-Scale Bipartite Graphs"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1 w-full rounded-md border bg-background p-2 text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-foreground">Abstract</label>
                <textarea
                  rows={3}
                  placeholder="Brief synopsis of methodology and research contributions..."
                  value={abstractText}
                  onChange={(e) => setAbstractText(e.target.value)}
                  className="mt-1 w-full rounded-md border bg-background p-2 text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-foreground">Required Reviews</label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={requiredReviews}
                    onChange={(e) => setRequiredReviews(Number(e.target.value))}
                    className="mt-1 w-full rounded-md border bg-background p-2 text-xs focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-foreground">Author Affiliation</label>
                  <input
                    type="text"
                    value={affiliationsInput}
                    onChange={(e) => setAffiliationsInput(e.target.value)}
                    className="mt-1 w-full rounded-md border bg-background p-2 text-xs focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-foreground">Topic Overlap Tags (comma separated)</label>
                <input
                  type="text"
                  value={topicsInput}
                  onChange={(e) => setTopicsInput(e.target.value)}
                  className="mt-1 w-full rounded-md border bg-background p-2 text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-foreground">Keywords (comma separated)</label>
                <input
                  type="text"
                  value={keywordsInput}
                  onChange={(e) => setKeywordsInput(e.target.value)}
                  className="mt-1 w-full rounded-md border bg-background p-2 text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="rounded-md border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="rounded-md bg-blue-600 px-4 py-1.5 text-xs font-semibold text-ink-black hover:bg-blue-700 disabled:opacity-50"
                >
                  {createMutation.isPending ? "Submitting..." : "Submit Paper"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
