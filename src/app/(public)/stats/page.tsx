import { readFileSync, readdirSync, existsSync, statSync } from "fs"
import path from "path"

const COST_PER_1M: Record<string, number> = {
  "mimo-v2-pro": 0.14,
  "mimo-v2-omni": 0.14,
  "deepseek-r1": 0.27,
  "qwen3-coder-plus": 0.17,
  "qwen3-max": 0.34,
  "claude-sonnet-4-6": 3.00,
  "claude-opus-4-6": 15.00,
  "claude-sonnet-4.5": 3.00,
  "gpt-5-mini-free": 0,
  "kimi-k2-0905": 0.27,
  "minimax-m2.7": 0.20,
  "minimax-m2.5": 0.20,
  "step-3.5-flash": 0.20,
}
const DEFAULT_COST = 0.20
const USD_TO_IDR = 16250

const SESSION_DIRS = [
  "/home/ubuntu/.hermes/profiles/coding/sessions",
  "/home/ubuntu/.openclaw/agents/main/sessions",
]

const PROVIDER_MAP: Record<string, string> = {
  "mimo-v2-pro": "mimo",
  "mimo-v2-omni": "mimo",
  "minimaxai/minimax-m2.7": "minimax",
  "minimax/minimax-m2.5:free": "minimax",
  "minimax-m2.5": "minimax",
  "minimax-m2.5-free": "minimax",
  "stepfun-ai/step-3.5-flash": "minimax",
  "delivery-mirror": "minimax",
  "qwen3-max": "iflow",
  "qwen3-coder-plus": "iflow",
  "z-ai/glm4.7": "iflow",
  "glm-4.7": "iflow",
  "glm-5.1": "iflow",
  "z-ai/glm-4.5-air:free": "iflow",
  "openai/gpt-oss-120b:free": "semutssh",
  "gemini-3.1-pro-preview": "semutssh",
  "claude-sonnet-4.5": "semutssh",
  "claude-sonnet-4-6": "9router",
  "claude-opus-4-6": "9router",
  "9router": "9router",
  "gpt-5-mini-free": "openrouter",
  "qwen/qwen3-coder:free": "openrouter",
  "kimi-k2-0905": "nvidia",
}

const PERIOD_DAYS: Record<string, number> = {
  "1d": 1,
  "7d": 7,
  "30d": 30,
  "1y": 365,
  "all": 99999,
}

function getStats(providerFilter?: string, period?: string) {
  const byModel: Record<string, { tokens: number; cost: number; requests: number; provider: string }> = {}
  let totalTokens = 0
  let totalCostUsd = 0
  let requests = 0

  const days = PERIOD_DAYS[period || "all"] ?? 99999
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000

  for (const dir of SESSION_DIRS) {
    if (!existsSync(dir)) continue
    const files = readdirSync(dir)
      .filter(f => f.endsWith(".jsonl") && !f.includes("checkpoint"))
      .filter(f => {
        if (days >= 99999) return true
        try {
          // Filter by file modification time
          const mtime = statSync(path.join(dir, f)).mtimeMs
          return mtime >= cutoff
        } catch { return false }
      })

    for (const file of files) {
      try {
        const lines = readFileSync(path.join(dir, file), "utf-8").split("\n").filter(Boolean)
        for (const line of lines) {
          try {
            const msg = JSON.parse(line)
            if (msg.type !== "message" || msg.message?.role !== "assistant") continue
            const m = msg.message
            const fullModel = m.model || "unknown"
            const shortModel = fullModel.split("/").pop() || "unknown"
            const provider = PROVIDER_MAP[fullModel] || PROVIDER_MAP[shortModel] || "other"

            if (providerFilter && providerFilter !== "all" && provider !== providerFilter) continue

            const u = m.usage || {}
            let tokens = u.totalTokens || (u.input || 0) + (u.output || 0)
            if (!tokens) {
              const txt = typeof m.content === "string"
                ? m.content
                : Array.isArray(m.content)
                ? m.content.map((c: any) => c.text || "").join("")
                : ""
              tokens = Math.ceil(txt.length / 4 * 3)
            }
            if (!tokens) continue

            const costPer1M = COST_PER_1M[shortModel] ?? DEFAULT_COST
            const cost = (tokens / 1_000_000) * costPer1M

            if (!byModel[shortModel]) byModel[shortModel] = { tokens: 0, cost: 0, requests: 0, provider }
            byModel[shortModel].tokens += tokens
            byModel[shortModel].cost += cost
            byModel[shortModel].requests++
            totalTokens += tokens
            totalCostUsd += cost
            requests++
          } catch {}
        }
      } catch {}
    }
  }

  return { byModel, totalTokens, totalCostUsd, totalCostIdr: totalCostUsd * USD_TO_IDR, requests }
}

const PROVIDERS = [
  { id: "all", label: "Semua" },
  { id: "mimo", label: "Mimo" },
  { id: "minimax", label: "MiniMax" },
  { id: "iflow", label: "iFlow" },
  { id: "semutssh", label: "SemutsSSH" },
  { id: "9router", label: "9Router" },
  { id: "openrouter", label: "OpenRouter" },
  { id: "nvidia", label: "Nvidia" },
  { id: "other", label: "Other" },
]

const PERIODS = [
  { id: "1d", label: "1 Hari" },
  { id: "7d", label: "7 Hari" },
  { id: "30d", label: "1 Bulan" },
  { id: "1y", label: "1 Tahun" },
  { id: "all", label: "Semua" },
]

const PROVIDER_COLORS: Record<string, string> = {
  mimo: "#a78bfa",
  minimax: "#34d399",
  iflow: "#60a5fa",
  semutssh: "#f472b6",
  "9router": "#fb923c",
  openrouter: "#facc15",
  nvidia: "#4ade80",
  other: "#94a3b8",
  all: "#34d399",
}

export default async function StatsPage({ searchParams }: { searchParams: Promise<{ filter?: string; period?: string }> }) {
  const params = await searchParams
  const filter = params.filter || "all"
  const period = params.period || "all"

  const { byModel, totalTokens, totalCostUsd, totalCostIdr, requests } = getStats(
    filter === "all" ? undefined : filter,
    period
  )
  const modelList = Object.entries(byModel).sort((a, b) => b[1].tokens - a[1].tokens)
  const now = new Date().toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" })
  const accentColor = PROVIDER_COLORS[filter] || "#34d399"
  const activeProvider = PROVIDERS.find(p => p.id === filter)
  const activePeriod = PERIODS.find(p => p.id === period)

  function filterLink(f: string, p: string) {
    return `?filter=${f}&period=${p}`
  }

  return (
    <html lang="id">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Hermes Token Stats{filter !== "all" ? ` — ${activeProvider?.label}` : ""}</title>
      </head>
      <body style={{ background: "#0a0f14", margin: 0, padding: "24px 16px", fontFamily: "system-ui, sans-serif", color: "#e2e8f0" }}>
        <div style={{ maxWidth: 560, margin: "0 auto" }}>

          {/* Header */}
          <div style={{ marginBottom: 14, paddingBottom: 12, borderBottom: "1px solid #1e293b" }}>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: accentColor, margin: "0 0 4px" }}>
              ⚡ Hermes Token Usage
              {filter !== "all" && <span style={{ fontSize: 14, fontWeight: 400, color: "#94a3b8" }}> — {activeProvider?.label}</span>}
            </h1>
            <p style={{ fontSize: 11, color: "#64748b", margin: 0 }}>lexskripta.my.id • {now}</p>
          </div>

          {/* Period filter */}
          <p style={{ fontSize: 10, color: "#475569", margin: "0 0 6px", textTransform: "uppercase", letterSpacing: 1 }}>Periode</p>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
            {PERIODS.map(p => (
              <a key={p.id} href={filterLink(filter, p.id)} style={{
                padding: "4px 12px", borderRadius: 20, fontSize: 11, textDecoration: "none",
                background: period === p.id ? "#f59e0b" : "#1e293b",
                color: period === p.id ? "#000" : "#94a3b8",
                fontWeight: period === p.id ? 700 : 400,
                border: `1px solid ${period === p.id ? "#f59e0b" : "#334155"}`,
              }}>{p.label}</a>
            ))}
          </div>

          {/* Provider filter */}
          <p style={{ fontSize: 10, color: "#475569", margin: "0 0 6px", textTransform: "uppercase", letterSpacing: 1 }}>Provider</p>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
            {PROVIDERS.map(p => (
              <a key={p.id} href={filterLink(p.id, period)} style={{
                padding: "4px 10px", borderRadius: 20, fontSize: 11, textDecoration: "none",
                background: filter === p.id ? accentColor : "#1e293b",
                color: filter === p.id ? "#000" : "#94a3b8",
                fontWeight: filter === p.id ? 700 : 400,
                border: `1px solid ${filter === p.id ? accentColor : "#334155"}`,
              }}>{p.label}</a>
            ))}
          </div>

          {/* Summary cards */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 12 }}>
            {[
              { label: "Total Tokens", value: totalTokens >= 1_000_000 ? `${(totalTokens/1_000_000).toFixed(2)}M` : `${(totalTokens/1000).toFixed(1)}K`, color: accentColor },
              { label: "Cost (USD)", value: `$${totalCostUsd.toFixed(3)}`, color: "#60a5fa" },
              { label: "Cost (IDR)", value: `Rp${Math.round(totalCostIdr).toLocaleString("id-ID")}`, color: "#f59e0b" },
            ].map(s => (
              <div key={s.label} style={{ background: "#111827", borderRadius: 10, padding: "12px 14px", border: "1px solid #1e293b" }}>
                <p style={{ fontSize: 9, color: "#64748b", margin: "0 0 4px", textTransform: "uppercase", letterSpacing: 1 }}>{s.label}</p>
                <p style={{ fontSize: 17, fontWeight: 700, color: s.color, margin: 0 }}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Requests */}
          <div style={{ background: "#111827", borderRadius: 10, padding: "10px 14px", border: "1px solid #1e293b", marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 11, color: "#64748b" }}>Total Requests • {activePeriod?.label}</span>
            <span style={{ fontSize: 16, fontWeight: 700, color: accentColor }}>{requests.toLocaleString()}</span>
          </div>

          {/* Per model */}
          <div style={{ background: "#111827", borderRadius: 10, border: "1px solid #1e293b", overflow: "hidden", marginBottom: 16 }}>
            <div style={{ padding: "10px 14px", borderBottom: "1px solid #1e293b" }}>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1 }}>Usage by Model</p>
            </div>
            {modelList.length === 0 && (
              <div style={{ padding: "20px 14px", textAlign: "center", color: "#475569", fontSize: 12 }}>Tidak ada data untuk filter ini</div>
            )}
            {modelList.map(([model, stat], i) => {
              const pct = totalTokens > 0 ? (stat.tokens / totalTokens) * 100 : 0
              const tokStr = stat.tokens >= 1_000_000 ? `${(stat.tokens/1_000_000).toFixed(2)}M` : `${(stat.tokens/1000).toFixed(1)}K`
              return (
                <div key={model} style={{ padding: "10px 14px", borderBottom: i < modelList.length - 1 ? "1px solid #0f172a" : "none" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontSize: 12, color: "#e2e8f0", fontWeight: 500 }}>{model}</span>
                    <span style={{ fontSize: 11, color: "#64748b" }}>{tokStr} • ${stat.cost.toFixed(3)}</span>
                  </div>
                  <div style={{ background: "#1e293b", borderRadius: 3, height: 3 }}>
                    <div style={{ background: accentColor, borderRadius: 3, height: 3, width: `${Math.max(pct, 0.5).toFixed(1)}%` }} />
                  </div>
                  <p style={{ fontSize: 10, color: "#475569", margin: "3px 0 0" }}>{stat.requests} requests • {pct.toFixed(1)}%</p>
                </div>
              )
            })}
          </div>

          <p style={{ fontSize: 10, color: "#334155", textAlign: "center", margin: 0 }}>
            Hermes Dashboard v0.2.0 • lexskripta.my.id
          </p>
        </div>
      </body>
    </html>
  )
}