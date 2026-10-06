"use client";
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export default function AuditPage() {
  const [activeTab, setActiveTab] = useState<"audit" | "matrix">("audit");
  const { data: rows = [], isLoading, error, refetch } = useQuery({
    queryKey: ["audit-view", activeTab],
    queryFn: () => activeTab === "audit" ? api.getAuditAnalytics() : api.getAccessMatrix(),
  });
  const columns = rows.length ? Object.keys(rows[0]) : [];
  return <div className="space-y-6 text-ink-black pb-12">
    <div className="bg-white border border-ink-black/10 p-6 rounded-2xl">
      <h1 className="text-3xl font-heading font-bold">Audit & Analytical Views</h1>
      <p className="text-xs text-muted mt-2">Live PostgreSQL audit window functions and evaluated document permissions.</p>
    </div>
    <div className="flex gap-3">
      {(["audit", "matrix"] as const).map(tab => <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-lg ${tab === activeTab ? "bg-ink-black text-white" : "bg-white"}`}>{tab === "audit" ? "Audit Analytics" : "Access Matrix"}</button>)}
      <button onClick={() => refetch()} className="px-4 py-2 rounded-lg bg-white">Refresh</button>
    </div>
    {error && <p role="alert" className="text-red-700">Unable to load this view. Administrator access is required.</p>}
    <div className="overflow-x-auto bg-white border border-ink-black/10 rounded-xl">
      <p className="p-4 text-xs text-muted">{isLoading ? "Loading…" : `${rows.length} rows returned`}</p>
      <table className="w-full text-left text-xs"><thead><tr>{columns.map(column => <th key={column} className="p-3 border-b">{column.replaceAll("_", " ")}</th>)}</tr></thead>
        <tbody>{rows.map((row, i) => <tr key={i}>{columns.map(column => <td key={column} className="p-3 border-b border-ink-black/5">{typeof row[column] === "boolean" ? (row[column] ? "GRANTED" : "DENIED") : String(row[column] ?? "—")}</td>)}</tr>)}</tbody>
      </table>
    </div>
  </div>;
}
