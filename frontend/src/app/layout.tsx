"use client";

import React, { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/lib/auth";
import { CurtainLoader } from "@/components/ui/CurtainLoader";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <html lang="en">
      <head>
        <title>KnowledgeSphere AI | Enterprise Knowledge Intelligence Platform</title>
        <meta
          name="description"
          content="An AI-Powered Enterprise Knowledge Intelligence Platform combining PostgreSQL 18 3NF normalized schema, 384-dim dense vector search, grounded RAG copilot with verified citations, and safe Text-to-SQL analytics."
        />
      </head>
      <body>
        <CurtainLoader />
        <QueryClientProvider client={queryClient}>
          <AuthProvider>{children}</AuthProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}
