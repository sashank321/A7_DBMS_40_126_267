"use client";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function usePlatform() {
  const { data: health } = useQuery({ queryKey: ["system-health"], queryFn: api.getHealth, staleTime: 15000 });
  const pg = health?.components?.postgresql;
  const mongo = health?.components?.mongodb;
  const embeddings = health?.components?.embeddings;
  return {
    pgLabel: pg?.server_version ? `PostgreSQL ${pg.server_version}` : "PostgreSQL",
    mongoLabel: mongo?.server_version ? `MongoDB ${mongo.server_version}` : "MongoDB",
    embeddingLabel: embeddings?.dimensions ? `${embeddings.dimensions}-dim vectors` : "Semantic vectors",
    modelLabel: embeddings?.model || "Semantic embeddings",
    dimensions: embeddings?.dimensions,
  };
}

export function useDemoAccounts() {
  const { data = [] } = useQuery({ queryKey: ["demo-accounts"], queryFn: api.getDemoAccounts, enabled: Boolean(process.env.NEXT_PUBLIC_DEMO_PASSWORD), staleTime: 60000 });
  return data;
}
