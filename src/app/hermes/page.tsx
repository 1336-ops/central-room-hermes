"use client"
import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import {
  Brain, Clock, Database, Zap, Terminal, HardDrive,
  CheckCircle2, XCircle, RefreshCw, FileText, Calendar,
  Users, Cpu, Activity, FolderOpen, Shield,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface ProfileStatus { profile: string; pid?: number; state: string }
interface MemoryFile { name: string; size: number; modified: string }
interface CronJob { schedule: string; command: string }
interface ServiceStatus { name: string; active: boolean }

interface HermesData {
  profiles: ProfileStatus[]
  gateway: { state: string; pid?: number }
  memory: MemoryFile[]
  cron: CronJob[]
  skills: Record<string, number>
  totalSessions: number
  version: string
  uptime: string
  diskUsage: string
  recentDiaries: string[]
  services: ServiceStatus[]
}

const PROFILE_COLORS: Record<string, { gradient: string; glow: string; dot: string }> = {
  coding:   { gradient: "from-emerald-500 to-cyan-500",   glow: "shadow-emerald-500/20", dot: "bg-emerald-400" },
  law:      { gradient: "from-violet-500 to-purple-500",  glow: "shadow-violet-500/20",  dot: "bg-violet-400" },
  research: { gradient: "from-amber-500 to-orange-500",   glow: "shadow-amber-500/20",   dot: "bg-amber-400" },
  social:   { gradient: "from-pink-500 to-rose-500",      glow: "shadow-pink-500/20",    dot: "bg-pink-400" },
}

function StatusDot({ active }: { active: boolean }) {
  return (
    <span className="relative flex h-2 w-2">
      {active && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />}
      <span className={cn("relative inline-flex rounded-full h-2 w-2", active ? "bg-emerald-500" : "bg-slate-600")} />
    </span>
  )
}

function fmtSize(bytes: number) {
  if (bytes > 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${bytes}B`
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const h = Math.floor(diff / 3600000)
  const d = Math.floor(h / 24)
  if (d > 0) return `${d}d ago`
  if (h > 0) return `${h}h ago`
  return "just now"
}

export default function HermesPage() {
  const [data, setData] = useState<HermesData | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  const fetchData = async () => {
    try {
      const r = await fetch("/dashboard/api/hermes-status", { cache: "no-store" })
      const d = await r.json()
      setData(d)
      setLastRefresh(new Date())
    } catch {}
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
    const t = setInterval(fetchData, 30000)
    return () => clearInterval(t)
  }, [])

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center animate-pulse border border-emerald-500/10">
            <Brain className="h-6 w-6 text-emerald-400" />
          </div>
          <p className="text-sm text-slate-400">Loading Hermes status...</p>
        </div>
      </div>
    )
  }

  const runningProfiles = data.profiles.filter(p => p.state === "running").length
  const totalSkills = Object.values(data.skills).reduce((a, b) => a + b, 0)

  return (
    <div className="space-y-6 bg-grid min-h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold gradient-text">Hermes Agent</h2>
          <p className="text-sm text-slate-500 mt-0.5">Status sistem & monitoring agent • v{data.version}</p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/50 border border-slate-700/50 text-xs text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all"
        >
          <RefreshCw className="h-3 w-3" />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Active Profiles", value: `${runningProfiles}/${data.profiles.length}`, icon: Users, gradient: "from-emerald-500 to-teal-500", glow: "shadow-emerald-500/20" },
          { label: "Total Sessions", value: data.totalSessions, icon: Activity, gradient: "from-cyan-500 to-sky-500", glow: "shadow-cyan-500/20" },
          { label: "Total Skills", value: totalSkills, icon: Zap, gradient: "from-amber-500 to-orange-500", glow: "shadow-amber-500/20" },
          { label: "Disk Usage", value: data.diskUsage || "—", icon: HardDrive, gradient: "from-violet-500 to-purple-500", glow: "shadow-violet-500/20" },
        ].map(c => (
          <Card key={c.label} className="glass-card border-slate-800/50 hover:scale-[1.02] transition-all duration-300">
            <CardContent className="p-4">
              <div className={cn("p-2 rounded-lg bg-gradient-to-br w-fit mb-3 shadow-lg", c.gradient, c.glow)}>
                <c.icon className="h-3.5 w-3.5 text-white" />
              </div>
              <p className="text-xl font-bold text-white">{c.value}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">{c.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Profiles + Services */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Agent Profiles */}
        <Card className="glass-card border-slate-800/50">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500/10 to-cyan-500/10">
                <Brain className="h-4 w-4 text-emerald-400" />
              </div>
              <p className="text-sm font-medium text-white">Agent Profiles</p>
            </div>
            <div className="space-y-3">
              {data.profiles.map(p => {
                const colors = PROFILE_COLORS[p.profile] || PROFILE_COLORS.coding
                const isRunning = p.state === "running"
                return (
                  <div key={p.profile} className="flex items-center justify-between p-3 rounded-xl bg-slate-900/50 border border-slate-800/50 hover:border-slate-700/50 transition-all">
                    <div className="flex items-center gap-3">
                      <div className={cn("h-8 w-8 rounded-lg bg-gradient-to-br flex items-center justify-center text-white text-xs font-bold shadow-lg", colors.gradient, colors.glow)}>
                        {p.profile[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white capitalize">{p.profile}</p>
                        <p className="text-[10px] text-slate-500">{data.skills[p.profile] || 0} skills</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusDot active={isRunning} />
                      <span className={cn("text-xs", isRunning ? "text-emerald-400" : "text-slate-500")}>
                        {isRunning ? "running" : "stopped"}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Services */}
        <Card className="glass-card border-slate-800/50">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500/10 to-sky-500/10">
                <Cpu className="h-4 w-4 text-cyan-400" />
              </div>
              <p className="text-sm font-medium text-white">System Services</p>
            </div>
            <div className="space-y-2">
              {data.services.map(s => (
                <div key={s.name} className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-slate-900/50 border border-slate-800/50">
                  <div className="flex items-center gap-2">
                    {s.active
                      ? <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      : <XCircle className="h-4 w-4 text-slate-600" />
                    }
                    <span className="text-sm text-slate-300 font-mono">{s.name}</span>
                  </div>
                  <span className={cn("text-xs px-2 py-0.5 rounded-full border", s.active ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" : "text-slate-500 bg-slate-800/50 border-slate-700/30")}>
                    {s.active ? "active" : "inactive"}
                  </span>
                </div>
              ))}
              <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-slate-900/50 border border-slate-800/50">
                <div className="flex items-center gap-2">
                  <Shield className={cn("h-4 w-4", data.gateway.state === "running" ? "text-emerald-400" : "text-slate-600")} />
                  <span className="text-sm text-slate-300 font-mono">gateway</span>
                </div>
                <span className={cn("text-xs px-2 py-0.5 rounded-full border", data.gateway.state === "running" ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" : "text-slate-500 bg-slate-800/50 border-slate-700/30")}>
                  {data.gateway.state}
                </span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/50 flex items-center gap-2 text-xs text-slate-500">
              <Clock className="h-3 w-3" />
              <span>{data.uptime}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Memory Files + Cron Jobs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Memory */}
        <Card className="glass-card border-slate-800/50">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500/10 to-purple-500/10">
                <Database className="h-4 w-4 text-violet-400" />
              </div>
              <p className="text-sm font-medium text-white">Memory Files</p>
              <span className="ml-auto text-xs text-slate-500">{data.memory.length} files</span>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {data.memory.length === 0 && (
                <p className="text-xs text-slate-600 text-center py-4">No memory files found</p>
              )}
              {data.memory.map(f => (
                <div key={f.name} className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-900/50 border border-slate-800/30 hover:border-slate-700/50 transition-all">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="h-3.5 w-3.5 text-violet-400 shrink-0" />
                    <span className="text-xs text-slate-300 font-mono truncate">{f.name}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className="text-[10px] text-slate-600">{fmtSize(f.size)}</span>
                    <span className="text-[10px] text-slate-500">{timeAgo(f.modified)}</span>
                  </div>
                </div>
              ))}
            </div>
            {data.recentDiaries.length > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-800/50">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Recent Diaries</p>
                <div className="flex flex-wrap gap-1">
                  {data.recentDiaries.map(d => (
                    <span key={d} className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20">{d.replace(".md", "")}</span>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cron Jobs */}
        <Card className="glass-card border-slate-800/50">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500/10 to-orange-500/10">
                <Calendar className="h-4 w-4 text-amber-400" />
              </div>
              <p className="text-sm font-medium text-white">Cron Jobs</p>
              <span className="ml-auto text-xs text-slate-500">{data.cron.length} jobs</span>
            </div>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {data.cron.length === 0 && (
                <p className="text-xs text-slate-600 text-center py-4">No cron jobs found</p>
              )}
              {data.cron.map((job, i) => (
                <div key={i} className="p-3 rounded-xl bg-slate-900/50 border border-slate-800/30 hover:border-slate-700/50 transition-all">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="h-3 w-3 text-amber-400 shrink-0" />
                    <span className="text-[10px] font-mono text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded">{job.schedule}</span>
                  </div>
                  <p className="text-xs text-slate-400 font-mono truncate pl-5">{job.command}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Skills breakdown */}
      <Card className="glass-card border-slate-800/50">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500/10 to-sky-500/10">
              <Zap className="h-4 w-4 text-cyan-400" />
            </div>
            <p className="text-sm font-medium text-white">Skills per Profile</p>
            <span className="ml-auto text-xs text-slate-500">{totalSkills} total</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.entries(data.skills).map(([profile, count]) => {
              const colors = PROFILE_COLORS[profile] || PROFILE_COLORS.coding
              const pct = totalSkills > 0 ? Math.round((count / totalSkills) * 100) : 0
              return (
                <div key={profile} className="p-3 rounded-xl bg-slate-900/50 border border-slate-800/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-400 capitalize">{profile}</span>
                    <span className="text-xs font-bold text-white">{count}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={cn("h-full rounded-full bg-gradient-to-r transition-all duration-700", colors.gradient)}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-600 mt-1">{pct}% of total</p>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="flex items-center justify-between text-[10px] text-slate-600 pb-2">
        <span>Last updated: {lastRefresh.toLocaleTimeString("id-ID")}</span>
        <span>Auto-refresh every 30s</span>
      </div>
    </div>
  )
}
