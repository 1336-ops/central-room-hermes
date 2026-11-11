"use client"

import React, { useEffect, useState } from "react"
import { Check, ChevronDown, Zap, Star, Shield, Box } from "lucide-react"
import { cn } from "@/lib/utils"

interface Model {
  id: string
  alias: string
  isPrimary: boolean
  isFallback: boolean
  provider: string
}

export function ModelSelector() {
  const [models, setModels] = useState<Model[]>([])
  const [primary, setPrimary] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  const fetchData = async () => {
    try {
      const r = await fetch("/dashboard/api/models")
      const d = await r.json()
      setModels(d.models || [])
      setPrimary(d.primary || "")
    } catch (e) {
      console.error("Failed to fetch models", e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleSetPrimary = async (modelId: string) => {
    if (modelId === primary || busy) return
    setBusy(true)
    try {
      await fetch("/dashboard/api/models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "set-primary", modelId }),
      })
      setPrimary(modelId)
      setIsOpen(false)
      // Optional: force refresh or show toast
    } catch (e) {
      console.error("Failed to set primary model", e)
    } finally {
      setBusy(false)
    }
  }

  const primaryModel = models.find(m => m.id === primary)
  const primaryLabel = primaryModel ? (primaryModel.alias || primaryModel.id.split("/").pop()) : "Select Model"

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/50 border border-slate-700/50 text-xs font-medium transition-all hover:bg-slate-700/50",
          isOpen && "ring-2 ring-emerald-500/20 border-emerald-500/30"
        )}
      >
        <Zap className={cn("h-3.5 w-3.5", primary ? "text-amber-400 fill-amber-400" : "text-slate-500")} />
        <span className="text-slate-300 truncate max-w-[120px]">{primaryLabel}</span>
        <ChevronDown className={cn("h-3 w-3 text-slate-500 transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-10 z-50 w-72 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl animate-in fade-in zoom-in duration-200 overflow-hidden">
            <div className="p-3 border-b border-slate-800 flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Primary Model</span>
              <Star className="h-3 w-3 text-amber-500" />
            </div>
            <div className="max-h-80 overflow-y-auto p-1.5 scrollbar-thin scrollbar-thumb-slate-800">
              {models.map((model) => (
                <button
                  key={model.id}
                  onClick={() => handleSetPrimary(model.id)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-colors",
                    model.id === primary
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "text-slate-400 hover:bg-slate-800 hover:text-white"
                  )}
                >
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium truncate">
                      {model.alias || model.id.split("/").pop()}
                    </span>
                    <span className="text-[10px] text-slate-500 truncate font-mono">{model.id}</span>
                  </div>
                  {model.id === primary && <Check className="h-4 w-4 shrink-0 ml-2" />}
                </button>
              ))}
            </div>
            <div className="p-2 border-t border-slate-800 bg-slate-900/50">
              <a 
                href="/dashboard/models" 
                className="flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] font-medium text-cyan-400 hover:bg-cyan-400/10 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <Box className="h-3 w-3" />
                Manage All Models
              </a>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
