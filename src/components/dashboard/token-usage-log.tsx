"use client"
import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Zap, RefreshCw, Globe } from "lucide-react"
import { cn } from "@/lib/utils"

interface TokenEntry {
  timestamp: string
  model: string
  provider: string
  providerColor: string
  inputTokens: number
  outputTokens: number
  costUSD: number
  costIDR: number
  speed: number
  sessionName?: string
}

export function TokenUsageLog() {
  const [entries, setEntries] = useState<TokenEntry[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    try {
      const r = await fetch("/dashboard/api/token-log")
      const d = await r.json()
      setEntries(d.entries || [])
    } catch {}
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <Card className="glass-card border-slate-800/50">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500/10 to-cyan-500/10">
              <Zap className="h-4 w-4 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Token Usage Log</p>
              <p className="text-[10px] text-slate-500">Real-time per-request tracking</p>
            </div>
          </div>
          <button
            onClick={fetchData}
            className="p-1.5 rounded-lg hover:bg-slate-800/50 text-slate-500 hover:text-emerald-400 transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Header */}
        <div className="grid grid-cols-[80px_70px_1fr_80px_90px_60px] gap-2 px-3 pb-2 mb-1 border-b border-slate-800/50">
          <span className="text-[10px] text-slate-600 uppercase tracking-wider">Time</span>
          <span className="text-[10px] text-slate-600 uppercase tracking-wider text-center">Prov</span>
          <span className="text-[10px] text-slate-600 uppercase tracking-wider">Model</span>
          <span className="text-[10px] text-slate-600 uppercase tracking-wider text-right">Tokens</span>
          <span className="text-[10px] text-slate-600 uppercase tracking-wider text-right">Cost</span>
          <span className="text-[10px] text-slate-600 uppercase tracking-wider text-right">Speed</span>
        </div>

        {/* Rows */}
        <div className="space-y-0.5 max-h-[400px] overflow-y-auto scrollbar-thin">
          {entries.map((e, i) => (
            <div
              key={i}
              className="grid grid-cols-[80px_70px_1fr_80px_90px_60px] gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-900/40 transition-colors group items-center"
            >
              <span className="text-[11px] text-slate-500 font-mono">{e.timestamp}</span>

              {/* Provider badge */}
              <div className={cn("flex items-center justify-center rounded-md py-1 border text-center", e.providerColor)}>
                <Globe className="h-2.5 w-2.5" />
              </div>

              {/* Model */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-300 font-mono truncate">{e.model}</span>
              </div>

              {/* Tokens */}
              <div className="text-right">
                <span className="text-[11px] text-white font-mono">
                  {e.inputTokens.toLocaleString("id-ID")}→{e.outputTokens}
                </span>
              </div>

              {/* Cost */}
              <div className="text-right">
                <span className="text-[11px] text-slate-400 font-mono">$ {e.costUSD.toFixed(7)}</span>
                <br />
                <span className="text-[10px] text-slate-600 font-mono">(~Rp {e.costIDR.toFixed(4)})</span>
              </div>

              {/* Speed */}
              <span className="text-[11px] text-emerald-400 font-mono text-right">
                {e.speed.toLocaleString("id-ID")}
              </span>
            </div>
          ))}
        </div>

        {entries.length === 0 && !loading && (
          <p className="text-xs text-slate-600 text-center py-6">No token usage data</p>
        )}
      </CardContent>
    </Card>
  )
}