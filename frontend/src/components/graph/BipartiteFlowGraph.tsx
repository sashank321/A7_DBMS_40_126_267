"use client";

import React, { useState, useEffect } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  Info,
  Layers,
  Sparkles,
  Eye,
  Filter,
  Box,
} from "lucide-react";
import type { GraphVisualization, GraphNode, GraphEdge } from "@/types";

interface BipartiteFlowGraphProps {
  data: GraphVisualization | null;
  traces?: string[];
  algorithmName?: string;
  onEdgeClick?: (manuscriptId: string, reviewerId: string) => void;
}

export function BipartiteFlowGraph({
  data,
  traces = [],
  algorithmName = "Dinic",
  onEdgeClick,
}: BipartiteFlowGraphProps) {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [hoveredEdge, setHoveredEdge] = useState<GraphEdge | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [showOnlySaturated, setShowOnlySaturated] = useState<boolean>(false);
  const [is3DMode, setIs3DMode] = useState<boolean>(true);

  // Playback timer for execution trace player
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying && traces.length > 0) {
      timer = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= traces.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1200);
    }
    return () => clearInterval(timer);
  }, [isPlaying, traces.length]);

  if (!data || !data.nodes || data.nodes.length === 0) {
    return (
      <div className="flex h-80 w-full flex-col items-center justify-center rounded-2xl border border-ink-black/10 bg-black/5 backdrop-blur-xl text-muted-foreground">
        <Box className="h-10 w-10 mb-2 text-ink-black/80 opacity-60 animate-pulse-glow" />
        <p className="text-sm font-semibold text-ink-black">Flow Network Awaiting Simulation</p>
        <p className="text-xs text-muted-foreground mt-1 max-w-sm text-center">
          Execute a matching run or benchmark sweep to render the multi-stage 3D bipartite graph.
        </p>
      </div>
    );
  }

  // Partition nodes by column layer: Source (0), Manuscripts (1), Reviewers (2), Sink (3)
  const sourceNode = data.nodes.find((n) => n.type === "SOURCE");
  const manuscriptNodes = data.nodes.filter((n) => n.type === "MANUSCRIPT");
  const reviewerNodes = data.nodes.filter((n) => n.type === "REVIEWER");
  const sinkNode = data.nodes.find((n) => n.type === "SINK");

  const width = 920;
  const height = Math.max(500, Math.max(manuscriptNodes.length, reviewerNodes.length) * 62 + 70);

  const colX = {
    source: 90,
    manuscripts: 300,
    reviewers: 620,
    sink: 830,
  };

  // Compute node Y positions
  const nodePositions: Record<string, { x: number; y: number; node: GraphNode }> = {};

  if (sourceNode) {
    nodePositions[sourceNode.id] = { x: colX.source, y: height / 2, node: sourceNode };
  }

  const pGap = (height - 90) / Math.max(1, manuscriptNodes.length);
  manuscriptNodes.forEach((node, i) => {
    nodePositions[node.id] = {
      x: colX.manuscripts,
      y: 45 + i * pGap + pGap / 2,
      node,
    };
  });

  const rGap = (height - 90) / Math.max(1, reviewerNodes.length);
  reviewerNodes.forEach((node, i) => {
    nodePositions[node.id] = {
      x: colX.reviewers,
      y: 45 + i * rGap + rGap / 2,
      node,
    };
  });

  if (sinkNode) {
    nodePositions[sinkNode.id] = { x: colX.sink, y: height / 2, node: sinkNode };
  }

  // Filter edges based on toggle
  const visibleEdges = data.edges.filter((edge) => {
    if (showOnlySaturated) {
      return edge.flow > 0;
    }
    return true;
  });

  return (
    <div className="space-y-4 select-none">
      {/* 3D HUD Controls Header */}
      <div className="glass-panel p-4 flex flex-wrap items-center justify-between gap-4 border border-ink-black/10">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink-black/10 border border-ink-black/20 text-ink-black shadow-lg">
            <Box className="h-5 w-5 text-ink-black" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-ink-black tracking-wide">
                Bipartite Flow Topology
              </span>
              <span className="rounded-md bg-ink-black/10 px-2 py-0.5 text-[10px] font-mono text-ink-black/90 border border-ink-black/20">
                S → P → R → T
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {data.nodes.length} Vertices • {data.edges.length} Directed Capacities • Algorithm:{" "}
              <span className="text-ink-black font-medium">{algorithmName}</span>
            </p>
          </div>
        </div>

        {/* View & Filter Actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIs3DMode(!is3DMode)}
            className={`btn-3d flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
              is3DMode
                ? "bg-ink-black/20 text-ink-black border-ink-black/40 shadow-[0_0_20px_rgba(255,255,255,0.15)]"
                : "text-muted-foreground hover:text-ink-black"
            }`}
          >
            <Layers className="h-3.5 w-3.5 text-ink-black" />
            <span>{is3DMode ? "3D Isometric View" : "2D Ortho View"}</span>
          </button>

          <button
            onClick={() => setShowOnlySaturated(!showOnlySaturated)}
            className={`btn-3d flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
              showOnlySaturated
                ? "bg-emerald-500/20 text-emerald-200 border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                : "text-muted-foreground hover:text-ink-black"
            }`}
          >
            <Filter className="h-3.5 w-3.5 text-emerald-400" />
            <span>{showOnlySaturated ? "Saturated Flows Only" : "All Capacities"}</span>
          </button>
        </div>
      </div>

      {/* Graph Visualizer Stage */}
      <div className="glass-panel p-6 overflow-x-auto relative min-h-[500px] flex items-center justify-center border border-ink-black/10">
        <div className="w-full flex justify-center">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full max-w-[960px] h-auto"
          >
            <defs>
              {/* Monochromatic & Emerald Glow Filters */}
              <filter id="glow-white" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              <filter id="glow-purple" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              <filter id="glow-emerald" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              {/* Edge Marker Arrowheads */}
              <marker
                id="arrow-saturated"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="5"
                markerHeight="5"
                orient="auto-start-reverse"
              >
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#10B981" />
              </marker>

              <marker
                id="arrow-dim"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="4"
                markerHeight="4"
                orient="auto-start-reverse"
              >
                <path d="M 0 2 L 6 5 L 0 8 z" fill="#4B5563" />
              </marker>

              {/* Laser Beam Gradients */}
              <linearGradient id="laser-flow" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
                <stop offset="50%" stopColor="#10B981" stopOpacity="1" />
                <stop offset="100%" stopColor="#A855F7" stopOpacity="0.9" />
              </linearGradient>
            </defs>

            {/* Column Guide Track Lines */}
            <g opacity="0.15" stroke="#ffffff" strokeDasharray="4 8">
              <line x1={colX.source} y1="30" x2={colX.source} y2={height - 30} />
              <line x1={colX.manuscripts} y1="30" x2={colX.manuscripts} y2={height - 30} />
              <line x1={colX.reviewers} y1="30" x2={colX.reviewers} y2={height - 30} />
              <line x1={colX.sink} y1="30" x2={colX.sink} y2={height - 30} />
            </g>

            {/* EDGES LAYER */}
            <g>
              {visibleEdges.map((edge, idx) => {
                const uPos = nodePositions[edge.source];
                const vPos = nodePositions[edge.target];
                if (!uPos || !vPos) return null;

                const isSaturated = edge.flow > 0;
                const isHovered =
                  hoveredEdge?.source === edge.source &&
                  hoveredEdge?.target === edge.target;

                // Curved cubic bezier path for smooth flow aesthetic
                const dx = vPos.x - uPos.x;
                const pathData = `M ${uPos.x} ${uPos.y} C ${uPos.x + dx * 0.45} ${uPos.y}, ${
                  vPos.x - dx * 0.45
                } ${vPos.y}, ${vPos.x} ${vPos.y}`;

                return (
                  <g
                    key={`edge-${edge.source}-${edge.target}-${idx}`}
                    className="cursor-pointer transition-opacity"
                    onMouseEnter={() => setHoveredEdge(edge)}
                    onMouseLeave={() => setHoveredEdge(null)}
                    onClick={() => {
                      if (onEdgeClick && uPos.node.type === "MANUSCRIPT" && vPos.node.type === "REVIEWER") {
                        onEdgeClick(uPos.node.id, vPos.node.id);
                      }
                    }}
                  >
                    {/* Underlying Hover Hitbox */}
                    <path d={pathData} fill="none" stroke="transparent" strokeWidth="18" />

                    {/* Background Trace / Capacity Line */}
                    <path
                      d={pathData}
                      fill="none"
                      stroke={
                        isHovered
                          ? "#FFFFFF"
                          : isSaturated
                          ? "url(#laser-flow)"
                          : "#262626"
                      }
                      strokeWidth={isHovered ? 3.5 : isSaturated ? 2.5 : 1.2}
                      strokeOpacity={isHovered ? 1 : isSaturated ? 0.9 : 0.4}
                      markerEnd={isSaturated ? "url(#arrow-saturated)" : "url(#arrow-dim)"}
                    />

                    {/* Animated Flow Pulse on Saturated Edges */}
                    {isSaturated && (
                      <path
                        d={pathData}
                        fill="none"
                        stroke="#A7F3D0"
                        strokeWidth={isHovered ? 3 : 2}
                        className="flow-animate"
                        filter="url(#glow-emerald)"
                      />
                    )}
                  </g>
                );
              })}
            </g>

            {/* NODES LAYER */}
            <g>
              {Object.values(nodePositions).map(({ x, y, node }) => {
                const isSelected = selectedNode === node.id;
                const isSource = node.type === "SOURCE";
                const isSink = node.type === "SINK";
                const isManuscript = node.type === "MANUSCRIPT";
                const isReviewer = node.type === "REVIEWER";

                return (
                  <g
                    key={`node-${node.id}`}
                    className="cursor-pointer transition-transform duration-200 hover:scale-110"
                    onClick={() => setSelectedNode(isSelected ? null : node.id)}
                  >
                    {/* Node 3D Glass Badge Container */}
                    {isSource || isSink ? (
                      <g filter="url(#glow-white)">
                        <circle
                          cx={x}
                          cy={y}
                          r={isSelected ? 26 : 22}
                          fill={isSource ? "#262626" : "#065F46"}
                          stroke="#FFFFFF"
                          strokeWidth="2"
                          className="transition-all"
                        />
                        <text
                          x={x}
                          y={y + 4}
                          textAnchor="middle"
                          fill="#FFFFFF"
                          fontSize="10"
                          fontWeight="bold"
                          fontFamily="sans-serif"
                        >
                          {isSource ? "SOURCE" : "SINK"}
                        </text>
                      </g>
                    ) : isManuscript ? (
                      <g>
                        <rect
                          x={x - 85}
                          y={y - 18}
                          width="170"
                          height="36"
                          rx="10"
                          fill={isSelected ? "rgba(255, 255, 255, 0.25)" : "rgba(20, 20, 20, 0.85)"}
                          stroke={isSelected ? "#FFFFFF" : "rgba(255, 255, 255, 0.2)"}
                          strokeWidth={isSelected ? 2 : 1}
                          style={{ backdropFilter: "blur(10px)" }}
                        />
                        <circle cx={x - 70} cy={y} r="4" fill="#FFFFFF" />
                        <text
                          x={x - 58}
                          y={y - 2}
                          fill="#FFFFFF"
                          fontSize="10.5"
                          fontWeight="600"
                        >
                          {node.label.length > 20 ? node.label.substring(0, 19) + "…" : node.label}
                        </text>
                        <text
                          x={x - 58}
                          y={y + 11}
                          fill="#9CA3AF"
                          fontSize="9"
                          fontFamily="monospace"
                        >
                          Flow: {node.currentFlow} / {node.capacity}
                        </text>
                      </g>
                    ) : (
                      <g>
                        <rect
                          x={x - 85}
                          y={y - 18}
                          width="170"
                          height="36"
                          rx="10"
                          fill={isSelected ? "rgba(168, 85, 247, 0.4)" : "rgba(20, 20, 20, 0.85)"}
                          stroke={isSelected ? "#C084FC" : "rgba(255, 255, 255, 0.2)"}
                          strokeWidth={isSelected ? 2 : 1}
                          style={{ backdropFilter: "blur(10px)" }}
                        />
                        <circle cx={x - 70} cy={y} r="4" fill="#C084FC" />
                        <text
                          x={x - 58}
                          y={y - 2}
                          fill="#FFFFFF"
                          fontSize="10.5"
                          fontWeight="600"
                        >
                          {node.label.length > 20 ? node.label.substring(0, 19) + "…" : node.label}
                        </text>
                        <text
                          x={x - 58}
                          y={y + 11}
                          fill="#9CA3AF"
                          fontSize="9"
                          fontFamily="monospace"
                        >
                          Cap: {node.currentFlow} / {node.capacity}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </g>
          </svg>
        </div>
      </div>

      {/* Execution Trace Timeline Player */}
      {traces.length > 0 && (
        <div className="glass-panel p-4 space-y-3 border border-ink-black/10">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-400" />
              <span className="font-semibold text-ink-black">Augmentation Step Tracer</span>
              <span className="rounded bg-ink-black/10 px-2 py-0.5 text-[10px] text-muted-foreground">
                Step {currentStep + 1} of {traces.length}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
                disabled={currentStep === 0}
                className="btn-3d rounded-lg p-1 text-muted-foreground hover:text-ink-black disabled:opacity-30"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="btn-3d flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-ink-black"
              >
                {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                <span>{isPlaying ? "Pause" : "Play Replay"}</span>
              </button>
              <button
                onClick={() => setCurrentStep((prev) => Math.min(traces.length - 1, prev + 1))}
                disabled={currentStep >= traces.length - 1}
                className="btn-3d rounded-lg p-1 text-muted-foreground hover:text-ink-black disabled:opacity-30"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => {
                  setCurrentStep(0);
                  setIsPlaying(false);
                }}
                className="btn-3d rounded-lg p-1 text-muted-foreground hover:text-ink-black"
                title="Reset Replay"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-ink-black/10 bg-black/80 p-3 font-mono text-xs text-emerald-300">
            {traces[currentStep]}
          </div>
        </div>
      )}
    </div>
  );
}
