"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  Building2,
  Plus,
  Calendar,
  Layers,
  Users,
  FileText,
  CheckCircle2,
  X,
} from "lucide-react";
import { Card3D } from "@/components/ui/Card3D";

export default function ConferencesPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [acronym, setAcronym] = useState("");
  const [description, setDescription] = useState("");
  const [requiredReviews, setRequiredReviews] = useState(2);
  const [defaultCapacity, setDefaultCapacity] = useState(4);

  const { data: conferences, isLoading } = useQuery({
    queryKey: ["conferences"],
    queryFn: () => api.getConferences(),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      api.createConference({
        code,
        name,
        acronym,
        description,
        requiredReviewsPerPaper: requiredReviews,
        defaultReviewerCapacity: defaultCapacity,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conferences"] });
      setIsModalOpen(false);
      setCode("");
      setName("");
      setAcronym("");
      setDescription("");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate();
  };

  return (
    <div className="space-y-6 select-none text-ink-black">
      {/* Header */}
      <div className="bg-white shadow-2xl rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4 border border-ink-black/10">
        <div>
          <h1
            className="text-3xl tracking-tight text-ink-black"
            style={{ fontFamily: "'Instrument Serif', serif" }}
          >
            Conferences &amp; Academic Cycles
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Multi-conference SaaS configuration and review period windows
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="liquid-glass rounded-xl px-4 py-2 text-xs font-semibold text-ink-black flex items-center gap-2"
        >
          <Plus className="h-4 w-4 text-ink-black" />
          <span>New Conference Cycle</span>
        </button>
      </div>

      {/* Conference Cards */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {isLoading ? (
          <div className="col-span-full py-12 text-center text-xs text-muted-foreground">
            Loading conferences...
          </div>
        ) : conferences && conferences.length > 0 ? (
          conferences.map((c) => (
            <Card3D
              key={c.id}
              glowColor="white"
              className="p-5 space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-base text-ink-black">{c.code}</span>
                    <span className="rounded bg-emerald-100 border border-emerald-500/40 px-2 py-0.5 text-[9px] font-bold text-emerald-800">
                      {c.status}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-ink-black mt-1">{c.name}</h3>
                </div>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                {c.description || "No description provided."}
              </p>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-ink-black/10 text-xs">
                <div className="space-y-1">
                  <span className="text-[11px] text-muted-foreground">Required / Paper:</span>
                  <p className="font-mono font-bold text-ink-black">{c.requiredReviewsPerPaper} reviews</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] text-muted-foreground">Reviewer Max Cap:</span>
                  <p className="font-mono font-bold text-ink-black">{c.defaultReviewerCapacity} papers</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-ink-black/10 text-[11px] text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-ink-black" />
                  <span>{c.manuscriptCount} Manuscripts</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-purple-800" />
                  <span>{c.reviewerCount} Reviewers</span>
                </div>
              </div>
            </Card3D>
          ))
        ) : (
          <div className="col-span-full py-12 text-center text-xs text-muted-foreground">
            No conferences created yet.
          </div>
        )}
      </div>

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white shadow-inner p-4 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-2xl border border-ink-black/10 bg-black/95 p-6 shadow-2xl space-y-4 text-ink-black">
            <div className="flex items-center justify-between border-b border-ink-black/10 pb-3">
              <h2 className="text-sm font-bold text-ink-black">Initialize New Conference Cycle</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="btn-3d rounded-lg p-1 text-muted-foreground hover:text-ink-black"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-muted-foreground">Conference Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SIGCOMM-2026"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-ink-black/10 bg-white shadow-2xl rounded-2xl p-2.5 text-xs text-ink-black focus:border-ink-black/30 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-muted-foreground">Short Acronym</label>
                  <input
                    type="text"
                    placeholder="e.g. SIGCOMM '26"
                    value={acronym}
                    onChange={(e) => setAcronym(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-ink-black/10 bg-white shadow-2xl rounded-2xl p-2.5 text-xs text-ink-black focus:border-ink-black/30 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-muted-foreground">Conference Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ACM SIGCOMM 2026 Conference on Applications, Technologies..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-ink-black/10 bg-white shadow-2xl rounded-2xl p-2.5 text-xs text-ink-black focus:border-ink-black/30 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-muted-foreground">Scope &amp; Description</label>
                <textarea
                  rows={3}
                  placeholder="Describe track focus, review methodology, and topics..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-ink-black/10 bg-white shadow-2xl rounded-2xl p-2.5 text-xs text-ink-black focus:border-ink-black/30 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-muted-foreground">Reviews / Paper (k)</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={requiredReviews}
                    onChange={(e) => setRequiredReviews(parseInt(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-ink-black/10 bg-white shadow-2xl rounded-2xl p-2.5 text-xs text-ink-black focus:border-ink-black/30 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-muted-foreground">Reviewer Max Capacity</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={defaultCapacity}
                    onChange={(e) => setDefaultCapacity(parseInt(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-ink-black/10 bg-white shadow-2xl rounded-2xl p-2.5 text-xs text-ink-black focus:border-ink-black/30 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-ink-black/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-3d rounded-xl px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-ink-black"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="liquid-glass rounded-xl px-4 py-2 text-xs font-semibold text-ink-black disabled:opacity-50"
                >
                  {createMutation.isPending ? "Creating Cycle..." : "Create Conference Cycle"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
