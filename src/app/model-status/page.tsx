"use client"
import { useEffect, useState, useCallback } from "react"
import { RefreshCw, CheckCircle, XCircle, Clock, Zap, Search } from "lucide-react"
import { useProfile } from "@/lib/profile-context"
import { cn } from "@/lib/utils"

interface ModelStatus {
  id: string
  alias: string
  provider: string
  isPrimary: boolean
  isFallback: boolean
  status: "online" | "offline" | "testing" | "unknown"
  latency: number | null
  error: string | null
  lastChecked: string | null
  inferenceTime: number | null
  tokensPerSecond: number | null
  httpStatus: number | null
  uptimePercent: number
  history: { time: string; ok: boolean; latency: number | null }[]
}

interface StatusResponse {
  models: ModelStatus[]
  lastUpdated: string
}

function Sparkline({ history }: { history: { ok: boolean; latency: number | null }[] }) {
  if (!history?.length) return <span className="text-slate-700 text-xs">—</span>
  const last = history.slice(-12)
  return (
    <div className="flex items-end gap-0.5 h-5">
      {last.map((h, i) => (
        <div key={i} className={cn("w-1.5 rounded-sm", h.ok ? "bg-emerald-500" : "bg-red-500")}
          style={{ height: h.ok ? `${Math.min(100, Math.max(20, 100 - (h.latency || 500) / 20))}%` : "30%" }} />
      ))}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, string> = {
    online:  "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    offline: "bg-red-500/10 text-red-400 border-red-500/20",
    testing: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    unknown: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  }
  return (
    <span className={cn("px-2 py-0.5 rounded-full text-xs border font-medium", cfg[status] || cfg.unknown)}>
      {status}
    </span>
  )
}

export default function ModelStatusPage() {
  const { profile } = useProfile()
  const [data, setData] = useState<StatusResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [testing, setTesting] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<"all" | "online" | "offline">("all")

  const load = useCallback(() => {
    fetch("/dashboard/api/model-status", { method: "GET" })
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(d => { setData(d); setLoading(false) })
      .catch(() => {
        // fallback: ambil dari models-list
        fetch(`/dashboard/api/models-list?profile=${profile}`)
          .then(r => r.json())
          .then(d => {
            const models = (d.models || d || []).map((m: any) => ({
              id: m.model || m.id || m.name,
              alias: m.name || m.alias || m.model,
              provider: m.provider || "custom",
              isPrimary: m.isPrimary || false,
              isFallback: m.isFallback || false,
              status: "unknown" as const,
              latency: null, error: null, lastChecked: null,
              inferenceTime: null, tokensPerSecond: null, httpStatus: null,
              uptimePercent: 0, history: [],
            }))
            setData({ models, lastUpdated: new Date().toISOString() })
            setLoading(false)
          })
          .catch(() => setLoading(false))
      })
  }, [profile])

  useEffect(() => { load() }, [load])

  const testModel = async (modelId: string) => {
    setTesting(prev => new Set(prev).add(modelId))
    try {
      const res = await fetch("/dashboard/api/model-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modelId, profile }),
      })
      const result = await res.json()
      setData(prev => {
        if (!prev) return prev
        return {
          ...prev,
          models: prev.models.map(m => m.id === modelId ? {
            ...m,
            status: result.ok ? "online" : "offline",
            latency: result.latency,
            error: result.error,
            httpStatus: result.httpStatus,
            lastChecked: result.time,
            history: [...(m.history || []), { time: result.time, ok: result.ok, latency: result.latency }].slice(-20),
          } : m)
        }
      })
    } finally {
      setTesting(prev => { const s = new Set(prev); s.delete(modelId); return s })
    }
  }

  const filtered = (data?.models || []).filter(m => {
    const matchSearch = !search || m.alias?.toLowerCase().includes(search.toLowerCase()) || m.id?.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === "all" || m.status === filter
    return matchSearch && matchFilter
  })

  const stats = {
    total: data?.models.length || 0,
    online: data?.models.filter(m => m.status === "online").length || 0,
    offline: data?.models.filter(m => m.status === "offline").length || 0,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-white">Model Health</h1>
          <p className="text-slate-500 text-sm mt-0.5">Status & latency semua model</p>
        </div>
        <button onClick={load} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg transition-colors">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Model", value: stats.total, color: "text-white" },
          { label: "Online", value: stats.online, color: "text-emerald-400" },
          { label: "Offline", value: stats.offline, color: "text-red-400" },
        ].map(s => (
          <div key={s.label} className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-center">
            <p className={cn("text-2xl font-bold", s.color)}>{s.value}</p>
            <p className="text-slate-500 text-xs mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter & Search */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-500" />
          <input
            className="bg-slate-800 border border-slate-700 text-slate-200 pl-8 pr-3 py-1.5 rounded-lg text-xs w-48 focus:outline-none focus:border-sky-500"
            placeholder="Cari model..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        {(["all", "online", "offline"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize",
              filter === f ? "bg-sky-500/20 text-sky-400 border border-sky-500/30" : "bg-slate-800 text-slate-400 hover:text-slate-300"
            )}>
            {f}
          </button>
        ))}
      </div>

      {/* Model List */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl h-16 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
          <p className="text-slate-500">Tidak ada model ditemukan</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(m => (
            <div key={m.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-slate-200 text-sm font-medium truncate">{m.alias || m.id}</span>
                  {m.isPrimary && <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-xs">primary</span>}
                  {m.isFallback && <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded text-xs">fallback</span>}
                  <StatusBadge status={m.status} />
                </div>
                <p className="text-slate-600 text-xs mt-0.5 font-mono truncate">{m.id}</p>
              </div>

              <div className="flex items-center gap-4 text-xs">
                {m.latency !== null && (
                  <div className="text-center">
                    <p className="text-slate-300 font-mono">{m.latency}ms</p>
                    <p className="text-slate-600">latency</p>
                  </div>
                )}
                {m.uptimePercent > 0 && (
                  <div className="text-center">
                    <p className="text-slate-300 font-mono">{m.uptimePercent.toFixed(0)}%</p>
                    <p className="text-slate-600">uptime</p>
                  </div>
                )}
                <Sparkline history={m.history} />
              </div>

              <button
                onClick={() => testModel(m.id)}
                disabled={testing.has(m.id)}
                className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border",
                  testing.has(m.id)
                    ? "bg-slate-800 text-slate-500 border-slate-700 cursor-wait"
                    : "bg-sky-500/10 text-sky-400 border-sky-500/20 hover:bg-sky-500/20"
                )}
              >
                {testing.has(m.id) ? <><RefreshCw className="w-3 h-3 animate-spin" /> Testing...</> : <><Zap className="w-3 h-3" /> Test</>}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
