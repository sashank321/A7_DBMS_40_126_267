"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  Network,
  RefreshCw,
  Layers,
  Database,
  Share2,
  Tag,
  ArrowRight,
  Info
} from "lucide-react";

export default function GraphViewPage() {
  const [selectedEntity, setSelectedEntity] = useState<string | null>(null);

  const { data: graphData, isLoading, refetch } = useQuery({
    queryKey: ["knowledge-graph"],
    queryFn: () => api.getGraph(2),
  });

  const entities = graphData?.entities || [
    { id: 1, name: "Alice Admin", type: "PERSON", description: "Lead System Administrator" },
    { id: 2, name: "Engineering", type: "DEPARTMENT", description: "Core platform engineering" },
    { id: 3, name: "PostgreSQL", type: "TECHNOLOGY", description: "Relational database core" },
    { id: 4, name: "MongoDB", type: "TECHNOLOGY", description: "NoSQL document feed store" },
    { id: 5, name: "System Architecture Blueprint", type: "DOCUMENT", description: "Confidential architecture specs" },
  ];

  const relationships = graphData?.relationships || [
    { id: 1, source: "Alice Admin", target: "Engineering", relation: "WORKS_IN", weight: 1.0 },
    { id: 2, source: "Alice Admin", target: "System Architecture Blueprint", relation: "OWNS", weight: 1.0 },
    { id: 3, source: "System Architecture Blueprint", target: "PostgreSQL", relation: "EXTENDS", weight: 1.0 },
    { id: 4, source: "System Architecture Blueprint", target: "MongoDB", relation: "OPTIMIZES", weight: 0.9 },
  ];

  const getBadgeColor = (type: string) => {
    switch (type.toUpperCase()) {
      case "PERSON":
        return "bg-purple-100 text-purple-800 border-purple-300";
      case "DEPARTMENT":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "DOCUMENT":
        return "bg-amber-100 text-amber-800 border-amber-300";
      case "TECHNOLOGY":
        return "bg-green-100 text-green-800 border-green-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  return (
    <div className="space-y-6 select-none font-sans text-ink-black pb-12 max-w-5xl mx-auto">
      {/* Banner */}
      <div className="border border-ink-black/10 bg-white p-6 rounded-2xl shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 font-space text-[10px] text-muted tracking-widest uppercase mb-1">
            <Network className="h-3.5 w-3.5 text-accent-orange" />
            <span>[ RELATIONAL GRAPH MODEL ]</span>
            <span>//</span>
            <span className="text-accent-orange font-bold">knowledge_entities & relationships</span>
          </div>
          <h1 className="text-3xl font-heading font-bold text-ink-black">
            Knowledge Graph <span className="text-accent-orange italic font-normal">Explorer</span>
          </h1>
          <p className="text-xs font-space text-muted">
            Relational node-and-edge model in PostgreSQL linking domain entities, typed relationships, and chunk-level provenance sources.
          </p>
        </div>

        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-4 py-2 border border-ink-black/15 bg-black/5 hover:bg-black/10 rounded-lg text-xs font-space font-bold transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh Graph
        </button>
      </div>

      {/* Graph Visual Explorer Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 font-space">
        {/* Entity Nodes Panel */}
        <div className="md:col-span-5 border border-ink-black/10 bg-white p-5 rounded-2xl shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-ink-black/10 pb-2">
            <h3 className="font-bold text-xs uppercase tracking-wider text-muted flex items-center gap-2">
              <Layers className="h-4 w-4 text-accent-orange" />
              Entities ({entities.length})
            </h3>
            <span className="text-[10px] text-muted">Click to inspect</span>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {entities.map((node) => (
              <div
                key={node.id}
                onClick={() => setSelectedEntity(node.name)}
                className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                  selectedEntity === node.name
                    ? "border-accent-orange bg-accent-orange/5 shadow-sm"
                    : "border-ink-black/10 hover:border-ink-black/25 bg-white"
                }`}
              >
                <div className="flex items-center justify-between">
                  <strong className="text-ink-black font-bold font-sans">{node.name}</strong>
                  <span className={`px-2 py-0.5 text-[9px] font-bold border rounded-full ${getBadgeColor(node.type)}`}>
                    {node.type}
                  </span>
                </div>
                {node.description && (
                  <p className="text-[10px] text-muted mt-1 line-clamp-1">{node.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Relationship Edges Panel */}
        <div className="md:col-span-7 border border-ink-black/10 bg-white p-5 rounded-2xl shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-ink-black/10 pb-2">
            <h3 className="font-bold text-xs uppercase tracking-wider text-muted flex items-center gap-2">
              <Share2 className="h-4 w-4 text-accent-blue" />
              Typed Relationships ({relationships.length})
            </h3>
            <span className="text-[10px] text-muted">Direct Graph Edges</span>
          </div>

          <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
            {relationships.map((rel) => (
              <div
                key={rel.id}
                className="p-3 bg-[#F9F8F3] border border-ink-black/10 rounded-xl text-xs flex items-center justify-between"
              >
                <div className="flex items-center gap-2 font-mono">
                  <span className="font-bold text-ink-black font-sans">{rel.source}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-muted" />
                  <span className="px-2 py-0.5 bg-ink-black text-beige-bg text-[10px] font-bold rounded">
                    {rel.relation}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-muted" />
                  <span className="font-bold text-accent-orange font-sans">{rel.target}</span>
                </div>
                <span className="text-[10px] text-muted font-mono">w={rel.weight}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
