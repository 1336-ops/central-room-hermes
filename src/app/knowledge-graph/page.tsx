"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { Search, Filter, RefreshCw, ZoomIn, ZoomOut, Maximize2 } from "lucide-react"

interface GraphNode {
  id: number
  uid: string
  type: string
  label: string
  properties: Record<string, any>
  source: string
  x?: number
  y?: number
  vx?: number
  vy?: number
  fx?: number | null
  fy?: number | null
}

interface GraphEdge {
  id: number
  uid: string
  source_uid: string
  target_uid: string
  type: string
  source?: GraphNode
  target?: GraphNode
}

interface GraphData {
  nodes: GraphNode[]
  edges: GraphEdge[]
}

interface GraphStats {
  total_nodes: number
  total_edges: number
  node_types: Record<string, number>
  edge_types: Record<string, number>
}

const TYPE_COLORS: Record<string, string> = {
  Agent: "#38bdf8",
  Topic: "#a78bfa",
  Fact: "#34d399",
  Resource: "#fb923c",
  Perkara: "#f472b6",
  Terdakwa: "#e879f9",
  Pasal: "#fbbf24",
  Sidang: "#6ee7b7",
  Putusan: "#f87171",
  Dokumen: "#60a5fa",
}

const API = "/graph-api"

function getColor(type: string): string {
  return TYPE_COLORS[type] || "#94a3b8"
}

function getRadius(type: string): number {
  if (type === "Agent") return 16
  if (type === "Topic") return 10
  return 7
}

export default function KnowledgeGraphPage() {
  const svgRef = useRef<SVGSVGElement>(null)
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], edges: [] })
  const [stats, setStats] = useState<GraphStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("")
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 })
  const simRef = useRef<any>(null)
  const isDragging = useRef(false)
  const lastPos = useRef({ x: 0, y: 0 })

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const [graphRes, statsRes] = await Promise.all([
        fetch(`${API}/api/graph`),
        fetch(`${API}/api/graph/stats`),
      ])
      if (!graphRes.ok) throw new Error("API offline")
      const graph = await graphRes.json()
      const statsData = await statsRes.json()
      setGraphData(graph)
      setStats(statsData)
    } catch (e: any) {
      setError(e.message || "Failed to load graph")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  // Simple force simulation
  useEffect(() => {
    if (!graphData.nodes.length) return

    const nodes = graphData.nodes.map(n => ({ ...n }))
    const edges = graphData.edges.map(e => ({
      ...e,
      source: nodes.find(n => n.uid === e.source_uid),
      target: nodes.find(n => n.uid === e.target_uid),
    })).filter(e => e.source && e.target)

    const W = 900, H = 700
    nodes.forEach(n => {
      if (!n.x) n.x = Math.random() * W
      if (!n.y) n.y = Math.random() * H
      n.vx = 0; n.vy = 0
    })

    let frame: number
    const tick = () => {
      const alpha = 0.3
      // Repulsion
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = (nodes[j].x || 0) - (nodes[i].x || 0)
          const dy = (nodes[j].y || 0) - (nodes[i].y || 0)
          const dist = Math.sqrt(dx * dx + dy * dy) || 1
          const force = -800 / (dist * dist)
          nodes[i].vx = (nodes[i].vx || 0) + (dx / dist) * force * alpha
          nodes[i].vy = (nodes[i].vy || 0) + (dy / dist) * force * alpha
          nodes[j].vx = (nodes[j].vx || 0) - (dx / dist) * force * alpha
          nodes[j].vy = (nodes[j].vy || 0) - (dy / dist) * force * alpha
        }
      }
      // Attraction (edges)
      edges.forEach(e => {
        if (!e.source || !e.target) return
        const dx = (e.target.x || 0) - (e.source.x || 0)
        const dy = (e.target.y || 0) - (e.source.y || 0)
        const dist = Math.sqrt(dx * dx + dy * dy) || 1
        const force = (dist - 100) * 0.05
        e.source.vx = (e.source.vx || 0) + (dx / dist) * force
        e.source.vy = (e.source.vy || 0) + (dy / dist) * force
        e.target.vx = (e.target.vx || 0) - (dx / dist) * force
        e.target.vy = (e.target.vy || 0) - (dy / dist) * force
      })
      // Center gravity
      nodes.forEach(n => {
        n.vx = (n.vx || 0) + (W / 2 - (n.x || 0)) * 0.002
        n.vy = (n.vy || 0) + (H / 2 - (n.y || 0)) * 0.002
        if (n.fx != null) { n.x = n.fx; n.vx = 0 }
        if (n.fy != null) { n.y = n.fy; n.vy = 0 }
        n.x = (n.x || 0) + (n.vx || 0) * 0.6
        n.y = (n.y || 0) + (n.vy || 0) * 0.6
        n.vx = (n.vx || 0) * 0.8
        n.vy = (n.vy || 0) * 0.8
      })
      setGraphData({ nodes: [...nodes], edges: [...edges] as any })
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    simRef.current = { nodes, edges, stop: () => cancelAnimationFrame(frame) }
    return () => cancelAnimationFrame(frame)
  }, [graphData.nodes.length])

  const filteredNodes = graphData.nodes.filter(n => {
    const matchSearch = !search || n.label.toLowerCase().includes(search.toLowerCase())
    const matchType = !typeFilter || n.type === typeFilter
    return matchSearch && matchType
  })
  const filteredUids = new Set(filteredNodes.map(n => n.uid))
  const filteredEdges = (graphData.edges as any[]).filter(
    e => filteredUids.has(e.source?.uid || e.source_uid) && filteredUids.has(e.target?.uid || e.target_uid)
  )

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setTransform(t => ({ ...t, k: Math.max(0.1, Math.min(5, t.k * delta)) }))
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as SVGElement).tagName === "circle") return
    isDragging.current = true
    lastPos.current = { x: e.clientX, y: e.clientY }
  }
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return
    const dx = e.clientX - lastPos.current.x
    const dy = e.clientY - lastPos.current.y
    lastPos.current = { x: e.clientX, y: e.clientY }
    setTransform(t => ({ ...t, x: t.x + dx, y: t.y + dy }))
  }
  const handleMouseUp = () => { isDragging.current = false }

  const nodeTypes = stats ? Object.keys(stats.node_types) : []

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/80 backdrop-blur px-6 py-3 flex items-center gap-4 flex-wrap">
        <h1 className="text-sky-400 font-semibold text-lg whitespace-nowrap">🧠 Legal Knowledge Graph</h1>
        <div className="relative">
          <Search className="absolute left-2 top-2 w-4 h-4 text-slate-500" />
          <input
            className="bg-slate-800 border border-slate-700 text-slate-200 pl-8 pr-3 py-1.5 rounded-md text-sm w-48 focus:outline-none focus:border-sky-500"
            placeholder="Search nodes..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="bg-slate-800 border border-slate-700 text-slate-200 px-3 py-1.5 rounded-md text-sm focus:outline-none"
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
        >
          <option value="">All Types</option>
          {nodeTypes.map(t => (
            <option key={t} value={t}>{t} ({stats?.node_types[t]})</option>
          ))}
        </select>
        <button onClick={fetchData} className="flex items-center gap-1 text-slate-400 hover:text-sky-400 text-sm">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
        {stats && (
          <span className="text-slate-500 text-xs ml-auto">
            <strong className="text-sky-400">{stats.total_nodes}</strong> nodes ·{" "}
            <strong className="text-sky-400">{stats.total_edges}</strong> edges
          </span>
        )}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Graph Canvas */}
        <div className="flex-1 relative overflow-hidden"
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{ cursor: isDragging.current ? "grabbing" : "grab" }}
        >
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center text-slate-400">
              Loading graph...
            </div>
          )}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center text-red-400">
              ❌ {error} — pastikan API berjalan di port 8765
            </div>
          )}
          {!loading && !error && (
            <svg ref={svgRef} width="100%" height="100%">
              <g transform={`translate(${transform.x},${transform.y}) scale(${transform.k})`}>
                {/* Edges */}
                {filteredEdges.map((e: any) => (
                  <line
                    key={e.uid}
                    x1={e.source?.x || 0} y1={e.source?.y || 0}
                    x2={e.target?.x || 0} y2={e.target?.y || 0}
                    stroke="#334155" strokeWidth={1} opacity={0.6}
                  />
                ))}
                {/* Nodes */}
                {filteredNodes.map(n => (
                  <g
                    key={n.uid}
                    transform={`translate(${n.x || 0},${n.y || 0})`}
                    style={{ cursor: "pointer" }}
                    onClick={() => setSelectedNode(n)}
                  >
                    <circle
                      r={getRadius(n.type)}
                      fill={getColor(n.type)}
                      stroke="#0f172a"
                      strokeWidth={2}
                      opacity={selectedNode && selectedNode.uid !== n.uid ? 0.6 : 1}
                    />
                    <text
                      dy={-getRadius(n.type) - 4}
                      textAnchor="middle"
                      fill="#94a3b8"
                      fontSize={9}
                    >
                      {n.label.length > 18 ? n.label.slice(0, 18) + "…" : n.label}
                    </text>
                  </g>
                ))}
              </g>
            </svg>
          )}

          {/* Legend */}
          <div className="absolute bottom-4 left-4 bg-slate-900/90 rounded-lg p-3 text-xs space-y-1">
            {Object.entries(TYPE_COLORS).slice(0, 6).map(([type, color]) => (
              <div key={type} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                <span className="text-slate-400">{type}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Detail Panel */}
        {selectedNode && (
          <div className="w-72 border-l border-slate-800 bg-slate-900 p-4 overflow-y-auto">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h2 className="text-sky-400 font-semibold text-sm">{selectedNode.label}</h2>
                <span className="text-xs" style={{ color: getColor(selectedNode.type) }}>
                  {selectedNode.type}
                </span>
                <span className="text-slate-500 text-xs"> · {selectedNode.source}</span>
              </div>
              <button onClick={() => setSelectedNode(null)} className="text-slate-500 hover:text-slate-300 text-lg leading-none">×</button>
            </div>
            <div className="space-y-2">
              {Object.entries(selectedNode.properties || {}).map(([k, v]) => (
                <div key={k} className="border-b border-slate-800 pb-1">
                  <div className="text-slate-500 text-xs">{k}</div>
                  <div className="text-slate-300 text-xs break-all">{String(v).slice(0, 200)}</div>
                </div>
              ))}
            </div>
            <div className="mt-3 text-slate-500 text-xs">
              UID: {selectedNode.uid.slice(0, 40)}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
