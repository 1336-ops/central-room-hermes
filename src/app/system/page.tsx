"use client"
import { useEffect, useState } from "react"
import { HardDrive, MemoryStick, Clock, RefreshCw, Activity, Wifi } from "lucide-react"
import { cn } from "@/lib/utils"

interface GatewayStatus {
  profile: string
  pid: number
  state: string
  platforms: Record<string, { state: string; error_code: any; error_message: any; updated_at: string }>
}

interface SystemData {
  uptime: string
  memory: { total: number; used: number; free: number }
  disk: { total: string; used: string; free: string; pct: string }
  load: { "1m": string; "5m": string; "15m": string }
  gateways: GatewayStatus[]
}

function Ring({ percent, color }: { percent: number; color: string }) {
  const r = 36, circ = 2 * Math.PI * r
  const offset = circ - (Math.min(percent, 100) / 100) * circ
  return (
    <svg width="88" height="88" className="-rotate-90">
      <circle cx="44" cy="44" r={r} fill="none" stroke="rgba(148,163,184,0.08)" strokeWidth="7" />
      <circle cx="44" cy="44" r={r} fill="none" stroke={color} strokeWidth="7"
        strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
        className="transition-all duration-1000" />
    </svg>
  )
}

function GaugeCard({ label, percent, sub, color, icon: Icon }: {
  label: string; percent: number; sub: string; color: string; icon: any
}) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
      <div className="relative flex items-center justify-center shrink-0">
        <Ring percent={percent} color={color} />
        <div className="absolute flex flex-col items-center">
          <span className="text-white font-bold text-sm">{Math.round(percent)}%</span>
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Icon className="w-4 h-4 shrink-0" style={{ color }} />
          <span className="text-slate-300 text-sm font-medium">{label}</span>
        </div>
        <p className="text-slate-500 text-xs">{sub}</p>
        <div className="mt-2 bg-slate-800 rounded-full h-1.5">
          <div className="h-1.5 rounded-full transition-all duration-1000" style={{ width: `${Math.min(percent,100)}%`, background: color }} />
        </div>
      </div>
    </div>
  )
}

export default function SystemPage() {
  const [sys, setSys] = useState<SystemData | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState("")

  const load = () => {
    fetch("/dashboard/api/system")
      .then(r => r.json())
      .then(d => {
        setSys(d)
        setLoading(false)
        setLastUpdate(new Date().toLocaleTimeString("id-ID"))
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    load()
    const t = setInterval(load, 15000)
    return () => clearInterval(t)
  }, [])

  const memPct = sys ? Math.round((sys.memory.used / sys.memory.total) * 100) : 0
  const diskPct = sys ? parseInt(sys.disk.pct) : 0
  const memSub = sys ? `${sys.memory.used} MB / ${sys.memory.total} MB` : "-"
  const diskSub = sys ? `${sys.disk.used} / ${sys.disk.total}` : "-"

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">System Monitor</h1>
          <p className="text-slate-500 text-sm mt-0.5">Resource usage & status gateway</p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdate && <span className="text-slate-600 text-xs">Update: {lastUpdate}</span>}
          <button onClick={load} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg transition-colors">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(2)].map((_, i) => <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl h-28 animate-pulse" />)}
        </div>
      ) : sys ? (
        <>
          {/* Gauges */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <GaugeCard label="Memory" percent={memPct} sub={memSub} color="#60a5fa" icon={MemoryStick} />
            <GaugeCard label="Disk" percent={diskPct} sub={diskSub} color={diskPct > 85 ? "#f87171" : "#a78bfa"} icon={HardDrive} />
          </div>

          {/* Uptime & Load */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-slate-400" />
                <h2 className="text-sm font-medium text-slate-300">Uptime</h2>
              </div>
              <p className="text-white font-mono text-sm">{sys.uptime}</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Activity className="w-4 h-4 text-slate-400" />
                <h2 className="text-sm font-medium text-slate-300">Load Average</h2>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(["1m", "5m", "15m"] as const).map(k => (
                  <div key={k} className="bg-slate-800/50 rounded-lg p-2.5 text-center">
                    <p className="text-white font-semibold text-sm font-mono">{sys.load[k]}</p>
                    <p className="text-slate-500 text-xs mt-0.5">{k}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Disk warning */}
          {diskPct > 85 && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-center gap-2">
              <span className="text-red-400 text-sm">⚠️</span>
              <p className="text-red-300 text-sm">Disk hampir penuh — {sys.disk.free} tersisa dari {sys.disk.total}</p>
            </div>
          )}

          {/* Gateway Status */}
          {sys.gateways && sys.gateways.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Wifi className="w-4 h-4 text-slate-400" />
                <h2 className="text-sm font-medium text-slate-300">Gateway Status</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {sys.gateways.map(gw => {
                  const tg = gw.platforms?.telegram
                  const online = gw.state === "running" && tg?.state === "connected"
                  return (
                    <div key={gw.profile} className="bg-slate-800/50 rounded-lg p-3 flex items-center gap-3">
                      <span className={cn("w-2 h-2 rounded-full shrink-0", online ? "bg-emerald-400 animate-pulse" : "bg-red-400")} />
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-200 text-sm font-medium capitalize">{gw.profile}</p>
                        <p className="text-slate-500 text-xs">PID {gw.pid} · {gw.state}</p>
                        {tg && <p className="text-slate-600 text-xs">Telegram: {tg.state}</p>}
                      </div>
                      <span className={cn("px-2 py-0.5 rounded-full text-xs border font-medium",
                        online ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"
                      )}>
                        {online ? "online" : "offline"}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
          <p className="text-slate-500">Gagal load data sistem</p>
        </div>
      )}
    </div>
  )
}
