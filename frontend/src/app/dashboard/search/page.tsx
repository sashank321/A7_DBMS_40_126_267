"use client";

import { usePlatform, useDemoAccounts } from "@/lib/platform";
import React, { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  Search,
  BrainCircuit,
  SlidersHorizontal,
  ChevronRight,
  Database,
  Tag
} from "lucide-react";
import type { SearchResponse } from "@/types";

export default function SearchPage() {
  const { data: suggestedDocuments } = useQuery({ queryKey: ["documents-list"], queryFn: () => api.getDocuments() });
  const platform = usePlatform();
  const { data: catalog } = useQuery({ queryKey: ["catalog"], queryFn: api.getCatalog });
  const [query, setQuery] = useState("");
  const [topK, setTopK] = useState(5);
  const [departmentId, setDepartmentId] = useState<number | undefined>(undefined);
  const [searchData, setSearchData] = useState<SearchResponse | null>(null);

  const searchMutation = useMutation({
    mutationFn: (q: string) => api.search(q, topK, departmentId),
    onSuccess: (data) => setSearchData(data),
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    searchMutation.mutate(query.trim());
  };

  const sampleSearches = (suggestedDocuments || []).slice(0, 4).map(d => d.title);

  return (
    <div className="space-y-6 select-none font-sans text-ink-black pb-12 max-w-5xl mx-auto">
      {searchMutation.isError && <p role="alert" className="text-red-700">Search failed. Please check the backend and retry.</p>}
      {/* Banner */}
      <div className="border border-ink-black/10 bg-white p-6 rounded-2xl shadow-sm space-y-2">
        <div className="flex items-center gap-2 font-space text-[10px] text-muted tracking-widest uppercase">
          <BrainCircuit className="h-3.5 w-3.5 text-accent-orange" />
          <span>[ DENSE EMBEDDING RETRIEVAL ]</span>
          <span>{"//"}</span>
          <span className="text-accent-orange font-bold">{platform.embeddingLabel}</span>
        </div>
        <h1 className="text-3xl font-heading font-bold text-ink-black">
          Hybrid Vector <span className="text-accent-orange italic font-normal">Search</span>
        </h1>
        <p className="text-xs font-space text-muted">
          Multi-channel fusion: combines dense cosine similarity search over stored vectors and SQL attribute filtering via Reciprocal Rank Fusion (RRF).
        </p>
      </div>

      {/* Search Input Box */}
      <div className="border border-ink-black/10 bg-white p-6 rounded-2xl shadow-sm space-y-4 font-space">
        <form onSubmit={handleSearch} className="space-y-3">
          <div className="flex flex-col sm:block gap-2 relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search conceptual queries or keywords..."
              className="w-full p-4 sm:pr-40 border border-ink-black/15 rounded-xl text-sm focus:outline-none focus:border-accent-orange font-sans"
            />
            <button
              type="submit"
              disabled={searchMutation.isPending || !query.trim()}
              className="sm:absolute right-3 top-2.5 px-5 py-2 bg-ink-black text-beige-bg font-bold text-xs rounded-lg hover:bg-accent-orange transition-colors disabled:opacity-50"
            >
              {searchMutation.isPending ? "Searching..." : "Execute Search"}
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 text-xs text-muted">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold">Department Scope:</span>
              <select
                value={departmentId || ""}
                onChange={(e) => setDepartmentId(e.target.value ? Number(e.target.value) : undefined)}
                className="p-1 border border-ink-black/10 rounded text-xs bg-white"
              >
                <option value="">All Departments</option>
                {catalog?.departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold">Top K:</span>
              <select
                value={topK}
                onChange={(e) => setTopK(Number(e.target.value))}
                className="p-1 border border-ink-black/10 rounded text-xs bg-white"
              >
                <option value={3}>Top 3</option>
                <option value={5}>Top 5</option>
                <option value={10}>Top 10</option>
              </select>
            </div>
          </div>
        </form>

        {/* Sample searches */}
        <div className="space-y-1.5 pt-2 border-t border-ink-black/5">
          <span className="text-[10px] text-muted uppercase font-bold">Try Queries:</span>
          <div className="flex flex-wrap gap-2">
            {sampleSearches.map((s, idx) => (
              <button
                key={idx}
                disabled={searchMutation.isPending}
                onClick={() => {
                  setQuery(s);
                  searchMutation.mutate(s);
                }}
                className="px-3 py-1 bg-black/5 hover:bg-black/10 rounded-md text-[10px] text-muted hover:text-ink-black transition-colors"
              >
                &quot;{s}&quot;
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results Listing */}
      {searchData && (
        <div className="space-y-4 font-space">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-bold text-ink-black">Results ({searchData.results.length})</span>
              <span className="text-[10px] text-muted">for &quot;{searchData.query}&quot;</span>
            </div>
            <span className="px-2 py-0.5 bg-accent-orange/10 border border-accent-orange/30 text-accent-orange text-[10px] font-bold rounded">
              Route: {searchData.route_intent}
            </span>
          </div>

          <div className="space-y-3">
            {searchData.results.length === 0 ? (
              <div className="border border-ink-black/10 bg-white p-8 text-center text-muted rounded-2xl">
                No matching documents or chunks met the similarity threshold.
              </div>
            ) : (
              searchData.results.map((res, i) => (
                <div key={i} className="border border-ink-black/10 bg-white p-5 rounded-xl shadow-sm space-y-2 hover:border-accent-orange transition-all">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-ink-black font-sans">{res.title}</h4>
                      <p className="text-[10px] text-muted">
                        Doc ID: #{res.document_id} {"//"} Chunk: #{res.chunk_id || 1}
                      </p>
                    </div>
                    <span className="px-2.5 py-1 bg-black/5 rounded text-xs font-mono font-bold text-accent-orange">
                      {res.retrieval_mode === "hybrid" ? "Fusion score" : res.retrieval_mode === "structured" ? "Text match" : "Cosine"}: {res.similarity_score}
                    </span>
                  </div>

                  <p className="text-xs font-sans text-muted leading-relaxed line-clamp-3 bg-black/[0.02] p-3 rounded-lg border border-ink-black/5">
                    &quot;{res.content_snippet}&quot;
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-muted pt-1">
                    <span className="flex items-center gap-1 font-mono">
                      <Tag className="h-3 w-3" />
                      Mode: {res.retrieval_mode}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
