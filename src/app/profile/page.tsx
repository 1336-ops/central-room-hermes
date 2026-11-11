"use client"
import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { User, Server, Clock, Cpu, HardDrive, Activity } from "lucide-react"
import { cn } from "@/lib/utils"
import { useProfile } from "@/lib/profile-context"

interface SystemData {
  uptime: string
  memory: { total: number; used: number; free: number }
  disk: { total: string; used: string; free: string; pct: string }
  load: { "1m": string; "5m": string; "15m": string }
  gateways: { profile: string; pid?: number; state: string }[]
}

export default function ProfilePage() {
  const { profile } = useProfile()
  const [system, setSystem] = useState<SystemData | null>(null)
  const [tokenUsage, setTokenUsage] = useState(0)

  useEffect(() => {
    fetch("/dashboard/api/system").then(r => r.json()).then(setSystem).catch(() => {})
    fetch(`/dashboard/api/status?profile=${profile}`)
      .then(r => r.json()).then(d => setTokenUsage(d.stats?.tokenUsage || 0)).catch(() => {})
  }, [profile])

  const memPct = system ? Math.round((system.memory.used / system.memory.total) * 100) : 0

  return (
    <div className="space-y-6 max-w-3xl">
      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-white font-bold text-2xl shadow-lg">
              AZ
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Tuan Zack</h2>
              <p className="text-slate-400 text-sm">Administrator</p>
              <p className="text-slate-500 text-xs mt-1 capitalize">Active profile: {profile}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-800/50 rounded-xl p-4">
              <p className="text-xs text-slate-400 mb-1">Token Usage (7d)</p>
              <p className="text-2xl font-bold text-white">{tokenUsage.toLocaleString()}</p>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-4">
              <p className="text-xs text-slate-400 mb-1">Uptime</p>
              <p className="text-lg font-bold text-white">{system?.uptime || "..."}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Info */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="p-6">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Server className="h-4 w-4 text-slate-400" /> System
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Memory</span>
              <span className="text-white">{system?.memory.used}MB / {system?.memory.total}MB ({memPct}%)</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5">
              <div className={cn("h-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500")} style={{ width: `${memPct}%` }} />
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Disk</span>
              <span className="text-white">{system?.disk.used} / {system?.disk.total} ({system?.disk.pct})</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Load avg</span>
              <span className="text-white">{system?.load["1m"]} / {system?.load["5m"]} / {system?.load["15m"]}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gateways */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="p-6">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Activity className="h-4 w-4 text-slate-400" /> Gateways
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {(system?.gateways || []).map(g => (
              <div key={g.profile} className="bg-slate-800/50 rounded-xl p-3 flex items-center justify-between">
                <span className="text-sm text-slate-300 capitalize">{g.profile}</span>
                <span className={cn(
                  "text-xs px-2 py-0.5 rounded-full",
                  g.state === "running" ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-700 text-slate-400"
                )}>{g.state}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

