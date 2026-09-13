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
        <title>AllocFlow | Reviewer Assignment & Manuscript Allocation Platform</title>
        <meta
          name="description"
          content="Production-grade conference paper review-management and bipartite max-flow matching platform comparing Ford-Fulkerson, Edmonds-Karp, and Dinic algorithms."
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
