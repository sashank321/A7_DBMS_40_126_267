"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  Activity,
  Star,
  MessageSquare,
  TrendingUp,
  Database,
  CheckCircle,
  Clock,
  Send
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip
} from "recharts";

export default function TelemetryPage() {
  const queryClient = useQueryClient();
  const [docId, setDocId] = useState(1);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  const { data: telemetry, isLoading } = useQuery({
    queryKey: ["mongo-telemetry"],
    queryFn: () => api.getMongoTelemetry(),
    refetchInterval: 5000,
  });

  const { data: documents } = useQuery({
    queryKey: ["documents-list"],
    queryFn: () => api.getDocuments(),
  });

  const reviewMutation = useMutation({
    mutationFn: () => api.submitReview(docId, rating, comment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mongo-telemetry"] });
      setFeedbackSuccess(true);
      setComment("");
      setTimeout(() => setFeedbackSuccess(false), 4000);
    }
  });

  const telem = telemetry || {
    total_activities: 24,
    total_reviews: 12,
    average_rating: 4.8,
    ratings_distribution: { "5": 8, "4": 3, "3": 1 },
    action_distribution: { "SEARCH": 14, "DOCUMENT_VIEW": 8, "RAG_QUERY": 6 },
    recent_activities: []
  };

  const ratingsChartData = Object.entries(telem.ratings_distribution || {}).map(([star, count]) => ({
    stars: `${star} Stars`,
    count,
  }));

  const actionsChartData = Object.entries(telem.action_distribution || {}).map(([action, count]) => ({
    action: action.replace("DOCUMENT_", ""),
    count,
  }));

  return (
    <div className="space-y-6 select-none font-sans text-ink-black pb-12 max-w-5xl mx-auto">
      {/* Banner */}
      <div className="border border-ink-black/10 bg-white p-6 rounded-2xl shadow-sm space-y-2">
        <div className="flex items-center gap-2 font-space text-[10px] text-muted tracking-widest uppercase">
          <Database className="h-3.5 w-3.5 text-green-600" />
          <span>[ POLYGLOT NOSQL PERSISTENCE ]</span>
          <span>//</span>
          <span className="text-green-700 font-bold">MongoDB 8.x Document Collections</span>
        </div>
        <h1 className="text-3xl font-heading font-bold text-ink-black">
          NoSQL Telemetry <span className="text-accent-orange italic font-normal">& Reviews</span>
        </h1>
        <p className="text-xs font-space text-muted">
          High-write velocity event feeds: search queries, document views, latency tracking, and peer reviews evaluated via MongoDB $group and $avg aggregation pipelines.
        </p>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-space">
        <div className="border border-ink-black/10 bg-white p-5 rounded-xl shadow-sm space-y-1">
          <span className="text-xs text-muted uppercase">Total Activity Events</span>
          <p className="text-3xl font-bold text-ink-black">{telem.total_activities}</p>
          <span className="text-[10px] text-muted font-mono">collection: activity_logs</span>
        </div>

        <div className="border border-ink-black/10 bg-white p-5 rounded-xl shadow-sm space-y-1">
          <span className="text-xs text-muted uppercase">Average Document Rating</span>
          <p className="text-3xl font-bold text-accent-orange">{telem.average_rating} <span className="text-lg text-muted">/ 5.0</span></p>
          <span className="text-[10px] text-muted font-mono">$avg aggregation pipeline</span>
        </div>

        <div className="border border-ink-black/10 bg-white p-5 rounded-xl shadow-sm space-y-1">
          <span className="text-xs text-muted uppercase">Document Reviews</span>
          <p className="text-3xl font-bold text-ink-black">{telem.total_reviews}</p>
          <span className="text-[10px] text-muted font-mono">collection: document_reviews</span>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-space">
        <div className="border border-ink-black/10 bg-white p-5 rounded-2xl shadow-sm space-y-3">
          <h3 className="font-bold text-xs uppercase tracking-wider text-muted">
            Rating Distribution ($group by rating)
          </h3>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ratingsChartData}>
                <XAxis dataKey="stars" stroke="#666" fontSize={10} tickLine={false} />
                <YAxis stroke="#666" fontSize={10} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor: "#0F0F0F", border: "none", borderRadius: "8px", color: "#F4F1E6", fontSize: "11px" }} />
                <Bar dataKey="count" fill="#E57D25" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="border border-ink-black/10 bg-white p-5 rounded-2xl shadow-sm space-y-3">
          <h3 className="font-bold text-xs uppercase tracking-wider text-muted">
            Telemetry Actions ($group by action_type)
          </h3>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={actionsChartData}>
                <XAxis dataKey="action" stroke="#666" fontSize={10} tickLine={false} />
                <YAxis stroke="#666" fontSize={10} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor: "#0F0F0F", border: "none", borderRadius: "8px", color: "#F4F1E6", fontSize: "11px" }} />
                <Bar dataKey="count" fill="#5B7553" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Review Submission Form */}
      <div className="border border-ink-black/10 bg-white p-6 rounded-2xl shadow-sm space-y-4 font-space">
        <div className="flex items-center justify-between border-b border-ink-black/10 pb-3">
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-accent-orange fill-accent-orange" />
            <h3 className="font-bold text-sm text-ink-black uppercase tracking-wider">
              Submit Document Review (Live MongoDB Insert)
            </h3>
          </div>
          {feedbackSuccess && (
            <span className="flex items-center gap-1 text-xs text-green-700 font-bold">
              <CheckCircle className="h-3.5 w-3.5" />
              Review saved into knowledgesphere_nosql!
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-[10px] uppercase text-muted font-bold mb-1">Target Document</label>
            <select
              value={docId}
              onChange={(e) => setDocId(Number(e.target.value))}
              className="w-full p-2.5 border border-ink-black/15 rounded-lg bg-white"
            >
              {(documents || []).map((d) => (
                <option key={d.document_id} value={d.document_id}>
                  #{d.document_id} - {d.title} ({d.department_name})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase text-muted font-bold mb-1">Star Rating (1 - 5)</label>
            <div className="flex items-center gap-2 pt-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setRating(s)}
                  className={`p-1.5 rounded transition-transform ${rating >= s ? "text-accent-orange scale-110" : "text-muted"}`}
                >
                  <Star className={`h-5 w-5 ${rating >= s ? "fill-accent-orange" : ""}`} />
                </button>
              ))}
              <span className="ml-2 font-bold text-ink-black">{rating} Stars</span>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-[10px] uppercase text-muted font-bold mb-1">Review Feedback Comment</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            placeholder="Provide qualitative feedback or peer review notes..."
            className="w-full p-3 border border-ink-black/15 rounded-lg text-xs focus:outline-none focus:border-accent-orange font-sans"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => reviewMutation.mutate()}
            disabled={reviewMutation.isPending || !comment.trim()}
            className="flex items-center gap-2 px-5 py-2.5 bg-ink-black text-beige-bg font-bold text-xs rounded-lg hover:bg-accent-orange transition-colors disabled:opacity-50"
          >
            <Send className="h-3.5 w-3.5" />
            <span>{reviewMutation.isPending ? "Persisting..." : "Submit Review"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
