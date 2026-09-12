"use client";

import React from "react";
import GlassSurface from "./GlassSurface";

interface Card3DProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  glowColor?: "white" | "purple" | "emerald" | "amber" | "none";
  borderRadius?: number;
  backgroundOpacity?: number;
  saturation?: number;
}

export function Card3D({
  children,
  className = "",
  glowColor = "none",
  ...props
}: Card3DProps) {
  // Map glow colors to the exact feature section pastel palette
  const getBackgroundColor = () => {
    switch (glowColor) {
      case "amber": return "#C1847B"; // Pinkish
      case "white": return "#5D6D7E"; // Steel blue
      case "emerald": return "#7A9478"; // Sage green
      case "purple": return "#8B8589"; // Purple-gray
      default: return "#FFFFFF"; // Clean white fallback
    }
  };

  const bgColor = getBackgroundColor();
  
  return (
    <div 
      className={`relative overflow-hidden transition-all duration-300 shadow-2xl hover:shadow-[0_35px_60px_-15px_rgba(0,0,0,0.4)] hover:-translate-y-1 ${className}`}
      style={{
        backgroundColor: bgColor,
        border: "1px solid rgba(0,0,0,0.1)",
        color: "#0F0F0F",
        borderRadius: "16px"
      }}
      {...props}
    >
      <div className="w-full h-full relative z-10">
        {children}
      </div>
    </div>
  );
}

export { GlassSurface };
