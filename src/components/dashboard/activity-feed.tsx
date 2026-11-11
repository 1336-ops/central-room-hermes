"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageSquare, Zap, AlertTriangle, CheckCircle, Info, Activity } from "lucide-react"
import { cn } from "@/lib/utils"

interface ActivityItem {
  id: string
  type: "session" | "model" | "warning" | "success" | "info"
  message: string
  time: string
}

const typeConfig = {
  session: { icon: MessageSquare, color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/20" },
  model: { icon: Zap, color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/20" },
  warning: { icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/20" },
  success: { icon: CheckCircle, color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/20" },
  info: { icon: Info, color: "text-slate-400", bg: "bg-slate-400/10", border: "border-slate-400/20" },
}

export function ActivityFeed({ data }: { data: ActivityItem[] }) {
  return (
    <Card className="glass-card border-slate-800/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-cyan-500/10">
              <Activity className="h-3.5 w-3.5 text-cyan-400" />
            </div>
            <CardTitle className="text-sm font-medium text-white">Aktivitas Terbaru</CardTitle>
          </div>
          <span className="text-xs text-slate-500">{data.length} events</span>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-2">
          <div className="space-y-2">
            {data.map((item, i) => {
              const config = typeConfig[item.type]
              const Icon = config.icon
              return (
                <div
                  key={item.id}
                  className={cn(
                    "flex items-start gap-3 rounded-xl p-3 transition-all duration-200 hover:bg-slate-800/30 animate-fade-in border border-transparent hover:border-slate-800/50"
                  )}
                  style={{ animationDelay: `${i * 30}ms` }}
                >
                  <div className={cn("p-2 rounded-lg shrink-0 mt-0.5", config.bg)}>
                    <Icon className={cn("h-3.5 w-3.5", config.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-300">{item.message}</p>
                    <p className="text-[10px] text-slate-600 mt-1 font-mono">{item.time}</p>
                  </div>
                  <span className={cn("text-[10px] px-2 py-0.5 rounded-full shrink-0 font-medium", config.bg, config.color)}>
                    {item.type}
                  </span>
                </div>
              )
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
