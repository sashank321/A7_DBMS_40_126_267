"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { ShieldCheck, RefreshCw, FileText, BarChart3, Lock } from "lucide-react";

export default function AuditPage() {
  const [activeTab, setActiveTab] = useState<"logs" | "analytics" | "matrix">("logs");

  const { data: rows = [], isLoading, error, refetch } = useQuery({
    queryKey: ["audit-view", activeTab],
    queryFn: () => {
      if (activeTab === "logs") return api.getAuditLogs();
      if (activeTab === "analytics") return api.getAuditAnalytics();
      return api.getAccessMatrix();
    },
  });

  const columns = Array.isArray(rows) && rows.length > 0 ? Object.keys(rows[0]) : [];

  return (
    <div className="space-y-6 text-ink-black pb-12">
      {/* Header */}
      <div className="bg-white border border-ink-black/10 p-6 rounded-2xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-accent-orange font-mono text-xs font-bold uppercase tracking-wider mb-1">
            <ShieldCheck className="h-4 w-4" />
            <span>Compliance & Audit Trail</span>
          </div>
          <h1 className="text-3xl font-heading font-bold">Enterprise Audit Trail</h1>
          <p className="text-xs text-muted mt-1">
            Original immutable database audit logs, SQL window function analytics, and evaluated 3NF access matrices.
          </p>
        </div>

        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-ink-black/15 hover:bg-black/5 text-ink-black rounded-lg text-xs font-mono font-bold transition-colors shadow-sm"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Refresh View</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-ink-black/10 pb-3">
        <button
          onClick={() => setActiveTab("logs")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-bold transition-colors ${
            activeTab === "logs"
              ? "bg-ink-black text-beige-bg shadow-sm"
              : "bg-white border border-ink-black/10 text-muted hover:text-ink-black"
          }`}
        >
          <FileText className="h-3.5 w-3.5 text-accent-orange" />
          <span>Original Audit Logs</span>
        </button>

        <button
          onClick={() => setActiveTab("analytics")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-bold transition-colors ${
            activeTab === "analytics"
              ? "bg-ink-black text-beige-bg shadow-sm"
              : "bg-white border border-ink-black/10 text-muted hover:text-ink-black"
          }`}
        >
          <BarChart3 className="h-3.5 w-3.5 text-accent-orange" />
          <span>SQL Window Analytics</span>
        </button>

        <button
          onClick={() => setActiveTab("matrix")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-bold transition-colors ${
            activeTab === "matrix"
              ? "bg-ink-black text-beige-bg shadow-sm"
              : "bg-white border border-ink-black/10 text-muted hover:text-ink-black"
          }`}
        >
          <Lock className="h-3.5 w-3.5 text-accent-orange" />
          <span>Access Security Matrix</span>
        </button>
      </div>

      {error && (
        <div role="alert" className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-mono">
          Unable to load this view. Administrator permissions are required to inspect security audit records.
        </div>
      )}

      {/* Data Table */}
      <div className="bg-white border border-ink-black/10 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 bg-[#F9F8F3] border-b border-ink-black/10 flex items-center justify-between text-xs font-mono">
          <span className="font-bold uppercase tracking-wider text-muted">
            {activeTab === "logs"
              ? "Table: audit_logs (Original Raw Log Ingestion)"
              : activeTab === "analytics"
              ? "View: v_audit_analytics (PostgreSQL Window Functions)"
              : "View: v_user_access_matrix (3NF Security Access Matrix)"}
          </span>
          <span className="text-muted">{isLoading ? "Loading records..." : `${rows.length} record(s) returned`}</span>
        </div>

        <div className="overflow-x-auto">
          {columns.length === 0 && !isLoading ? (
            <div className="p-8 text-center text-xs text-muted font-mono">No audit log records found.</div>
          ) : (
            <table className="w-full text-left text-xs font-mono border-collapse">
              <thead>
                <tr className="bg-black/5 border-b border-ink-black/10">
                  {columns.map((column) => (
                    <th key={column} className="p-3 font-bold uppercase tracking-wider text-ink-black text-[11px]">
                      {column.replaceAll("_", " ")}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row: any, i: number) => (
                  <tr key={i} className="border-b border-ink-black/5 hover:bg-black/[0.02] transition-colors">
                    {columns.map((column) => {
                      const val = row[column];
                      if (typeof val === "boolean") {
                        return (
                          <td key={column} className="p-3 font-bold">
                            <span className={`px-2 py-0.5 rounded text-[10px] ${val ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                              {val ? "GRANTED" : "DENIED"}
                            </span>
                          </td>
                        );
                      }
                      return (
                        <td key={column} className="p-3 text-ink-black/90">
                          {String(val ?? "—")}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
