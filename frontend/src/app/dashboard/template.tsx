import React from "react";

export default function DashboardTemplate({ children }: { children: React.ReactNode }) {
  return (
    <div className="animate-dashboard-enter w-full h-full">
      {children}
    </div>
  );
}
