"use client"
import { Card, CardContent } from "@/components/ui/card"
import { MessageSquare, Coins, Box, Clock, TrendingUp, Calendar, Zap, MapPin } from "lucide-react"
import { formatNumber } from "@/lib/utils"
import { RealTimeClock } from "./real-time-clock"
import { WibClock } from "./wib-clock"

interface UsageHistoryEntry { date: string; tokens: number }

interface StatsData {
  totalSessions: number
  tokenUsage: number
  activeModels: number
  uptime: string
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

export function StatsGrid({
  data,
  usageHistory,
}: {
  data: StatsData
  usageHistory?: UsageHistoryEntry[]
}) {
  const weeklyTokens = usageHistory
    ? usageHistory.reduce((s, d) => s + d.tokens, 0)
    : 0
  const avgDaily = usageHistory && usageHistory.length > 0
    ? Math.round(weeklyTokens / usageHistory.length)
    : 0
  // rough yearly projection from weekly
  const yearlyProject = weeklyTokens > 0 ? Math.round(weeklyTokens * 52) : 0

  const cards = [
    {
      label: "Total Sessions",
      icon: MessageSquare,
      gradient: "from-emerald-500 to-emerald-600",
      glow: "shadow-emerald-500/20",
      trend: "+12%",
      sub: null,
      value: formatNumber(data.totalSessions),
    },
    {
      label: "Today",
      icon: Zap,
      gradient: "from-amber-500 to-orange-500",
      glow: "shadow-amber-500/20",
      trend: null,
      sub: "avg daily",
      value: fmt(avgDaily),
    },
    {
      label: "This Week",
      icon: Calendar,
      gradient: "from-cyan-500 to-sky-500",
      glow: "shadow-cyan-500/20",
      trend: null,
      sub: "7 hari",
      value: fmt(weeklyTokens),
    },
    {
      label: "Yearly Project",
      icon: Coins,
      gradient: "from-violet-500 to-purple-500",
      glow: "shadow-violet-500/20",
      trend: null,
      sub: "proyeksi 52 minggu",
      value: fmt(yearlyProject),
    },
  ]

  return (
    <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
      {/* Real Time Clocks (Simplified) */}
      <div className="lg:col-span-1">
        <RealTimeClock simplified />
      </div>
      <div className="lg:col-span-1">
        <WibClock simplified />
      </div>

      {cards.map((cfg) => {
        const Icon = cfg.icon
        return (
          <Card
            key={cfg.label}
            className="glass-card border-slate-800/50 group hover:scale-[1.02] transition-all duration-300"
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2 rounded-lg bg-gradient-to-br ${cfg.gradient} shadow-lg ${cfg.glow}`}>
                  <Icon className="h-3.5 w-3.5 text-white" />
                </div>
                {cfg.trend && (
                  <div className="flex items-center gap-1 text-[10px] text-emerald-400">
                    <TrendingUp className="h-2.5 w-2.5" />
                    <span>{cfg.trend}</span>
                  </div>
                )}
              </div>
              <p className="text-xl font-bold text-white tracking-tight">{cfg.value}</p>
              <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider">{cfg.label}</p>
              {cfg.sub && <p className="text-[10px] text-slate-600 mt-0.5">{cfg.sub}</p>}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}