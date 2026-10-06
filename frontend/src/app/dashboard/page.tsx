"use client";

import { usePlatform, useDemoAccounts } from "@/lib/platform";
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
import { useAuth } from "@/lib/auth";
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
  const platform = usePlatform();
  const { user } = useAuth();
  const [activeStorage, setActiveStorage] = React.useState<number | null>(null);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const { data: health, isLoading: isHealthLoading, error: healthError } = useQuery({
    queryKey: ["system-health"],
    queryFn: () => api.getHealth(),
  });

  const { data: documents, isLoading: isDocsLoading, error: docsError } = useQuery({
    queryKey: ["documents-list"],
    queryFn: () => api.getDocuments(),
  });

  const { data: telemetry, isLoading: isTelemLoading, error: telemetryError } = useQuery({
    queryKey: ["mongo-telemetry"],
    queryFn: () => api.getMongoTelemetry(),
  });

  const { data: auditLogs, isLoading: isAuditLoading } = useQuery({
    queryKey: ["audit-analytics"],
    queryFn: () => api.getAuditLogs(),
    enabled: user?.role === "Admin",
  });

  if (!mounted || isHealthLoading || isDocsLoading) {
    return (
      <div className="flex h-96 items-center justify-center font-space">
        <div className="flex flex-col items-center gap-4 text-muted">
          <div className="h-6 w-6 animate-spin border-2 border-accent-orange border-t-transparent shadow-[0_0_15px_rgba(229,125,37,0.5)]" />
          <p className="text-[10px] uppercase tracking-widest text-accent-orange animate-pulse">
            Loading service metadata…
          </p>
        </div>
      </div>
    );
  }

  const docs = documents || [];
  const telem = telemetry || { total_activities: 0, average_rating: 0, total_reviews: 0 };

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
    { name: "PostgreSQL 3NF Core", unit: "tables", value: health?.components?.postgresql?.public_tables || 0, color: "#0F0F0F" },
    { name: platform.embeddingLabel, unit: "embeddings", value: health?.components?.postgresql?.document_embeddings || 0, color: "#E57D25" },
    { name: "MongoDB NoSQL Feeds", unit: "activity events", value: telem.total_activities, color: "#5B7553" },
    { name: "Graph Provenance", unit: "source links", value: health?.components?.postgresql?.entity_sources || 0, color: "#7B6B8A" },
  ];

  return (
    <div className="space-y-6 select-none text-ink-black pb-12">
      {(healthError || docsError || telemetryError) && <p role="alert" className="text-red-700">Some live data could not be loaded. Check service health and retry.</p>}
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
              {health?.status || "UNAVAILABLE"}
            </span>
          </div>
          <p className="mt-2 text-xs font-space text-muted uppercase tracking-wider">
            Live Document Catalog // Semantic Retrieval // Role-Based Document Access
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
          <p className="text-[10px] text-muted">Across {Object.keys(deptCounts).length} visible departments</p>
        </div>

        <div className="border border-ink-black/10 bg-white p-5 rounded-xl shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted text-xs">
            <span className="uppercase tracking-wider">Vector Embeddings</span>
            <BrainCircuit className="h-4 w-4 text-accent-blue" />
          </div>
          <p className="text-3xl font-bold text-ink-black">{platform.dimensions ?? "—"} <span className="text-sm font-normal text-muted">dims</span></p>
          <p className="text-[10px] text-muted">{platform.modelLabel}</p>
        </div>

        <div className="border border-ink-black/10 bg-white p-5 rounded-xl shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted text-xs">
            <span className="uppercase tracking-wider">MongoDB Telemetry</span>
            <Activity className="h-4 w-4 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-ink-black">{telem.total_activities}</p>
          <p className="text-[10px] text-muted">Avg Rating: {telem.average_rating} / 5.0 ★</p>
        </div>

        <div className="border border-ink-black/10 bg-white p-5 rounded-xl shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted text-xs">
            <span className="uppercase tracking-wider">Evaluated RBAC Pairs</span>
            <ShieldCheck className="h-4 w-4 text-purple-600" />
          </div>
          <p className="text-3xl font-bold text-ink-black">{health?.components?.postgresql?.access_matrix_rows ?? "—"} <span className="text-sm font-normal text-muted">rows</span></p>
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
            <span className="text-xs font-mono px-2 py-0.5 bg-black/5 rounded">{platform.pgLabel}</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptData}>
                <XAxis dataKey="name" stroke="#666" fontSize={11} tickLine={false} />
                <YAxis stroke="#666" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip
                  itemStyle={{ color: "#F4F1E6" }}
                  labelStyle={{ color: "#F4F1E6" }}
                  wrapperStyle={{ zIndex: 40 }}
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
              Live counts by storage component
            </p>
          </div>

          <div className="relative h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={storageData} cx="50%" cy="68%" innerRadius={42} outerRadius={66} paddingAngle={4} dataKey="value" onMouseEnter={(_, index) => setActiveStorage(index)} onMouseLeave={() => setActiveStorage(null)}>
                  {storageData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            {activeStorage !== null && (
              <div role="tooltip" data-testid="storage-tooltip" className="absolute left-2 right-2 top-0 z-40 pointer-events-none" style={{ backgroundColor: "#0F0F0F", color: "#FFFFFF", border: "1px solid #454545", borderRadius: 10, padding: "12px 14px", boxShadow: "0 6px 16px rgba(0,0,0,0.2)", fontSize: 12, maxWidth: 280 }}>
                <p style={{ color: "#FFFFFF", fontWeight: 700, margin: "0 0 6px", lineHeight: 1.4 }}>{storageData[activeStorage].name}</p>
                <p style={{ color: "#FFFFFF", margin: 0 }}><strong>{storageData[activeStorage].value.toLocaleString()}</strong> {storageData[activeStorage].unit}</p>
              </div>
            )}

          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {storageData.map((item, index) => (
              <button key={item.name} aria-label={`${item.name}: ${item.value} ${item.unit}`} aria-pressed={activeStorage === index} onMouseEnter={() => setActiveStorage(index)} onMouseLeave={() => setActiveStorage(null)} onFocus={() => setActiveStorage(index)} onBlur={() => setActiveStorage(null)} onClick={() => setActiveStorage(index)} className="flex items-start gap-2 text-left rounded-lg border border-transparent hover:border-ink-black/15 focus-visible:outline focus-visible:outline-accent-orange px-2 py-1">
                <span className="h-2.5 w-2.5 rounded-full shrink-0 mt-1" style={{ backgroundColor: item.color }} />
                <span><span className="block text-ink-black">{item.name}</span><span className="text-muted">{item.value.toLocaleString()} {item.unit}</span></span>
              </button>
            ))}
          </div>
          <p className="text-[10px] text-muted">Counts use different units; this chart does not represent disk usage.</p>
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
          {(auditLogs || []).slice(0, 5).map((log: any, idx: number) => (
            <div key={idx} className="py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                <span className="font-mono text-ink-black">{log.action}</span>
              </div>
              <span className="text-[10px] text-muted font-mono">{log.created_at}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
