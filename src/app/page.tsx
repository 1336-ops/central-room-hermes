"use client"
import { useEffect, useState } from "react"
import { RotateCcw, Activity, HardDrive, Terminal, Trash2, Globe, Cpu, MemoryStick, Clock, Users, Zap, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import { useProfile } from "@/lib/profile-context"
import { cn } from "@/lib/utils"

interface DashboardData {
  stats: {
    totalSessions: number
    tokenUsage: number
    activeModels: number
    uptime: string
    defaultModel: string
    breakdownWithProvider: { model: string; provider: string; providerColor: string; tokens: number }[]
  }
  usageHistory: { date: string; tokens: number }[]
  recentActivity: { id: string; type: string; message: string; time: string }[]
  gateway: { pid?: number; state: string; platforms: Record<string, any> }
  profilesStatus: { profile: string; pid?: number; state: string }[]
}

const ACTIONS = [
  { id: "restart-gateway", label: "Restart Gateway", icon: RotateCcw, color: "emerald" },
  { id: "gateway-status",  label: "Health Check",    icon: Activity,  color: "blue" },
  { id: "system-info",     label: "System Info",     icon: HardDrive, color: "violet" },
  { id: "hermes-version",  label: "Hermes Version",  icon: Terminal,  color: "slate" },
  { id: "clear-logs",      label: "Clear Logs",      icon: Trash2,    color: "red" },
  { id: "nginx-reload",    label: "Reload Nginx",    icon: Globe,     color: "pink" },
]

const COLOR_MAP: Record<string, string> = {
  emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20",
  blue:    "bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20",
  violet:  "bg-violet-500/10 text-violet-400 border-violet-500/20 hover:bg-violet-500/20",
  slate:   "bg-slate-500/10 text-slate-400 border-slate-500/20 hover:bg-slate-500/20",
  red:     "bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20",
  pink:    "bg-pink-500/10 text-pink-400 border-pink-500/20 hover:bg-pink-500/20",
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: any; color: string }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
      <div className={cn("p-2.5 rounded-lg", COLOR_MAP[color]?.split(" ").slice(0,2).join(" ") || "bg-slate-800 text-slate-400")}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-slate-500 text-xs">{label}</p>
        <p className="text-white font-semibold text-lg leading-tight">{value}</p>
      </div>
    </div>
  )
}

function ActivityIcon({ type }: { type: string }) {
  if (type === "success") return <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
  if (type === "warning") return <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
  if (type === "error")   return <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
  return <Activity className="w-3.5 h-3.5 text-blue-400 shrink-0" />
}

export default function DashboardPage() {
  const { profile } = useProfile()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [actionResult, setActionResult] = useState<{ output: string; label: string; ok: boolean } | null>(null)

  useEffect(() => {
    const load = () =>
      fetch(`/dashboard/api/status?profile=${profile}`, { cache: "no-store" })
        .then(r => r.json()).then(d => { setData(d); setLoading(false) }).catch(() => setLoading(false))
    load()
    const t = setInterval(load, 30000)
    return () => clearInterval(t)
  }, [profile])

  const runAction = async (actionId: string, label: string) => {
    setActionLoading(actionId)
    setActionResult(null)
    try {
      const res = await fetch("/dashboard/api/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: actionId, profile }),
      })
      const json = await res.json()
      setActionResult({ output: json.output || json.result || JSON.stringify(json), label, ok: res.ok })
    } catch (e: any) {
      setActionResult({ output: e.message, label, ok: false })
    } finally {
      setActionLoading(null)
    }
  }

  const gwState = data?.gateway?.state || "unknown"
  const gwOnline = gwState === "running"

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-0.5">Overview sistem Hermes — profile: <span className="text-emerald-400">{profile}</span></p>
        </div>
        <div className={cn("flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border",
          gwOnline ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"
        )}>
          <span className={cn("w-1.5 h-1.5 rounded-full", gwOnline ? "bg-emerald-400 animate-pulse" : "bg-red-400")} />
          Gateway {gwOnline ? "Online" : gwState}
        </div>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-4 h-20 animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total Sesi" value={data?.stats.totalSessions ?? 0} icon={Users} color="blue" />
          <StatCard label="Token Dipakai" value={data?.stats.tokenUsage ? `${(data.stats.tokenUsage/1000).toFixed(1)}k` : "0"} icon={Zap} color="emerald" />
          <StatCard label="Model Aktif" value={data?.stats.activeModels ?? 0} icon={Cpu} color="violet" />
          <StatCard label="Uptime" value={data?.stats.uptime ?? "-"} icon={Clock} color="slate" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <h2 className="text-sm font-medium text-slate-300 mb-3">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-2">
            {ACTIONS.map(a => (
              <button
                key={a.id}
                onClick={() => runAction(a.id, a.label)}
                disabled={!!actionLoading}
                className={cn("flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all",
                  COLOR_MAP[a.color], actionLoading === a.id && "opacity-50 cursor-wait"
                )}
              >
                <a.icon className="w-3.5 h-3.5 shrink-0" />
                {actionLoading === a.id ? "..." : a.label}
              </button>
            ))}
          </div>
          {actionResult && (
            <div className={cn("mt-3 p-3 rounded-lg text-xs font-mono whitespace-pre-wrap break-all max-h-32 overflow-y-auto",
              actionResult.ok ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20" : "bg-red-500/10 text-red-300 border border-red-500/20"
            )}>
              <p className="font-semibold mb-1">{actionResult.label}</p>
              {actionResult.output}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-4">
          <h2 className="text-sm font-medium text-slate-300 mb-3">Aktivitas Terbaru</h2>
          {!data?.recentActivity?.length ? (
            <p className="text-slate-600 text-sm text-center py-6">Belum ada aktivitas</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {data.recentActivity.map(a => (
                <div key={a.id} className="flex items-start gap-2.5 py-1.5 border-b border-slate-800/50 last:border-0">
                  <ActivityIcon type={a.type} />
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-300 text-xs leading-relaxed">{a.message}</p>
                  </div>
                  <span className="text-slate-600 text-xs shrink-0">{a.time}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Profiles Status */}
      {data?.profilesStatus && data.profilesStatus.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <h2 className="text-sm font-medium text-slate-300 mb-3">Status Profile</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {data.profilesStatus.map(p => (
              <div key={p.profile} className="flex items-center gap-2.5 p-2.5 bg-slate-800/50 rounded-lg">
                <span className={cn("w-2 h-2 rounded-full shrink-0",
                  p.state === "running" ? "bg-emerald-400 animate-pulse" : "bg-slate-600"
                )} />
                <div>
                  <p className="text-slate-300 text-xs font-medium capitalize">{p.profile}</p>
                  <p className="text-slate-600 text-xs">{p.state}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Model Usage */}
      {data?.stats.breakdownWithProvider && data.stats.breakdownWithProvider.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <h2 className="text-sm font-medium text-slate-300 mb-3">Token per Model</h2>
          <div className="space-y-2">
            {data.stats.breakdownWithProvider.slice(0, 8).map(m => {
              const max = Math.max(...data.stats.breakdownWithProvider.map(x => x.tokens))
              const pct = max > 0 ? (m.tokens / max) * 100 : 0
              return (
                <div key={m.model} className="flex items-center gap-3">
                  <span className="text-slate-400 text-xs w-36 truncate">{m.model}</span>
                  <div className="flex-1 bg-slate-800 rounded-full h-1.5">
                    <div className="h-1.5 rounded-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-slate-500 text-xs w-16 text-right">{m.tokens.toLocaleString()}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
