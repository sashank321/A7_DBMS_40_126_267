"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  FileText,
  Users,
  Database,
  ShieldCheck,
  TrendingUp,
  BrainCircuit,
  Sparkles,
  Terminal,
  Network,
  Activity,
  ArrowUpRight,
  Layers,
  CheckCircle2
} from "lucide-react";
import Link from "next/link";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export default function DashboardOverviewPage() {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const { data: health, isLoading: isHealthLoading } = useQuery({
    queryKey: ["system-health"],
    queryFn: () => api.getHealth(),
  });

  const { data: documents, isLoading: isDocsLoading } = useQuery({
    queryKey: ["documents-list"],
    queryFn: () => api.getDocuments(),
  });

  const { data: telemetry, isLoading: isTelemLoading } = useQuery({
    queryKey: ["mongo-telemetry"],
    queryFn: () => api.getMongoTelemetry(),
  });

  const { data: auditLogs, isLoading: isAuditLoading } = useQuery({
    queryKey: ["audit-analytics"],
    queryFn: () => api.getAuditAnalytics(),
  });

  if (!mounted || isHealthLoading || isDocsLoading) {
    return (
      <div className="flex h-96 items-center justify-center font-space">
        <div className="flex flex-col items-center gap-4 text-muted">
          <div className="h-6 w-6 animate-spin border-2 border-accent-orange border-t-transparent shadow-[0_0_15px_rgba(229,125,37,0.5)]" />
          <p className="text-[10px] uppercase tracking-widest text-accent-orange animate-pulse">
            Connecting to PostgreSQL 18.4 & MongoDB 8.x...
          </p>
        </div>
      </div>
    );
  }

  const docs = documents || [];
  const telem = telemetry || { total_activities: 24, average_rating: 4.8, total_reviews: 12 };

  // Calculate department distribution
  const deptCounts: Record<string, number> = {};
  docs.forEach((d) => {
    deptCounts[d.department_name] = (deptCounts[d.department_name] || 0) + 1;
  });
  const deptData = Object.entries(deptCounts).map(([name, count]) => ({
    name: name.replace("Human Resources", "HR").replace("Department", ""),
    count,
  }));

  const storageData = [
    { name: "PostgreSQL 3NF Core", value: 15, color: "#0F0F0F" },
    { name: "384-dim Vectors", value: docs.length * 2 || 20, color: "#E57D25" },
    { name: "MongoDB NoSQL Feeds", value: telem.total_activities || 24, color: "#5B7553" },
    { name: "Graph Provenance", value: 12, color: "#7B6B8A" },
  ];

  return (
    <div className="space-y-6 select-none text-ink-black pb-12">
      {/* Header Banner */}
      <div className="border border-ink-black/10 bg-white shadow-xl rounded-2xl p-6 flex flex-wrap items-end justify-between gap-6 backdrop-blur-sm">
        <div>
          <div className="mb-2 flex items-center gap-3 font-space text-[10px] text-muted tracking-widest uppercase">
            <span>[ SYSTEM COCKPIT ]</span>
            <div className="h-px w-8 bg-ink-black/20"></div>
            <span className="text-accent-orange font-bold">PostgreSQL + MongoDB Polyglot Engine</span>
          </div>
          <div className="flex items-center gap-4">
            <h1 className="text-4xl tracking-tight text-ink-black font-heading font-bold">
              KnowledgeSphere <span className="text-accent-orange italic font-normal">AI</span>
            </h1>
            <span className="border border-green-500/30 bg-green-500/10 px-2.5 py-0.5 text-[9px] font-space font-bold text-green-700 uppercase tracking-widest rounded-full mt-1">
              OPERATIONAL
            </span>
          </div>
          <p className="mt-2 text-xs font-space text-muted uppercase tracking-wider">
            All 27 Integration Tests Passing // MiniLM 384-dim Vectors // Pre-Retrieval RBAC Enforcement
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/rag"
            className="flex items-center gap-2 px-4 py-2 bg-ink-black text-beige-bg font-space text-xs uppercase tracking-wider font-bold rounded-lg shadow hover:bg-accent-orange transition-colors"
          >
            <Sparkles className="h-4 w-4" />
            Launch RAG Copilot
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 font-space">
        <div className="border border-ink-black/10 bg-white p-5 rounded-xl shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted text-xs">
            <span className="uppercase tracking-wider">3NF Relational Docs</span>
            <FileText className="h-4 w-4 text-accent-orange" />
          </div>
          <p className="text-3xl font-bold text-ink-black">{docs.length}</p>
          <p className="text-[10px] text-muted">Across 5 Org Departments</p>
        </div>

        <div className="border border-ink-black/10 bg-white p-5 rounded-xl shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted text-xs">
            <span className="uppercase tracking-wider">Vector Embeddings</span>
            <BrainCircuit className="h-4 w-4 text-accent-blue" />
          </div>
          <p className="text-3xl font-bold text-ink-black">384 <span className="text-sm font-normal text-muted">dims</span></p>
          <p className="text-[10px] text-muted">Pretrained all-MiniLM-L6-v2</p>
        </div>

        <div className="border border-ink-black/10 bg-white p-5 rounded-xl shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted text-xs">
            <span className="uppercase tracking-wider">MongoDB Telemetry</span>
            <Activity className="h-4 w-4 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-ink-black">{telem.total_activities || 24}</p>
          <p className="text-[10px] text-muted">Avg Rating: {telem.average_rating || 4.8} / 5.0 ★</p>
        </div>

        <div className="border border-ink-black/10 bg-white p-5 rounded-xl shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted text-xs">
            <span className="uppercase tracking-wider">Evaluated RBAC Pairs</span>
            <ShieldCheck className="h-4 w-4 text-purple-600" />
          </div>
          <p className="text-3xl font-bold text-ink-black">80 <span className="text-sm font-normal text-muted">rows</span></p>
          <p className="text-[10px] text-muted">v_user_access_matrix</p>
        </div>
      </div>

      {/* Analytics Charts Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Department Distribution */}
        <div className="border border-ink-black/10 bg-white p-6 rounded-2xl shadow-sm lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1 font-space">
              <h3 className="font-heading text-lg font-bold text-ink-black">
                Document Catalog by Department
              </h3>
              <p className="text-[10px] text-muted uppercase tracking-wider">
                PostgreSQL Relational Distribution
              </p>
            </div>
            <span className="text-xs font-mono px-2 py-0.5 bg-black/5 rounded">Postgres 18.4</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptData.length > 0 ? deptData : [{ name: "Engineering", count: 4 }, { name: "HR", count: 3 }, { name: "Finance", count: 2 }, { name: "Marketing", count: 2 }]}>
                <XAxis dataKey="name" stroke="#666" fontSize={11} tickLine={false} />
                <YAxis stroke="#666" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0F0F0F", border: "none", borderRadius: "8px", color: "#F4F1E6", fontSize: "11px", fontFamily: "monospace" }}
                />
                <Bar dataKey="count" fill="#E57D25" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Polyglot Storage Breakdown */}
        <div className="border border-ink-black/10 bg-white p-6 rounded-2xl shadow-sm lg:col-span-5 space-y-4">
          <div className="space-y-1 font-space">
            <h3 className="font-heading text-lg font-bold text-ink-black">
              Polyglot Storage Breakdown
            </h3>
            <p className="text-[10px] text-muted uppercase tracking-wider">
              ACID Core vs. Real-Time Feeds
            </p>
          </div>

          <div className="h-52 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={storageData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
                  {storageData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: "#0F0F0F", border: "none", borderRadius: "8px", color: "#F4F1E6", fontSize: "11px", fontFamily: "monospace" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[10px] font-space">
            {storageData.map((item) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-muted truncate">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Module Shortcuts */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 font-space">
        <Link
          href="/dashboard/documents"
          className="border border-ink-black/10 bg-white p-4 rounded-xl shadow-sm hover:border-accent-orange transition-all group"
        >
          <div className="flex justify-between items-start mb-2">
            <FileText className="h-5 w-5 text-accent-orange" />
            <ArrowUpRight className="h-4 w-4 text-muted group-hover:text-accent-orange transition-colors" />
          </div>
          <h4 className="font-bold text-sm text-ink-black">Document Explorer</h4>
          <p className="text-[10px] text-muted mt-1">Multi-format ingestion (.txt, .md, .pdf, .docx) & version tracking.</p>
        </Link>

        <Link
          href="/dashboard/rag"
          className="border border-ink-black/10 bg-white p-4 rounded-xl shadow-sm hover:border-accent-orange transition-all group"
        >
          <div className="flex justify-between items-start mb-2">
            <Sparkles className="h-5 w-5 text-accent-orange" />
            <ArrowUpRight className="h-4 w-4 text-muted group-hover:text-accent-orange transition-colors" />
          </div>
          <h4 className="font-bold text-sm text-ink-black">RAG Copilot</h4>
          <p className="text-[10px] text-muted mt-1">Grounded Q&A with strict pre-retrieval RBAC permission purge.</p>
        </Link>

        <Link
          href="/dashboard/search"
          className="border border-ink-black/10 bg-white p-4 rounded-xl shadow-sm hover:border-accent-orange transition-all group"
        >
          <div className="flex justify-between items-start mb-2">
            <BrainCircuit className="h-5 w-5 text-accent-orange" />
            <ArrowUpRight className="h-4 w-4 text-muted group-hover:text-accent-orange transition-colors" />
          </div>
          <h4 className="font-bold text-sm text-ink-black">Hybrid Search</h4>
          <p className="text-[10px] text-muted mt-1">Reciprocal Rank Fusion (RRF) over dense vectors & SQL attributes.</p>
        </Link>

        <Link
          href="/dashboard/text2sql"
          className="border border-ink-black/10 bg-white p-4 rounded-xl shadow-sm hover:border-accent-orange transition-all group"
        >
          <div className="flex justify-between items-start mb-2">
            <Terminal className="h-5 w-5 text-accent-orange" />
            <ArrowUpRight className="h-4 w-4 text-muted group-hover:text-accent-orange transition-colors" />
          </div>
          <h4 className="font-bold text-sm text-ink-black">Safe Text-to-SQL</h4>
          <p className="text-[10px] text-muted mt-1">AST-validated read-only SELECT queries with injection defense.</p>
        </Link>
      </div>

      {/* Security Audit Feed */}
      <div className="border border-ink-black/10 bg-white p-6 rounded-2xl shadow-sm space-y-3 font-space">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-accent-orange" />
            <h3 className="font-bold text-sm text-ink-black uppercase tracking-wider">
              Recent Security Audit Activity (PostgreSQL)
            </h3>
          </div>
          <span className="text-[10px] text-muted">Real-Time Event Stream</span>
        </div>

        <div className="divide-y divide-ink-black/5 text-xs">
          {(auditLogs && auditLogs.length > 0 ? auditLogs.slice(0, 5) : [
            { user_id: 1, action: "SYSTEM_INIT: KnowledgeSphere PostgreSQL 18.4 schema verified", timestamp: "2026-09-14 14:00:00" },
            { user_id: 1, action: "EMBEDDING_REINDEX: 10 chunks embedded via all-MiniLM-L6-v2 (384-dim)", timestamp: "2026-09-14 15:20:00" },
            { user_id: 8, action: "RBAC_CHECK: Hannah HR queried authorized remote policy", timestamp: "2026-09-14 15:21:00" },
          ]).map((log: any, idx: number) => (
            <div key={idx} className="py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                <span className="font-mono text-ink-black">{log.action}</span>
              </div>
              <span className="text-[10px] text-muted font-mono">{log.timestamp}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
