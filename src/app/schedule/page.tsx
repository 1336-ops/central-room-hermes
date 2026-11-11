"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar, Clock, CheckCircle, Circle, AlertTriangle, Timer } from "lucide-react"
import { cn } from "@/lib/utils"

interface ScheduleItem {
  id: string
  name: string
  schedule: string
  lastRun: string
  nextRun: string
  status: "active" | "paused" | "error"
  type: string
}

const statusConfig = {
  active: { icon: CheckCircle, color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/20", label: "Active" },
  paused: { icon: Circle, color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/20", label: "Paused" },
  error: { icon: AlertTriangle, color: "text-red-400", bg: "bg-red-400/10", border: "border-red-400/20", label: "Error" },
}

export default function SchedulePage() {
  const [items, setItems] = useState<ScheduleItem[]>([])

  useEffect(() => {
    fetch("/dashboard/api/schedule").then(r => r.json()).then(d => setItems(d.items || [])).catch(console.error)
  }, [])

  return (
    <div className="space-y-6 bg-grid min-h-[calc(100vh-4rem)]">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold gradient-text">Schedule</h2>
          <p className="text-sm text-slate-500 mt-0.5">Automated tasks & cron jobs</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/50 border border-slate-700/50">
          <Timer className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-xs text-slate-400">{items.length} jobs</span>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
        {(["active", "paused", "error"] as const).map(status => {
          const cfg = statusConfig[status]
          const Icon = cfg.icon
          const count = items.filter(i => i.status === status).length
          return (
            <Card key={status} className="glass-card border-slate-800/50">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={cn("p-2.5 rounded-xl", cfg.bg)}>
                  <Icon className={cn("h-4 w-4", cfg.color)} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{count}</p>
                  <p className="text-xs text-slate-500">{cfg.label}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Schedule items */}
      <div className="space-y-3">
        {items.length === 0 ? (
          <Card className="glass-card border-slate-800/50">
            <CardContent className="p-8 text-center">
              <Calendar className="h-8 w-8 text-slate-600 mx-auto mb-3" />
              <p className="text-sm text-slate-500">Memuat jadwal...</p>
            </CardContent>
          </Card>
        ) : (
          items.map((item, i) => {
            const cfg = statusConfig[item.status]
            const Icon = cfg.icon
            return (
              <Card key={item.id} className="glass-card border-slate-800/50 group hover:scale-[1.003] transition-all duration-300 animate-fade-in" style={{ animationDelay: `${i * 40}ms` }}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn("p-2.5 rounded-xl", cfg.bg)}>
                        <Icon className={cn("h-4 w-4", cfg.color)} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{item.name}</p>
                        <p className="text-xs text-slate-500">{item.type}</p>
                      </div>
                    </div>
                    <div className={cn("flex items-center gap-2 px-3 py-1 rounded-full border", cfg.bg, cfg.border)}>
                      {item.status === "active" && <span className="relative flex h-1.5 w-1.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span></span>}
                      <span className={cn("text-xs font-medium", cfg.color)}>{cfg.label}</span>
                    </div>
                  </div>
                  <div className="flex gap-4 mt-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1 px-2 py-1 rounded-md bg-slate-900/50 border border-slate-800/50"><Clock className="h-3 w-3" /> {item.schedule}</span>
                    <span className="flex items-center gap-1">Last: <span className="text-slate-400">{item.lastRun}</span></span>
                    <span className="flex items-center gap-1">Next: <span className="text-slate-400">{item.nextRun}</span></span>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
