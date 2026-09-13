"use client";

import React, { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [conferenceCode, setConferenceCode] = useState("ICDCS-2026");

  return (
    <div className="relative min-h-screen bg-beige-bg text-ink-black flex flex-col font-sans selection:bg-accent-orange/30 selection:text-ink-black">
      <link rel="stylesheet" href="/browseros.css" />
      {/* Blueprint Grid Background */}
      <div 
        className="fixed inset-0 pointer-events-none z-0 opacity-20"
        style={{
          backgroundSize: "40px 40px",
          backgroundImage: "linear-gradient(to right, rgba(15,15,15,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(15,15,15,0.03) 1px, transparent 1px)"
        }}
      >
        {/* Subtle radial gradient to simulate screen glow in center */}
        <div className="absolute inset-0 bg-radial-gradient from-transparent to-beige-bg/80" />
      </div>
      
      {/* Subtle CRT Scanline overlay across whole app for consistency */}
      <div 
        className="fixed inset-0 pointer-events-none z-50 opacity-[0.03] mix-blend-overlay"
        style={{
          background: "linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))",
          backgroundSize: "100% 2px, 3px 100%"
        }}
      />

      {/* Top Navbar */}
      <div className="relative z-30">
        <Navbar
          activeConferenceCode={conferenceCode}
          onConferenceChange={setConferenceCode}
        />
      </div>

      {/* Main Workspace with Sidebar */}
      <div className="relative z-10 flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 p-6 overflow-y-auto max-h-[calc(100vh-4rem)]">
          {children}
        </main>
      </div>
    </div>
  );
}
