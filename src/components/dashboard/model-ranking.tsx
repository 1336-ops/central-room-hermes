"use client"
import { Card, CardContent } from "@/components/ui/card"
import { Trophy, Medal, Award, TrendingUp, Globe } from "lucide-react"
import { cn } from "@/lib/utils"

interface ModelRankingProps {
  breakdown: Record<string, number>
  totalTokens: number
  breakdownWithProvider?: {
    model: string
    provider: string
    providerColor: string
    tokens: number
  }[]
}

const RANK_ICONS = [Trophy, Medal, Award]
const RANK_COLORS = ["text-amber-400", "text-slate-300", "text-amber-600"]
const BAR_COLORS = [
  "from-emerald-500 to-teal-500",
  "from-blue-500 to-cyan-500",
  "from-violet-500 to-purple-500",
  "from-amber-500 to-orange-500",
  "from-rose-500 to-pink-500",
  "from-cyan-500 to-sky-500",
  "from-green-500 to-emerald-500",
  "from-fuchsia-500 to-purple-500",
]

function formatTokens(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return n.toString()
}

function formatPercent(n: number, total: number): string {
  if (total === 0) return "0%"
  return `${((n / total) * 100).toFixed(1)}%`
}

export function ModelRanking({ breakdown, totalTokens, breakdownWithProvider }: ModelRankingProps) {
  const source = breakdownWithProvider && breakdownWithProvider.length > 0
    ? breakdownWithProvider
    : Object.entries(breakdown)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([model, tokens]) => ({ model, provider: "UNKNOWN", providerColor: "bg-slate-500/20 text-slate-400 border-slate-500/30", tokens }))

  const sorted = source.slice(0, 10)

  if (sorted.length === 0) {
    return (
      <Card className="glass-card border-slate-800/50">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500/10 to-orange-500/10">
              <Trophy className="h-4 w-4 text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Model Ranking</p>
              <p className="text-[10px] text-slate-500">By token usage this week</p>
            </div>
          </div>
          <p className="text-xs text-slate-600 text-center py-6">No data yet</p>
        </CardContent>
      </Card>
    )
  }

  const maxTokens = sorted[0]?.tokens || 1

  return (
    <Card className="glass-card border-slate-800/50">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500/10 to-orange-500/10">
              <Trophy className="h-4 w-4 text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Model Ranking</p>
              <p className="text-[10px] text-slate-500">By token usage this week</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-slate-500">
            <TrendingUp className="h-3 w-3" />
            {sorted.length} models
          </div>
        </div>

        <div className="space-y-2">
          {sorted.map((item: any, i: number) => {
            const model = item.model || item.id
            const tokens = item.tokens
            const provider = item.provider || "UNKNOWN"
            const providerColor = item.providerColor || "bg-slate-500/20 text-slate-400 border-slate-500/30"
            const RankIcon = RANK_ICONS[i] || Award
            const rankColor = RANK_COLORS[i] || "text-slate-500"
            const barColor = BAR_COLORS[i % BAR_COLORS.length]
            const barWidth = Math.max(5, (tokens / maxTokens) * 100)

            return (
              <div
                key={model}
                className={cn(
                  "flex items-center gap-3 p-2 rounded-lg hover:bg-slate-900/40 transition-all",
                  i < 3 && "bg-slate-900/20"
                )}
              >
                {/* Rank */}
                <div className="flex items-center justify-center w-6 shrink-0">
                  {i < 3 ? (
                    <RankIcon className={cn("h-4 w-4", rankColor)} />
                  ) : (
                    <span className="text-xs text-slate-600 font-mono">{i + 1}</span>
                  )}
                </div>

                {/* Provider badge */}
                <div className={cn("flex flex-col items-center justify-center w-14 shrink-0 rounded-lg py-1.5 border text-center", providerColor)}>
                  <Globe className="h-2.5 w-2.5 mb-0.5" />
                  <span className="text-[8px] font-bold leading-tight">{provider}</span>
                </div>

                {/* Model name + bar */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white truncate">{model}</p>
                  <div className="mt-1 h-1.5 rounded-full bg-slate-800/50 overflow-hidden">
                    <div
                      className={cn("h-full rounded-full bg-gradient-to-r transition-all duration-500", barColor)}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>

                {/* Tokens + % */}
                <div className="text-right shrink-0">
                  <p className="text-xs font-mono text-white">{formatTokens(tokens)}</p>
                  <p className="text-[10px] text-slate-500">{formatPercent(tokens, totalTokens)}</p>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}