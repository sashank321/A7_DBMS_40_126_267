"use client";

import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  Terminal,
  ShieldCheck,
  ShieldAlert,
  Play,
  AlertTriangle,
  Database,
  Code2
} from "lucide-react";
import type { Text2SQLResponse } from "@/types";

export default function Text2SQLPage() {
  const [query, setQuery] = useState("");
  const [sqlResult, setSqlResult] = useState<Text2SQLResponse | null>(null);

  const sqlMutation = useMutation({
    mutationFn: (q: string) => api.text2sql(q),
    onSuccess: (data) => setSqlResult(data),
    onError: (err: any) => {
      setSqlResult({
        natural_query: query,
        generated_sql: "",
        is_safe: false,
        validation_error: err.response?.data?.detail || "SQL AST validation failed. Destructive statement blocked.",
        results: [],
        row_count: 0
      });
    }
  });

  const handleRun = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    sqlMutation.mutate(query.trim());
  };

  const sampleQueries = [
    "Show total documents by department",
    "List all users and their assigned roles",
    "Show total documents in each category",
    "Show all documents uploaded by admin"
  ];

  const destructiveTests = [
    "DROP TABLE documents;",
    "DELETE FROM users WHERE user_id = 1;",
    "UPDATE roles SET role_name = 'Admin';"
  ];

  return (
    <div className="space-y-6 select-none font-sans text-ink-black pb-12 max-w-5xl mx-auto">
      {/* Banner */}
      <div className="border border-ink-black/10 bg-white p-6 rounded-2xl shadow-sm space-y-2">
        <div className="flex items-center gap-2 font-space text-[10px] text-muted tracking-widest uppercase">
          <Terminal className="h-3.5 w-3.5 text-accent-orange" />
          <span>[ SAFE SQL COMPILATION ]</span>
          <span>//</span>
          <span className="text-accent-orange font-bold">AST Table Whitelisting & SELECT Enforcement</span>
        </div>
        <h1 className="text-3xl font-heading font-bold text-ink-black">
          Safe Text-to-SQL <span className="text-accent-orange italic font-normal">Terminal</span>
        </h1>
        <p className="text-xs font-space text-muted">
          Natural-language to PostgreSQL compiler. Enforces strict AST validation against 11 safe tables and views. Destructive commands (DROP, DELETE, UPDATE, ALTER) are blocked before reaching the database.
        </p>
      </div>

      {/* Query Terminal Input */}
      <div className="border border-ink-black/10 bg-white p-6 rounded-2xl shadow-sm space-y-4 font-space">
        <form onSubmit={handleRun} className="space-y-3">
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask an analytical question in plain English (or test a direct SQL query)..."
              className="w-full p-4 pr-32 border border-ink-black/15 rounded-xl text-xs font-mono focus:outline-none focus:border-accent-orange"
            />
            <button
              type="submit"
              disabled={sqlMutation.isPending || !query.trim()}
              className="absolute right-3 top-2.5 flex items-center gap-2 px-5 py-2 bg-ink-black text-beige-bg font-bold text-xs rounded-lg hover:bg-accent-orange transition-colors disabled:opacity-50"
            >
              <Play className="h-3.5 w-3.5" />
              <span>{sqlMutation.isPending ? "Validating..." : "Execute"}</span>
            </button>
          </div>
        </form>

        {/* Sample Safe Queries */}
        <div className="space-y-1.5 pt-1">
          <span className="text-[10px] text-muted uppercase font-bold tracking-wider">Safe Analytics Queries:</span>
          <div className="flex flex-wrap gap-2">
            {sampleQueries.map((sq, i) => (
              <button
                key={i}
                onClick={() => {
                  setQuery(sq);
                  sqlMutation.mutate(sq);
                }}
                className="px-3 py-1 bg-black/5 hover:bg-black/10 rounded-md text-[10px] text-muted hover:text-ink-black transition-colors"
              >
                "{sq}"
              </button>
            ))}
          </div>
        </div>

        {/* Destructive Injection Tests */}
        <div className="space-y-1.5 pt-2 border-t border-ink-black/5">
          <span className="text-[10px] text-red-600 uppercase font-bold flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            Test Destructive Query Injection Defense:
          </span>
          <div className="flex flex-wrap gap-2">
            {destructiveTests.map((dt, i) => (
              <button
                key={i}
                onClick={() => {
                  setQuery(dt);
                  sqlMutation.mutate(dt);
                }}
                className="px-3 py-1 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 rounded-md text-[10px] font-mono transition-colors"
              >
                {dt}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SQL Output Box */}
      {sqlResult && (
        <div className="border border-ink-black/10 bg-white p-6 rounded-2xl shadow-lg space-y-4 font-space">
          {/* Security Status Header */}
          <div className="flex items-center justify-between border-b border-ink-black/10 pb-3">
            <div className="flex items-center gap-2">
              {sqlResult.is_safe ? (
                <span className="flex items-center gap-1 px-3 py-1 bg-green-50 border border-green-200 text-green-700 text-xs font-bold rounded-lg">
                  <ShieldCheck className="h-4 w-4" />
                  AST VALIDATION: PASSED (READ-ONLY SELECT)
                </span>
              ) : (
                <span className="flex items-center gap-1 px-3 py-1 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-lg">
                  <ShieldAlert className="h-4 w-4" />
                  AST REJECTION: DESTRUCTIVE MUTATION BLOCKED
                </span>
              )}
            </div>

            <span className="text-xs text-muted font-mono">
              Rows: {sqlResult.row_count}
            </span>
          </div>

          {/* Validation Error Banner */}
          {sqlResult.validation_error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 font-mono">
              <strong>Error Rejection:</strong> {sqlResult.validation_error}
            </div>
          )}

          {/* Generated SQL Statement */}
          {sqlResult.generated_sql && (
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-[10px] text-muted uppercase font-bold">
                <Code2 className="h-3.5 w-3.5 text-accent-orange" />
                <span>Generated PostgreSQL Query:</span>
              </div>
              <pre className="p-4 bg-[#0F0F0F] text-[#F4F1E6] rounded-xl text-xs font-mono overflow-x-auto border border-black/20">
                {sqlResult.generated_sql}
              </pre>
            </div>
          )}

          {/* Tabular Results */}
          {sqlResult.results && sqlResult.results.length > 0 && (
            <div className="space-y-2 pt-2">
              <h4 className="text-xs uppercase font-bold text-muted tracking-wider">
                Execution Results from knowledgesphere_db:
              </h4>

              <div className="border border-ink-black/10 rounded-xl overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs font-mono">
                  <thead>
                    <tr className="bg-black/5 border-b border-ink-black/10 text-[10px] uppercase text-muted">
                      {Object.keys(sqlResult.results[0]).map((col) => (
                        <th key={col} className="p-3 font-bold">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-black/5">
                    {sqlResult.results.map((row, idx) => (
                      <tr key={idx} className="hover:bg-black/[0.02]">
                        {Object.values(row).map((val: any, cIdx) => (
                          <td key={cIdx} className="p-3 text-ink-black">{String(val)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
