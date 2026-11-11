"use client"
import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Box, Zap, Sparkles, Star, Shield, ChevronDown, ChevronUp, Check, X, Globe, Server } from "lucide-react"
import { cn } from "@/lib/utils"

interface Model {
  id: string
  alias: string
  isPrimary: boolean
  isFallback: boolean
  provider: string
  providerBadge: string
}

const PROVIDER_LABELS: Record<string, string> = {
  "iflow-cn": "IFLOW-CN",
  "semutssh": "SEMUTSSH",
  "sumopod": "SUMOPOD",
  "openrouter": "OPENROUTER",
  "nvidia": "NVIDIA",
  "zai": "ZAI",
  "unknown": "UNKNOWN",
}

export default function ModelsPage() {
  const [models, setModels] = useState<Model[]>([])
  const [loading, setLoading] = useState(true)
  const [confirm, setConfirm] = useState<{ type: string; modelId: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const [filterProvider, setFilterProvider] = useState("all")
  const [showAdd, setShowAdd] = useState(false)
  const [addProvider, setAddProvider] = useState("openrouter")
  const [addModelId, setAddModelId] = useState("")
  const [addAlias, setAddAlias] = useState("")
  const [addLoading, setAddLoading] = useState(false)

  const fetchModels = () => {
    fetch("/dashboard/api/models")
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then(d => {
        setModels(d.models || [])
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
      })
  }

  useEffect(() => { fetchModels() }, [])

  const doAction = async (action: string, modelId: string, extra?: any) => {
    setBusy(true)
    setConfirm(null)
    try {
      await fetch("/dashboard/api/models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, modelId, ...extra }),
      })
      fetchModels()
    } finally {
      setBusy(false)
    }
  }

  const doAddModel = async () => {
    if (!addModelId.trim()) return
    setAddLoading(true)
    try {
      await fetch("/dashboard/api/models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add-model", modelId: addModelId.trim(), alias: addAlias.trim(), provider: addProvider }),
      })
      setShowAdd(false)
      setAddModelId("")
      setAddAlias("")
      fetchModels()
    } finally {
      setAddLoading(false)
    }
  }

  const doDeleteModel = async (modelId: string) => {
    setBusy(true)
    setConfirm(null)
    try {
      await fetch("/dashboard/api/models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete-model", modelId }),
      })
      fetchModels()
    } finally {
      setBusy(false)
    }
  }

  const primaryCount = models.filter(m => m.isPrimary).length
  const fallbackCount = models.filter(m => m.isFallback).length
  const filtered = filterProvider === "all" ? models : models.filter(m => m.provider === filterProvider)
  const availableProviders = Array.from(new Set(models.map(m => m.provider))).sort()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center animate-pulse border border-violet-500/10">
            <Box className="h-6 w-6 text-violet-400" />
          </div>
          <p className="text-sm text-slate-400">Loading models...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 bg-grid min-h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold gradient-text">AI Models</h2>
          <p className="text-sm text-slate-500 mt-0.5">Model registry dari hermes.json</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20">
            <Star className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-xs text-amber-400">{primaryCount} primary</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <Shield className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-xs text-emerald-400">{fallbackCount} fallback</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/50 border border-slate-700/50">
            <Server className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-xs text-slate-400">{models.length} total</span>
          </div>
          <button
            onClick={() => { setLoading(true); fetchModels() }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs hover:bg-cyan-500/20 transition-colors"
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-500 uppercase tracking-wider">Filter Provider</span>
          <select
            value={filterProvider}
            onChange={(e) => setFilterProvider(e.target.value)}
            className="px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-sm text-slate-300 focus:outline-none focus:border-emerald-500/30"
          >
            <option value="all">All Providers</option>
            {availableProviders.map((provider) => (
              <option key={provider} value={provider}>
                {PROVIDER_LABELS[provider] || provider.toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs text-slate-500">
          Menampilkan <span className="text-slate-300 font-medium">{filtered.length}</span> dari {models.length} model
        </div>
      </div>

      {/* Summary bar */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(PROVIDER_LABELS).filter(([k]) => k !== "unknown").map(([key, label]) => {
          const count = models.filter(m => m.provider === key).length
          if (count === 0) return null
          const badgeClass = models.find(m => m.provider === key)?.providerBadge || "bg-slate-500/20 text-slate-400 border-slate-500/30"
          return (
            <div key={key} className={cn("flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium", badgeClass)}>
              <Globe className="h-3 w-3" />
              {label} <span className="opacity-60">×{count}</span>
            </div>
          )
        })}
      </div>

      {/* Confirmation Modal */}
      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setConfirm(null)}>
          <div className="glass-card border border-slate-700/50 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col items-center text-center gap-4">
              <div className={cn("p-3 rounded-full", confirm.type === "set-primary" ? "bg-amber-500/20" : "bg-emerald-500/20")}>
                {confirm.type === "set-primary" ? (
                  <Star className="h-6 w-6 text-amber-400" />
                ) : (
                  <Shield className="h-6 w-6 text-emerald-400" />
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-white mb-1">
                  {confirm.type === "set-primary" ? "Set Primary Model?" : "Toggle Fallback?"}
                </p>
                <p className="text-xs text-slate-400 font-mono">{confirm.modelId}</p>
              </div>
              <div className="flex items-center gap-3 w-full">
                <button onClick={() => setConfirm(null)} className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 text-slate-400 text-sm hover:bg-slate-700/50 transition-colors">
                  Batal
                </button>
                <button
                  disabled={busy}
                  onClick={() => {
                    if (confirm.type === "set-primary") {
                      doAction("set-primary", confirm.modelId)
                    } else {
                      const m = models.find(x => x.id === confirm.modelId)
                      doAction("set-fallback", confirm.modelId, { add: !m?.isFallback })
                    }
                  }}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors",
                    confirm.type === "set-primary"
                      ? "bg-amber-500/20 border border-amber-500/30 text-amber-400 hover:bg-amber-500/30"
                      : "bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/30"
                  )}
                >
                  {busy ? "Loading..." : "Konfirmasi"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Model Cards */}
      <div className="grid gap-3">
        {filtered.map((model, i) => {
          const shortName = model.id.split("/").pop() || model.id
          const providerLabel = PROVIDER_LABELS[model.provider] || model.provider.toUpperCase()

          return (
            <Card
              key={model.id}
              className={cn(
                "glass-card group hover:scale-[1.005] transition-all duration-300 animate-fade-in",
                model.isPrimary ? "border-amber-500/40 shadow-lg shadow-amber-500/5" : "border-slate-800/50"
              )}
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  {/* Provider Badge */}
                  <div className={cn("flex flex-col items-center justify-center w-16 shrink-0 rounded-xl py-2 border text-center", model.providerBadge)}>
                    <Globe className="h-3 w-3 mb-0.5" />
                    <span className="text-[9px] font-bold leading-tight">{providerLabel}</span>
                  </div>

                  {/* Model info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <p className="text-sm font-semibold text-white">{shortName}</p>
                      {model.alias && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800/80 text-cyan-400 border border-cyan-500/20 font-mono">
                          {model.alias}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 truncate font-mono">{model.id}</p>
                  </div>

                  {/* Badges & controls */}
                  <div className="flex items-center gap-2 shrink-0">
                    {model.isPrimary ? (
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">
                        <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                        <span className="text-xs text-amber-400 font-medium">Primary</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirm({ type: "set-primary", modelId: model.id })}
                        className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/50 border border-slate-700/50 hover:border-amber-500/30 hover:bg-amber-500/5 transition-colors"
                      >
                        <Star className="h-3.5 w-3.5 text-slate-500" />
                        <span className="text-xs text-slate-500">Primary</span>
                      </button>
                    )}

                    {!model.isPrimary && (
                      <button
                        onClick={() => setConfirm({ type: "toggle-fallback", modelId: model.id })}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-1 rounded-full border transition-colors",
                          model.isFallback
                            ? "bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20"
                            : "bg-slate-800/50 border-slate-700/50 hover:border-emerald-500/30 hover:bg-emerald-500/5"
                        )}
                      >
                        <Shield className={cn("h-3.5 w-3.5", model.isFallback ? "text-emerald-400" : "text-slate-500")} />
                        <span className={cn("text-xs font-medium", model.isFallback ? "text-emerald-400" : "text-slate-500")}>Fallback</span>
                      </button>
                    )}

                    {/* Status indicator */}
                    {model.isPrimary ? (
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                      </span>
                    ) : model.isFallback ? (
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                    ) : (
                      <span className="h-2 w-2 rounded-full bg-slate-600"></span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
        {filtered.length === 0 && (
          <Card className="glass-card border-slate-800/50">
            <CardContent className="p-8 text-center text-slate-500">
              Tidak ada model untuk provider yang dipilih.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}