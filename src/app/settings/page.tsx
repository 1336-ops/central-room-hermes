"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import {
  Settings, Moon, Shield, Info, Star, RefreshCw, Save, Key,
  Code, Download, Upload, Copy, Check, Eye, EyeOff, Server,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface SettingsData {
  autoRefresh: boolean
  autoRefreshInterval: number
  primaryModel: string
}

interface ModelOption { id: string; alias: string }

interface Provider {
  id: string; baseUrl: string; apiKey: string
  apiKeyFull: string; modelCount: number
}

interface DashboardInfo {
  version: string; framework: string; runtime: string
  port: string; mode: string; theme: string
}

interface GatewayInfo {
  port: number; bind: string; authMode: string
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsData | null>(null)
  const [models, setModels] = useState<ModelOption[]>([])
  const [providers, setProviders] = useState<Provider[]>([])
  const [gateway, setGateway] = useState<GatewayInfo | null>(null)
  const [dashboardInfo, setDashboardInfo] = useState<DashboardInfo | null>(null)
  const [rawConfig, setRawConfig] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null)

  // Tabs
  const [tab, setTab] = useState<"general" | "api-keys" | "config">("general")
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [newApiKey, setNewApiKey] = useState("")
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({})
  const [configModified, setConfigModified] = useState(false)

  const showToast = (msg: string, type: "ok" | "err" = "ok") => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchSettings = () => {
    fetch("/dashboard/api/settings")
      .then(r => r.json())
      .then(d => {
        setSettings(d.settings)
        setModels(d.models || [])
        setProviders(d.providers || [])
        setGateway(d.gateway || null)
        setDashboardInfo(d.dashboardInfo)
        setRawConfig(d.rawConfig || "")
        setConfigModified(false)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => { fetchSettings() }, [])

  const save = async (patch: Partial<SettingsData>) => {
    if (!settings) return
    setSaving(true)
    setSaved(false)
    const updated = { ...settings, ...patch }
    setSettings(updated)
    try {
      await fetch("/dashboard/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      if (patch.primaryModel) fetchSettings()
    } finally {
      setSaving(false)
    }
  }

  const updateApiKey = async (providerId: string) => {
    if (!newApiKey.trim()) return
    setSaving(true)
    try {
      const r = await fetch("/dashboard/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update-api-key", providerId, apiKey: newApiKey }),
      })
      const d = await r.json()
      if (d.ok) {
        showToast(d.message || "API key updated")
        setEditingKey(null)
        setNewApiKey("")
        fetchSettings()
      } else {
        showToast(d.error || "Failed", "err")
      }
    } finally {
      setSaving(false)
    }
  }

  const saveConfig = async () => {
    setSaving(true)
    try {
      const r = await fetch("/dashboard/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save-config", rawConfig }),
      })
      const d = await r.json()
      if (d.ok) {
        showToast(d.message || "Config saved")
        setConfigModified(false)
        fetchSettings()
      } else {
        showToast(d.error || "Failed", "err")
      }
    } finally {
      setSaving(false)
    }
  }

  const exportConfig = () => {
    const blob = new Blob([rawConfig], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `hermes-config-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    showToast("Config exported")
  }

  const importConfig = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const text = reader.result as string
        JSON.parse(text) // validate
        setRawConfig(text)
        setConfigModified(true)
        showToast("Config imported — review and save")
      } catch {
        showToast("Invalid JSON file", "err")
      }
    }
    reader.readAsText(file)
    e.target.value = ""
  }

  if (loading || !settings) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center animate-pulse border border-cyan-500/10">
            <Settings className="h-6 w-6 text-cyan-400" />
          </div>
          <p className="text-sm text-slate-400">Loading settings...</p>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: "general" as const, label: "General", icon: Settings },
    { id: "api-keys" as const, label: "API Keys", icon: Key },
    { id: "config" as const, label: "Config Editor", icon: Code },
  ]

  return (
    <div className="space-y-6 bg-grid min-h-[calc(100vh-4rem)]">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold gradient-text">Settings</h2>
          <p className="text-sm text-slate-500 mt-0.5">Pengaturan dashboard & Hermes config</p>
        </div>
        {saved && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 animate-fade-in">
            <Save className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-xs text-emerald-400">Tersimpan</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all",
              tab === t.id
                ? "bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border-emerald-500/20 text-white"
                : "bg-slate-900/50 border-slate-800/50 text-slate-400 hover:border-slate-700"
            )}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* General Tab */}
      {tab === "general" && (
        <div className="space-y-4">
          {/* Dashboard Info */}
          {dashboardInfo && (
            <Card className="glass-card border-slate-800/50">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10">
                    <Info className="h-4 w-4 text-cyan-400" />
                  </div>
                  <p className="text-sm font-medium text-white">Dashboard Info</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {Object.entries(dashboardInfo).map(([key, value]) => (
                    <div key={key} className="p-3 rounded-lg bg-slate-900/50 border border-slate-800/50">
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">{key}</p>
                      <p className="text-sm text-white font-medium">{value}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Gateway Info */}
          {gateway && (
            <Card className="glass-card border-slate-800/50">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500/10 to-purple-500/10">
                    <Server className="h-4 w-4 text-violet-400" />
                  </div>
                  <p className="text-sm font-medium text-white">Gateway Config</p>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800/50">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Port</p>
                    <p className="text-sm text-white font-medium font-mono">{gateway.port}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800/50">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Bind</p>
                    <p className="text-sm text-white font-medium">{gateway.bind}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800/50">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Auth</p>
                    <p className="text-sm text-white font-medium">{gateway.authMode}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Primary Model */}
          <Card className="glass-card border-slate-800/50 animate-fade-in">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg">
                    <Star className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Primary Model</p>
                    <p className="text-xs text-slate-500">Model utama untuk agent</p>
                  </div>
                </div>
                <select
                  value={settings.primaryModel}
                  onChange={e => save({ primaryModel: e.target.value })}
                  disabled={saving}
                  className="bg-slate-900/80 border border-slate-700/50 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-amber-500/50 max-w-[280px] truncate"
                >
                  {models.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.alias ? `${m.alias} — ` : ""}{m.id.split("/").pop()}
                    </option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Toggle Settings */}
          <div className="space-y-3">
            <p className="text-xs text-slate-500 uppercase tracking-wider font-medium px-1">Preferences</p>

            {/* Auto Refresh */}
            <Card className="glass-card border-slate-800/50 animate-fade-in" style={{ animationDelay: "40ms" }}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg">
                      <RefreshCw className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">Auto Refresh</p>
                      <p className="text-xs text-slate-500">Refresh data otomatis setiap {settings.autoRefreshInterval}s</p>
                    </div>
                  </div>
                  <button
                    onClick={() => save({ autoRefresh: !settings.autoRefresh })}
                    disabled={saving}
                    className={cn(
                      "relative w-12 h-6 rounded-full transition-all duration-300",
                      settings.autoRefresh ? "bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/20" : "bg-slate-700"
                    )}
                  >
                    <span className={cn(
                      "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-300",
                      settings.autoRefresh && "translate-x-6"
                    )} />
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Dark Mode (always on) */}
            <Card className="glass-card border-slate-800/50 animate-fade-in" style={{ animationDelay: "80ms" }}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg">
                      <Moon className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">Dark Mode</p>
                      <p className="text-xs text-slate-500">Tema gelap untuk dashboard</p>
                    </div>
                  </div>
                  <div className="relative w-12 h-6 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/20">
                    <span className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm translate-x-6" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Security Mode */}
            <Card className="glass-card border-slate-800/50 animate-fade-in" style={{ animationDelay: "120ms" }}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-red-500 to-rose-500 shadow-lg">
                      <Shield className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">Security Mode</p>
                      <p className="text-xs text-slate-500">Konfirmasi sebelum aksi berbahaya</p>
                    </div>
                  </div>
                  <div className="relative w-12 h-6 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/20">
                    <span className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm translate-x-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* API Keys Tab */}
      {tab === "api-keys" && (
        <div className="space-y-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider font-medium px-1">API Providers</p>
          {providers.map((provider, i) => (
            <Card key={provider.id} className="glass-card border-slate-800/50 animate-fade-in" style={{ animationDelay: `${i * 40}ms` }}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10">
                      <Key className="h-4 w-4 text-cyan-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{provider.id.replace("custom-", "").replace(/-/g, ".")}</p>
                      <p className="text-xs text-slate-500 font-mono">{provider.baseUrl}</p>
                    </div>
                  </div>
                  <span className="text-xs text-slate-400 bg-slate-800/50 px-2 py-0.5 rounded-full">{provider.modelCount} models</span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex-1 flex items-center gap-2 p-2.5 rounded-lg bg-slate-900/50 border border-slate-800/50">
                    <Key className="h-3.5 w-3.5 text-slate-600 shrink-0" />
                    {editingKey === provider.id ? (
                      <input
                        value={newApiKey}
                        onChange={e => setNewApiKey(e.target.value)}
                        placeholder="Enter new API key..."
                        autoFocus
                        className="flex-1 bg-transparent text-xs text-white font-mono focus:outline-none"
                      />
                    ) : (
                      <span className="text-xs font-mono text-slate-400">
                        {showKeys[provider.id] ? provider.apiKeyFull : provider.apiKey}
                      </span>
                    )}
                  </div>

                  {editingKey === provider.id ? (
                    <>
                      <button
                        onClick={() => updateApiKey(provider.id)}
                        disabled={saving || !newApiKey.trim()}
                        className="p-2 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button onClick={() => { setEditingKey(null); setNewApiKey("") }} className="p-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-slate-400 hover:bg-slate-700/50 transition-colors">
                        <span className="text-xs">✕</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setShowKeys(prev => ({ ...prev, [provider.id]: !prev[provider.id] }))}
                        className="p-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-slate-400 hover:bg-slate-700/50 transition-colors"
                        title={showKeys[provider.id] ? "Hide key" : "Show key"}
                      >
                        {showKeys[provider.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => { navigator.clipboard.writeText(provider.apiKeyFull); showToast("Copied!") }}
                        className="p-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-slate-400 hover:bg-slate-700/50 transition-colors"
                        title="Copy key"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => { setEditingKey(provider.id); setNewApiKey("") }}
                        className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 transition-colors"
                        title="Edit key"
                      >
                        <Key className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Config Editor Tab */}
      {tab === "config" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <p className="text-xs text-slate-500 uppercase tracking-wider font-medium px-1">hermes.json — Raw Editor</p>
            <div className="flex items-center gap-2">
              <button onClick={exportConfig} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50 text-slate-400 text-xs hover:bg-slate-700/50 transition-colors">
                <Download className="h-3.5 w-3.5" /> Export
              </button>
              <label className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50 text-slate-400 text-xs hover:bg-slate-700/50 transition-colors cursor-pointer">
                <Upload className="h-3.5 w-3.5" /> Import
                <input type="file" accept=".json" className="hidden" onChange={importConfig} />
              </label>
              <button
                onClick={saveConfig}
                disabled={saving || !configModified}
                className={cn(
                  "flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-medium transition-all",
                  configModified
                    ? "bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40"
                    : "bg-slate-800/50 text-slate-500 border border-slate-700/50"
                )}
              >
                <Save className="h-3.5 w-3.5" />
                {saving ? "Saving..." : "Save & Restart Gateway"}
              </button>
            </div>
          </div>

          <Card className="glass-card border-slate-800/50">
            <CardContent className="p-0">
              <textarea
                value={rawConfig}
                onChange={e => { setRawConfig(e.target.value); setConfigModified(true) }}
                className="w-full min-h-[60vh] p-4 bg-transparent text-xs text-emerald-300 font-mono resize-none focus:outline-none leading-relaxed"
                spellCheck={false}
              />
            </CardContent>
          </Card>

          {configModified && (
            <p className="text-xs text-amber-400 px-1">⚠️ Config modified — Save to apply changes (auto-backup will be created)</p>
          )}
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={cn(
          "fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-2xl text-sm font-medium animate-fade-in border",
          toast.type === "ok" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" : "bg-red-500/10 text-red-400 border-red-500/30"
        )}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}
