"use client"
import { useEffect, useState, useCallback } from "react"
import { ScrollText, AlertTriangle, Info, CheckCircle, XCircle, RefreshCw, Trash2, Search } from "lucide-react"
import { cn } from "@/lib/utils"

interface LogEntry {
  id: string
  level: "info" | "warn" | "error" | "success"
  source: string
  message: string
  time: string
  timestamp: string
}

const LEVEL_CFG = {
  info:    { icon: Info,          color: "text-blue-400",    bg: "bg-blue-400/10",    border: "border-blue-400/20",    dot: "bg-blue-400" },
  warn:    { icon: AlertTriangle, color: "text-amber-400",   bg: "bg-amber-400/10",   border: "border-amber-400/20",   dot: "bg-amber-400" },
  error:   { icon: XCircle,       color: "text-red-400",     bg: "bg-red-400/10",     border: "border-red-400/20",     dot: "bg-red-400" },
  success: { icon: CheckCircle,   color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/20", dot: "bg-emerald-400" },
}

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>("all")
  const [search, setSearch] = useState("")
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [clearing, setClearing] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const load = useCallback(() => {
    fetch("/dashboard/api/logs")
      .then(r => r.json())
      .then(d => { setLogs(Array.isArray(d) ? d : d.logs || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
    if (!autoRefresh) return
    const t = setInterval(load, 5000)
    return () => clearInterval(t)
  }, [load, autoRefresh])

  const clearLogs = async () => {
    setClearing(true)
    try {
      await fetch("/dashboard/api/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "clear-logs" }),
      })
      setLogs([])
      showToast("Logs berhasil dihapus")
    } catch {
      showToast("Gagal hapus logs")
    } finally {
      setClearing(false)
    }
  }

  const filtered = logs.filter(l => {
    const matchLevel = filter === "all" || l.level === filter
    const matchSearch = !search || l.message.toLowerCase().includes(search.toLowerCase()) || l.source?.toLowerCase().includes(search.toLowerCase())
    return matchLevel && matchSearch
  })

  const counts = {
    all: logs.length,
    info: logs.filter(l => l.level === "info").length,
    warn: logs.filter(l => l.level === "warn").length,
    error: logs.filter(l => l.level === "error").length,
    success: logs.filter(l => l.level === "success").length,
  }

  return (
    <div className="space-y-5">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-slate-800 border border-slate-700 text-slate-200 text-sm px-4 py-2.5 rounded-lg shadow-lg">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-white">Logs</h1>
          <p className="text-slate-500 text-sm mt-0.5">{logs.length} entri log tersimpan</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoRefresh(v => !v)}
            className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
              autoRefresh ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-slate-800 text-slate-400 border-slate-700"
            )}
          >
            <RefreshCw className={cn("w-3.5 h-3.5", autoRefresh && "animate-spin")} />
            {autoRefresh ? "Auto" : "Manual"}
          </button>
          <button onClick={load} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg border border-slate-700 transition-colors">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
          <button
            onClick={clearLogs}
            disabled={clearing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs rounded-lg border border-red-500/20 transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" /> {clearing ? "..." : "Clear"}
          </button>
        </div>
      </div>

      {/* Filter tabs + search */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-500" />
          <input
            className="bg-slate-800 border border-slate-700 text-slate-200 pl-8 pr-3 py-1.5 rounded-lg text-xs w-48 focus:outline-none focus:border-sky-500"
            placeholder="Cari log..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-1">
          {(["all", "info", "warn", "error", "success"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={cn("px-2.5 py-1 rounded-lg text-xs font-medium transition-colors capitalize",
                filter === f ? "bg-sky-500/20 text-sky-400" : "text-slate-500 hover:text-slate-300"
              )}>
              {f} {counts[f] > 0 && <span className="ml-0.5 opacity-60">({counts[f]})</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Log List */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500 text-sm">Memuat logs...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center">
            <ScrollText className="w-8 h-8 text-slate-700 mx-auto mb-2" />
            <p className="text-slate-500 text-sm">Tidak ada log</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/50 max-h-[600px] overflow-y-auto">
            {filtered.map(log => {
              const cfg = LEVEL_CFG[log.level] || LEVEL_CFG.info
              const Icon = cfg.icon
              return (
                <div key={log.id} className="flex items-start gap-3 px-4 py-3 hover:bg-slate-800/30 transition-colors">
                  <div className={cn("mt-0.5 p-1 rounded", cfg.bg)}>
                    <Icon className={cn("w-3 h-3", cfg.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      {log.source && (
                        <span className="text-slate-500 text-xs font-mono bg-slate-800 px-1.5 py-0.5 rounded">{log.source}</span>
                      )}
                      <span className="text-slate-600 text-xs">{log.time}</span>
                    </div>
                    <p className="text-slate-300 text-xs leading-relaxed break-all">{log.message}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
