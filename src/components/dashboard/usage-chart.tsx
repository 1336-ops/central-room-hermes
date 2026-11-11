"use client"
import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { Activity, Search, ChevronDown, ChevronUp, Globe, TrendingUp, Coins } from "lucide-react"
import { cn } from "@/lib/utils"

interface UsageData { date: string; tokens: number }

interface BreakdownEntry {
  model: string
  provider: string
  providerColor: string
  tokens: number
}

interface PeriodData {
  history: UsageData[]
  breakdown: BreakdownEntry[]
  totalTokens: number
}

const PROVIDER_LABELS: Record<string, string> = {
  "IFLOW-CN": "IFLOW-CN", "SEMUTSSH": "SEMUTSSH", "SUMOPOD": "SUMOPOD",
  "OPENROUTER": "OPENRTR", "NVIDIA": "NVIDIA", "ZAI": "ZAI",
  "UNKNOWN": "UNK",
}

const PERIOD_CONFIG = [
  { key: "1d", label: "1 Hari", shortLabel: "Hari Ini" },
  { key: "7d", label: "7 Hari", shortLabel: "Minggu Ini" },
  { key: "30d", label: "30 Hari", shortLabel: "Bulan Ini" },
  { key: "1y", label: "1 Tahun", shortLabel: "Tahun Ini" },
] as const

type PeriodKey = "1d" | "7d" | "30d" | "1y"

const CHART_COLORS = [
  "#10b981", "#3b82f6", "#f59e0b", "#ec4899", "#8b5cf6", 
  "#14b8a6", "#f43f5e", "#0ea5e9", "#84cc16", "#d946ef",
  "#fb923c", "#6366f1", "#10b981", "#ef4444", "#a855f7"
]

const PROVIDER_CHART_COLORS: Record<string, string> = {
  "IFLOW-CN": "#3b82f6",
  "SEMUTSSH": "#8b5cf6",
  "SUMOPOD": "#10b981",
  "OPENROUTER": "#f59e0b",
  "NVIDIA": "#22c55e",
  "ZAI": "#06b6d4",
  "UNKNOWN": "#64748b",
}

export function UsageChart({
  data,
  breakdown,
  breakdownWithProvider,
  periodData,
}: {
  data: UsageData[]
  breakdown?: Record<string, number>
  breakdownWithProvider?: BreakdownEntry[]
  periodData?: {
    "1d": PeriodData
    "7d": PeriodData
    "30d": PeriodData
    "1y": PeriodData
  }
}) {
  const [period, setPeriod] = useState<PeriodKey>("7d")
  const [search, setSearch] = useState("")
  const [providerFilter, setProviderFilter] = useState<string>("ALL")
  const [showAll, setShowAll] = useState(false)

  // Resolve current period data (server-supplied or fallback to props)
  const currentPeriod = useMemo<PeriodData>(() => {
    if (periodData && periodData[period]) return periodData[period]
    // Fallback: use 7d props
    const bwp = breakdownWithProvider && breakdownWithProvider.length > 0
      ? breakdownWithProvider
      : (breakdown
        ? Object.entries(breakdown).map(([model, tokens]) => ({
          model, provider: "UNKNOWN", providerColor: "bg-slate-500/20 text-slate-400 border-slate-500/30", tokens,
        }))
        : [])
    return {
      history: data,
      breakdown: bwp,
      totalTokens: bwp.reduce((s, x) => s + x.tokens, 0),
    }
  }, [period, periodData, data, breakdown, breakdownWithProvider])

  // Unique providers
  const allProviders = useMemo(() => {
    const set = new Set(currentPeriod.breakdown.map(x => x.provider))
    return ["ALL", ...Array.from(set)]
  }, [currentPeriod.breakdown])

  // Sorted + filtered models
  const sortedModels = useMemo(() => {
    return currentPeriod.breakdown
      .filter(item =>
        item.model.toLowerCase().includes(search.toLowerCase()) &&
        (providerFilter === "ALL" || item.provider === providerFilter)
      )
      .sort((a, b) => b.tokens - a.tokens)
  }, [currentPeriod.breakdown, search, providerFilter])

  const visibleModels = showAll ? sortedModels : sortedModels.slice(0, 10)
  const maxTokens = Math.max(...sortedModels.map(x => x.tokens), 1)

  // Provider totals for pills
  const providerTotals = useMemo(() => {
    const map: Record<string, number> = {}
    for (const item of currentPeriod.breakdown) {
      map[item.provider] = (map[item.provider] || 0) + item.tokens
    }
    return Object.entries(map).sort((a, b) => b[1] - a[1])
  }, [currentPeriod.breakdown])

  const totalTokens = currentPeriod.totalTokens
  const formatTokens = (n: number) =>
    n >= 1_000_000 ? `${(n / 1_000_000).toFixed(2)}M` : n >= 1_000 ? `${(n / 1_000).toFixed(1)}K` : `${n}`

  const providersInHistory = useMemo(() => {
    const set = new Set<string>()
    currentPeriod.history.forEach(h => {
      Object.keys(h).forEach(k => {
        if (k !== 'date' && k !== 'tokens') set.add(k)
      })
    })
    return Array.from(set)
  }, [currentPeriod.history])

  const periodLabel = PERIOD_CONFIG.find(p => p.key === period)?.shortLabel || ""

  return (
    <Card className="glass-card border-slate-800/50">
      <CardHeader className="pb-3">
        {/* Title row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <Activity className="h-3.5 w-3.5 text-emerald-400" />
            </div>
            <CardTitle className="text-sm font-medium text-white">Token Usage &amp; Models</CardTitle>
          </div>

          {/* Period selector */}
          <div className="flex gap-1 p-0.5 rounded-lg bg-slate-900/60 border border-slate-800/50">
            {PERIOD_CONFIG.map(p => (
              <button
                key={p.key}
                onClick={() => { setPeriod(p.key); setShowAll(false) }}
                className={cn(
                  "px-2.5 py-1 text-[10px] font-semibold rounded-md transition-all duration-200",
                  period === p.key
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-[0_0_8px_rgba(16,185,129,0.15)]"
                    : "text-slate-500 hover:text-slate-300"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Total tokens summary */}
        <div className="flex items-center gap-3 mt-3 p-3 rounded-xl bg-slate-900/40 border border-slate-800/50">
          <div className="p-2 rounded-lg bg-emerald-500/10 shrink-0">
            <Coins className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">{periodLabel}</p>
            <p className="text-xl font-bold text-white font-mono leading-tight">
              {formatTokens(totalTokens)}
              <span className="text-xs text-slate-500 font-normal ml-1.5">tokens</span>
            </p>
          </div>
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <TrendingUp className="h-3 w-3 text-emerald-400" />
            <span className="text-[10px] text-emerald-400 font-medium">{sortedModels.length} model</span>
          </div>
        </div>

        {/* Provider pills */}
        {providerTotals.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {providerTotals.map(([prov, tokens]) => {
              const label = PROVIDER_LABELS[prov] || prov
              const colorClass = currentPeriod.breakdown.find(b => b.provider === prov)?.providerColor
                || "bg-slate-500/20 text-slate-400 border-slate-500/30"
              return (
                <button
                  key={prov}
                  onClick={() => setProviderFilter(p => p === prov ? "ALL" : prov)}
                  className={cn(
                    "flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-medium transition-all",
                    colorClass,
                    providerFilter === prov ? "ring-1 ring-current scale-105" : "opacity-80 hover:opacity-100"
                  )}
                >
                  <Globe className="h-2.5 w-2.5" />
                  {label}: {formatTokens(tokens)}
                </button>
              )
            })}
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        {/* Chart */}
        <div className="h-[300px] w-full mb-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={currentPeriod.history} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.06)" vertical={false} />
              <XAxis 
                dataKey="date" 
                stroke="#475569" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false}
                dy={10}
              />
              <YAxis 
                stroke="#475569" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false}
                tickFormatter={(v) => v >= 1_000_000 ? `${(v/1_000_000).toFixed(1)}M` : v >= 1000 ? `${(v/1_000).toFixed(0)}k` : v}
                width={36}
              />
              <Tooltip
                cursor={{ fill: 'rgba(148, 163, 184, 0.05)' }}
                contentStyle={{
                  backgroundColor: "rgba(10,16,24,0.97)",
                  border: "1px solid rgba(16,185,129,0.2)",
                  borderRadius: "12px",
                  color: "#f8fafc",
                  backdropFilter: "blur(12px)",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                  fontSize: "11px",
                }}
                labelStyle={{ color: "#94a3b8", fontSize: "10px", marginBottom: "4px" }}
                itemStyle={{ padding: "1px 0" }}
                formatter={(value, name) => [new Intl.NumberFormat("id-ID").format(Number(value)), name]}
              />
              <Legend 
                verticalAlign="top" 
                align="right" 
                iconType="circle"
                wrapperStyle={{ fontSize: '10px', paddingBottom: '20px', color: '#94a3b8' }}
              />
              {providersInHistory.map((prov, idx) => {
                const color = PROVIDER_CHART_COLORS[prov] || CHART_COLORS[idx % CHART_COLORS.length]
                return (
                  <Bar
                    key={prov}
                    dataKey={prov}
                    name={prov}
                    stackId="a"
                    fill={color}
                    radius={idx === providersInHistory.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                    animationDuration={1500}
                  />
                )
              })}
              {/* Fallback bar if empty */}
              {providersInHistory.length === 0 && (
                <Bar dataKey="tokens" name="Total Tokens" fill="#475569" radius={[4, 4, 0, 0]} />
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Model breakdown */}
        {sortedModels.length > 0 && (
          <div className="pt-3 border-t border-slate-800/50">
            {/* Filter row */}
            <div className="flex items-center justify-between mb-3 gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider shrink-0">Usage by Model</p>
                {providerFilter !== "ALL" && (
                  <button
                    onClick={() => setProviderFilter("ALL")}
                    className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 hover:text-white transition-colors"
                  >
                    {providerFilter} ✕
                  </button>
                )}
              </div>
              <div className="relative shrink-0">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-600" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Filter model..."
                  className="pl-7 pr-2 py-1 text-[10px] bg-slate-900/50 border border-slate-800/50 rounded-lg text-slate-300 focus:outline-none focus:border-emerald-500/30 w-32"
                />
              </div>
            </div>

            {/* Model list with bar */}
            <div className="space-y-1.5">
              {visibleModels.map((item) => {
                const pct = (item.tokens / maxTokens) * 100
                return (
                  <div key={`${item.model}-${item.provider}`}
                    className="flex items-center gap-2 p-2 rounded-lg bg-slate-900/40 border border-slate-800/40 hover:border-slate-700/50 transition-colors"
                  >
                    {/* Model name + provider badge */}
                    <div className="flex items-center gap-1.5 min-w-0 w-[200px] shrink-0">
                      <Globe className="h-2.5 w-2.5 shrink-0 text-slate-500" />
                      <span className="text-xs text-slate-300 font-mono truncate" title={item.model}>
                        {item.model}
                      </span>
                      <div className={cn("flex items-center rounded px-1 py-0.5 border text-[8px] font-bold shrink-0", item.providerColor)}>
                        {PROVIDER_LABELS[item.provider] || item.provider}
                      </div>
                    </div>
                    {/* Bar */}
                    <div className="flex-1 h-1.5 rounded-full bg-slate-800/60 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    {/* Token value */}
                    <span className="text-xs text-emerald-400 font-mono shrink-0 w-[52px] text-right">
                      {formatTokens(item.tokens)}
                    </span>
                  </div>
                )
              })}
            </div>

            {sortedModels.length > 10 && (
              <button
                onClick={() => setShowAll(!showAll)}
                className="mt-2.5 flex items-center gap-1 text-[10px] text-slate-500 hover:text-emerald-400 transition-colors mx-auto"
              >
                {showAll
                  ? <><ChevronUp className="h-3 w-3" /> Tampilkan lebih sedikit</>
                  : <><ChevronDown className="h-3 w-3" /> Tampilkan semua ({sortedModels.length})</>}
              </button>
            )}

            {sortedModels.length === 0 && (
              <p className="text-center text-xs text-slate-600 py-4">Tidak ada model ditemukan</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}