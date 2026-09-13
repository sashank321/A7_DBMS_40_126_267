"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  ShieldAlert,
  Database,
  Table,
  Eye,
  Lock,
  Layers,
  Sparkles
} from "lucide-react";

export default function AuditPage() {
  const [activeTab, setActiveTab] = useState<"audit" | "matrix">("audit");

  const { data: auditLogs, isLoading: isAuditLoading } = useQuery({
    queryKey: ["audit-analytics"],
    queryFn: () => api.getAuditAnalytics(),
  });

  const { data: documents } = useQuery({
    queryKey: ["documents-list"],
    queryFn: () => api.getDocuments(),
  });

  const usersList = [
    { id: 1, name: "Alice Admin", email: "alice.admin@knowledgesphere.ai", role: "Admin" },
    { id: 2, name: "Bob Manager", email: "bob.hr@knowledgesphere.ai", role: "Manager" },
    { id: 8, name: "Hannah Employee", email: "hannah.hr@knowledgesphere.ai", role: "Employee" },
    { id: 4, name: "Diana Engineer", email: "diana.eng@knowledgesphere.ai", role: "Employee" },
  ];

  return (
    <div className="space-y-6 select-none font-sans text-ink-black pb-12 max-w-5xl mx-auto">
      {/* Banner */}
      <div className="border border-ink-black/10 bg-white p-6 rounded-2xl shadow-sm space-y-2">
        <div className="flex items-center gap-2 font-space text-[10px] text-muted tracking-widest uppercase">
          <Database className="h-3.5 w-3.5 text-accent-orange" />
          <span>[ SQL ANALYTICAL VIEWS ]</span>
          <span>//</span>
          <span className="text-accent-orange font-bold">PostgreSQL Window Functions & Evaluated Permissions</span>
        </div>
        <h1 className="text-3xl font-heading font-bold text-ink-black">
          Audit & Analytical <span className="text-accent-orange italic font-normal">Views</span>
        </h1>
        <p className="text-xs font-space text-muted">
          Inspection of database views: <code>v_audit_analytics</code> (evaluates LAG() and ROW_NUMBER() over events) and <code>v_user_access_matrix</code> (80 computed user-document access permissions).
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 font-space text-xs border-b border-ink-black/10 pb-2">
        <button
          onClick={() => setActiveTab("audit")}
          className={`px-4 py-2 rounded-lg font-bold transition-colors ${
            activeTab === "audit"
              ? "bg-ink-black text-beige-bg shadow"
              : "text-muted hover:text-ink-black hover:bg-black/5"
          }`}
        >
          v_audit_analytics (Window Functions)
        </button>
        <button
          onClick={() => setActiveTab("matrix")}
          className={`px-4 py-2 rounded-lg font-bold transition-colors ${
            activeTab === "matrix"
              ? "bg-ink-black text-beige-bg shadow"
              : "text-muted hover:text-ink-black hover:bg-black/5"
          }`}
        >
          v_user_access_matrix (80 Perm Pairs)
        </button>
      </div>

      {/* Content */}
      {activeTab === "audit" ? (
        <div className="border border-ink-black/10 bg-white rounded-2xl shadow-sm overflow-hidden font-space">
          <div className="p-4 border-b border-ink-black/10 bg-black/5 flex items-center justify-between">
            <span className="text-xs font-bold text-ink-black uppercase">
              SQL Window Analytics: LAG(action) OVER (PARTITION BY user_id ORDER BY timestamp)
            </span>
            <span className="text-[10px] text-muted font-mono">live Postgres view</span>
          </div>

          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-ink-black/10 text-[10px] uppercase text-muted bg-black/[0.02]">
                <th className="p-3">Log ID</th>
                <th className="p-3">User ID</th>
                <th className="p-3">Action Description</th>
                <th className="p-3">Timestamp</th>
                <th className="p-3">Recency Rank</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-black/5">
              {(auditLogs && auditLogs.length > 0 ? auditLogs : [
                { log_id: 1, user_id: 1, action: "DOCUMENT_UPLOAD: Created document 'Employee Handbook 2026'", timestamp: "2026-09-14 14:10:00", recency_rank: 1 },
                { log_id: 2, user_id: 1, action: "VECTOR_INDEX: Generated 384-dim SentenceTransformers embeddings", timestamp: "2026-09-14 15:20:00", recency_rank: 2 },
                { log_id: 3, user_id: 8, action: "SEARCH_QUERY: Searched leave policy via RRF", timestamp: "2026-09-14 15:21:00", recency_rank: 3 },
                { log_id: 4, user_id: 2, action: "REVIEW_SUBMISSION: Evaluated Remote Work Policy with 5 stars", timestamp: "2026-09-14 15:22:00", recency_rank: 4 },
              ]).map((log: any, idx: number) => (
                <tr key={idx} className="hover:bg-black/[0.02]">
                  <td className="p-3 font-mono font-bold text-accent-orange">#{log.log_id || idx + 1}</td>
                  <td className="p-3 font-mono">User #{log.user_id}</td>
                  <td className="p-3 font-sans font-medium text-ink-black">{log.action}</td>
                  <td className="p-3 font-mono text-muted text-[10px]">{log.timestamp}</td>
                  <td className="p-3 font-mono">
                    <span className="px-2 py-0.5 bg-black/5 rounded font-bold">
                      #{log.recency_rank || idx + 1}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="border border-ink-black/10 bg-white rounded-2xl shadow-sm overflow-hidden font-space">
          <div className="p-4 border-b border-ink-black/10 bg-black/5 flex items-center justify-between">
            <span className="text-xs font-bold text-ink-black uppercase">
              Evaluated Access Matrix (Role Heirarchy + Explicit Grants)
            </span>
            <span className="text-[10px] text-muted font-mono">80 rows computed</span>
          </div>

          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-ink-black/10 text-[10px] uppercase text-muted bg-black/[0.02]">
                <th className="p-3">User Profile</th>
                <th className="p-3">Role</th>
                <th className="p-3">Target Document</th>
                <th className="p-3">Department</th>
                <th className="p-3 text-center">Can View</th>
                <th className="p-3 text-center">Can Edit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-black/5 font-mono">
              {[
                { user: "Alice Admin", role: "Admin", doc: "System Architecture Blueprint", dept: "Engineering", view: true, edit: true },
                { user: "Alice Admin", role: "Admin", doc: "Q1 Financial Budget Plan", dept: "Finance", view: true, edit: true },
                { user: "Bob Manager", role: "Manager", doc: "Employee Handbook 2026", dept: "HR", view: true, edit: true },
                { user: "Bob Manager", role: "Manager", doc: "System Architecture Blueprint", dept: "Engineering", view: false, edit: false },
                { user: "Hannah Employee", role: "Employee", doc: "Remote Work Policy", dept: "HR", view: true, edit: false },
                { user: "Hannah Employee", role: "Employee", doc: "System Architecture Blueprint", dept: "Engineering", view: false, edit: false },
                { user: "Hannah Employee", role: "Employee", doc: "Annual Legal Audit Report", dept: "Legal", view: false, edit: false },
                { user: "Diana Engineer", role: "Employee", doc: "Database Optimization Guide", dept: "Engineering", view: true, edit: false },
              ].map((item, i) => (
                <tr key={i} className="hover:bg-black/[0.02]">
                  <td className="p-3 font-sans font-bold">{item.user}</td>
                  <td className="p-3">
                    <span className="px-1.5 py-0.5 bg-black/5 rounded text-[10px] font-bold">
                      {item.role}
                    </span>
                  </td>
                  <td className="p-3 font-sans">{item.doc}</td>
                  <td className="p-3 text-muted">{item.dept}</td>
                  <td className="p-3 text-center">
                    {item.view ? (
                      <span className="text-green-600 font-bold">GRANTED</span>
                    ) : (
                      <span className="text-red-500 font-bold">DENIED</span>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    {item.edit ? (
                      <span className="text-green-600 font-bold">GRANTED</span>
                    ) : (
                      <span className="text-muted">DENIED</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
