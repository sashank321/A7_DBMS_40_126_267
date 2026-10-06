"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Network, RefreshCw, Search, ArrowRight, X } from "lucide-react";

const colors: Record<string, string> = { PERSON: "#7B6B8A", DOCUMENT: "#E57D25", DEPARTMENT: "#47758C", TECHNOLOGY: "#5B7553", SYSTEM: "#5B7553", POLICY: "#A46D50", PROJECT: "#74634F" };
const color = (type: string) => colors[type.toUpperCase()] || "#637080";

export default function GraphViewPage() {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [neighborsOnly, setNeighborsOnly] = useState(false);
  const [zoom, setZoom] = useState(1);
  const { data, isLoading, isFetching, error, refetch } = useQuery({ queryKey: ["knowledge-graph"], queryFn: () => api.getGraph(500) });
  const nodes = data?.nodes || [];
  const edges = data?.edges || [];
  const selected = nodes.find(node => node.id === selectedId);
  useEffect(() => { if (data && selectedId !== null && !data.nodes.some(n => n.id === selectedId)) { setSelectedId(null); setNeighborsOnly(false); } }, [data, selectedId]);
  const linked = edges.filter(edge => edge.source === selectedId || edge.target === selectedId);
  const connected = new Set<number>(selectedId === null ? [] : [selectedId, ...linked.flatMap(edge => [edge.source, edge.target])]);
  const types = Array.from(new Set(nodes.map(node => node.type))).sort();
  const visibleNodes = nodes.filter(node => (!type || node.type === type) && (!neighborsOnly || selectedId === null || connected.has(node.id)));
  const visibleIds = new Set(visibleNodes.map(node => node.id));
  const visibleEdges = edges.filter(edge => visibleIds.has(edge.source) && visibleIds.has(edge.target));
  const listNodes = visibleNodes.filter(node => `${node.name} ${node.type}`.toLowerCase().includes(search.trim().toLowerCase()));
  const byId = new Map(nodes.map(node => [node.id, node]));
  const layout = useMemo(() => {
    const grouped = new Map<string, typeof visibleNodes>();
    visibleNodes.forEach(node => grouped.set(node.type, [...(grouped.get(node.type) || []), node]));
    const columns = Array.from(grouped.entries());
    const height = Math.max(360, ...columns.map(([, values]) => values.length * 66 + 100));
    const width = Math.max(660, columns.length * 220 + 40);
    const positions = new Map<number, { x: number; y: number }>();
    columns.forEach(([, values], column) => values.forEach((node, row) => positions.set(node.id, { x: 130 + column * 220, y: 85 + row * 66 })));
    return { positions, columns, width, height };
  }, [data, type, neighborsOnly, selectedId]);
  const select = (id: number) => { setSelectedId(id); setSearch(""); };

  return (
    <div className="space-y-5 text-ink-black pb-12 max-w-7xl mx-auto">
      <header className="flex flex-wrap items-center justify-between gap-4 bg-white border border-ink-black/10 p-6 rounded-2xl">
        <div><h1 className="flex items-center gap-3 text-3xl font-heading font-bold"><Network className="h-6 w-6 text-accent-orange" />Knowledge Graph Explorer</h1><p className="mt-2 text-sm text-muted">Select an entity to inspect its description and incoming or outgoing connections. Your document permissions apply.</p></div>
        <button onClick={() => refetch()} disabled={isFetching} className="flex items-center gap-2 border rounded-lg px-4 py-2 text-sm disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />{isFetching ? "Refreshing…" : "Refresh Graph"}</button>
      </header>
      {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 text-red-800 p-4">Unable to load the graph. Check your connection and use Refresh Graph.</div>}
      {isLoading ? <p role="status" className="p-8">Loading authorized entities and relationships…</p> : nodes.length === 0 ? <p className="bg-white border rounded-xl p-8">No graph entities are available for your current document permissions.</p> : <>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <label className="flex items-center gap-2"><span>Entity type</span><select aria-label="Filter entity type" value={type} onChange={e => setType(e.target.value)} className="bg-white border rounded-lg p-2"><option value="">All types</option>{types.map(t => <option key={t}>{t}</option>)}</select></label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={neighborsOnly} disabled={!selected} onChange={e => setNeighborsOnly(e.target.checked)} />Selected entity and connections only</label>
          <span className="text-muted ml-auto">{visibleNodes.length} entities · {visibleEdges.length} relationships</span>
        </div>
        <div className="grid xl:grid-cols-[minmax(0,1fr)_320px] gap-5">
          <section aria-label="Connected knowledge graph" className="min-w-0 bg-white border border-ink-black/10 rounded-2xl overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b"><h2 className="font-bold">Connected graph</h2><div className="flex items-center gap-2"><button aria-label="Zoom out" disabled={zoom <= 0.6} onClick={() => setZoom(z => Math.max(0.6, z - 0.2))} className="border rounded px-3 py-1">−</button><button aria-label="Reset graph zoom" onClick={() => setZoom(1)} className="text-xs px-2">{Math.round(zoom * 100)}%</button><button aria-label="Zoom in" disabled={zoom >= 1.8} onClick={() => setZoom(z => Math.min(1.8, z + 0.2))} className="border rounded px-3 py-1">+</button></div></div>
            <div className="overflow-auto max-h-[520px]" tabIndex={0} aria-label="Scrollable graph canvas">
              <svg width={layout.width * zoom} height={layout.height * zoom} viewBox={`0 0 ${layout.width} ${layout.height}`} style={{ width: layout.width * zoom, height: layout.height * zoom, maxWidth: "none" }} aria-label="Entity relationship diagram">
                <defs><marker id="graph-arrow" markerWidth="8" markerHeight="8" refX="8" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8" fill="#687481" /></marker></defs>
                {layout.columns.map(([group], column) => <text key={group} x={130 + column * 220} y={32} textAnchor="middle" fill={color(group)} style={{ fontSize: 12, fontWeight: 700 }}>{group}</text>)}
                {visibleEdges.map((edge, index) => {
                  const from = layout.positions.get(edge.source)!, to = layout.positions.get(edge.target)!;
                  const active = selectedId !== null && (edge.source === selectedId || edge.target === selectedId);
                  const direction = to.x >= from.x ? 1 : -1;
                  const sx = from.x + 86 * direction, tx = to.x - 90 * direction;
                  const bend = from.x === to.x ? 145 : (sx + tx) / 2;
                  const d = from.x === to.x ? `M${sx},${from.y} C${sx + bend},${from.y} ${tx + bend},${to.y} ${tx},${to.y}` : `M${sx},${from.y} C${bend},${from.y} ${bend},${to.y} ${tx},${to.y}`;
                  return <g key={`${edge.source}-${edge.target}-${edge.relation}-${index}`} opacity={selectedId === null || active ? 1 : 0.16}><path d={d} fill="none" stroke={active ? "#E57D25" : "#9CA6AF"} strokeWidth={active ? 2.5 : 1.3} markerEnd="url(#graph-arrow)"><title>{byId.get(edge.source)?.name} → {edge.relation} → {byId.get(edge.target)?.name}</title></path>{active && <text x={(from.x + to.x) / 2} y={(from.y + to.y) / 2 - 8} textAnchor="middle" fill="#744017" stroke="white" strokeWidth="3" paintOrder="stroke" style={{ fontSize: 10, fontWeight: 700 }}>{edge.relation}</text>}</g>;
                })}
                {visibleNodes.map(node => {
                  const position = layout.positions.get(node.id)!;
                  const active = node.id === selectedId;
                  return <g key={node.id} role="button" tabIndex={0} aria-label={`Inspect ${node.name}`} aria-pressed={active} onClick={() => select(node.id)} onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); select(node.id); } }} style={{ cursor: "pointer", outlineOffset: 3 }} opacity={selectedId === null || connected.has(node.id) ? 1 : 0.32} transform={`translate(${position.x},${position.y})`}><title>{node.name}</title><rect x="-86" y="-22" width="172" height="44" rx="9" fill={active ? "#FFF1E4" : "#FFFFFF"} stroke={active ? "#E57D25" : color(node.type)} strokeWidth={active ? 3 : 1.5} /><circle cx="-70" cy="0" r="4" fill={color(node.type)} /><text x="-59" y="4" fill="#0F0F0F" style={{ fontSize: 11, fontWeight: active ? 700 : 500 }}>{node.name.length > 20 ? node.name.slice(0, 19) + "…" : node.name}</text></g>;
                })}
              </svg>
            </div>
            <p className="px-4 py-3 text-xs text-muted border-t">Arrowheads show relationship direction. Scroll to explore; select a node to highlight its connections.</p>
          </section>
          <aside aria-label="Entity inspector" className="bg-white border border-ink-black/10 rounded-2xl p-5 min-w-0">
            <div className="flex items-center justify-between"><h2 className="font-bold">Entity details</h2>{selected && <button aria-label="Clear selected entity" onClick={() => { setSelectedId(null); setNeighborsOnly(false); }} className="p-1"><X className="h-4 w-4" /></button>}</div>
            {selected ? <div className="space-y-4 mt-4"><span className="text-xs font-bold" style={{ color: color(selected.type) }}>{selected.type} · #{selected.id}</span><h3 className="font-heading text-xl font-bold break-words">{selected.name}</h3><p className="text-sm text-muted break-words">{selected.description || "No description has been added."}</p><h4 className="font-bold text-sm">Connections ({linked.length})</h4>{linked.length === 0 && <p className="text-sm text-muted">This entity has no relationships yet.</p>}<div className="space-y-3 max-h-80 overflow-y-auto">{linked.map((edge, i) => {
              const outgoing = edge.source === selected.id;
              const other = byId.get(outgoing ? edge.target : edge.source);
              return <div key={`${edge.source}-${edge.target}-${edge.relation}-${i}`} className="border rounded-lg p-3 text-xs"><p className="text-muted mb-2">{outgoing ? "Outgoing" : "Incoming"} · {edge.relation.replaceAll("_", " ")} · weight {edge.weight}</p>{other && <button className="font-bold text-left hover:underline break-words" onClick={() => { setType(""); select(other.id); }}>{other.name} <ArrowRight className="inline h-3 w-3" /></button>}</div>;
            })}</div></div> : <p className="mt-4 text-sm text-muted">Choose an entity in the diagram or list to see its full name, description, and connected entities.</p>}
          </aside>
        </div>
        <section className="bg-white border border-ink-black/10 rounded-2xl p-5"><div className="flex flex-wrap gap-4 justify-between items-center"><h2 className="font-bold">Entities ({listNodes.length})</h2><label className="flex items-center gap-2"><Search className="h-4 w-4 text-muted" /><input aria-label="Search graph entities" placeholder="Find an entity…" value={search} onChange={event => setSearch(event.target.value)} className="border rounded-lg px-3 py-2 text-sm" /></label></div><div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">{listNodes.map(node => <button key={node.id} aria-label={`Select ${node.name}`} aria-pressed={node.id === selectedId} onClick={() => select(node.id)} className={`text-left border rounded-xl p-3 ${node.id === selectedId ? "border-accent-orange bg-orange-50" : "border-ink-black/10 hover:border-accent-orange"}`}><span className="text-[10px] font-bold" style={{ color: color(node.type) }}>{node.type}</span><p className="text-sm font-bold mt-1 break-words">{node.name}</p></button>)}</div>{listNodes.length === 0 && <p className="mt-4 text-sm text-muted">No entities match your search or filters.</p>}</section>
      </>}
    </div>
  );
}
