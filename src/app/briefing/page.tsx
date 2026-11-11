"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { FileText, Clock, AlertCircle, CheckCircle2, Newspaper } from "lucide-react"
import { cn } from "@/lib/utils"

interface BriefingData {
  date: string
  summary: string
  highlights: { type: "info" | "warning" | "success"; text: string }[]
  agents: { name: string; status: string; lastActive: string }[]
}

export default function BriefingPage() {
  const [data, setData] = useState<BriefingData | null>(null)

  useEffect(() => {
    fetch("/dashboard/api/briefing").then(r => r.json()).then(setData).catch(console.error)
  }, [])

  if (!data) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center animate-pulse">
          <Newspaper className="h-5 w-5 text-amber-400" />
        </div>
        <p className="text-sm text-slate-500">Memuat briefing...</p>
      </div>
    </div>
  )

  const typeConfig = {
    info: { icon: FileText, color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/20" },
    warning: { icon: AlertCircle, color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/20" },
    success: { icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/20" },
  }

  return (
    <div className="space-y-6 bg-grid min-h-[calc(100vh-4rem)]">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold gradient-text">Daily Briefing</h2>
          <p className="text-sm text-slate-500 mt-0.5">{data.date}</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20">
          <Newspaper className="h-3.5 w-3.5 text-amber-400" />
          <span className="text-xs text-amber-400">Today</span>
        </div>
      </div>

      {/* Summary */}
      <Card className="glass-card border-slate-800/50">
        <CardContent className="p-5">
          <p className="text-sm text-slate-300 leading-relaxed">{data.summary}</p>
        </CardContent>
      </Card>

      {/* Highlights */}
      <div className="space-y-2">
        <p className="text-xs text-slate-500 uppercase tracking-wider font-medium px-1">Highlights</p>
        {data.highlights.map((h, i) => {
          const cfg = typeConfig[h.type]
          const Icon = cfg.icon
          return (
            <div key={i} className={cn("glass-card rounded-xl p-4 flex items-start gap-3 animate-fade-in border", cfg.border)} style={{ animationDelay: `${i * 40}ms` }}>
              <div className={cn("p-2 rounded-lg shrink-0", cfg.bg)}>
                <Icon className={cn("h-3.5 w-3.5", cfg.color)} />
              </div>
              <p className="text-sm text-slate-300">{h.text}</p>
            </div>
          )
        })}
      </div>

      {/* Agent Status */}
      <div className="space-y-2">
        <p className="text-xs text-slate-500 uppercase tracking-wider font-medium px-1">Agent Status</p>
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {data.agents.map((agent, i) => (
            <Card key={i} className="glass-card border-slate-800/50 animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-white">{agent.name}</p>
                  <div className={cn("flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium",
                    agent.status === "active" ? "bg-emerald-400/10 text-emerald-400 border border-emerald-400/20" : "bg-slate-800/50 text-slate-500 border border-slate-700/50"
                  )}>
                    {agent.status === "active" && <span className="relative flex h-1.5 w-1.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span></span>}
                    {agent.status}
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <Clock className="h-3 w-3" />
                  <span>{agent.lastActive}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
