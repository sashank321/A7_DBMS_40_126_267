"use client";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function LandingMetadata() {
  const { data } = useQuery({ queryKey: ["system-health"], queryFn: api.getHealth, staleTime: 15000 });
  useEffect(() => {
    const values: Record<string, string> = {
      postgres: data?.components?.postgresql?.server_version ? `PostgreSQL ${data.components.postgresql.server_version}` : "PostgreSQL",
      embeddings: data?.components?.embeddings?.dimensions ? `${data.components.embeddings.dimensions}-dim semantic vectors` : "Semantic vectors",
      model: data?.components?.embeddings?.model || "Configured semantic model",
      tables: data?.components?.postgresql?.public_tables != null ? `${data.components.postgresql.public_tables} relational tables` : "Relational tables",
      documents: String(data?.components?.postgresql?.document_count ?? "—"),
      entities: String(data?.components?.postgresql?.graph_entities ?? "—"),
      access: String(data?.components?.postgresql?.access_matrix_rows ?? "—"),
      version: data?.version || "—",
      health: data?.status || "Checking service health…",
      year: String(new Date().getFullYear()),
    };
    document.querySelectorAll<HTMLElement>("[data-live-metric]").forEach(element => { element.textContent = values[element.dataset.liveMetric!] || "Unavailable"; });
  }, [data]);
  return null;
}
