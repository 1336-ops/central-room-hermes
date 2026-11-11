"use client"

import { useState } from "react"
import { Shield, Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react"

export default function LoginPage() {
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password.trim()) return
    setLoading(true)
    setError("")
    try {
      const r = await fetch("/dashboard/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      })
      const d = await r.json()
      if (d.ok) {
        window.location.href = "/dashboard"
      } else {
        setError(d.error || "Login failed")
      }
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#050a0e] flex items-center justify-center p-4">
      {/* Background grid effect */}
      <div className="fixed inset-0 bg-grid opacity-50" />
      
      {/* Ambient glow */}
      <div className="fixed top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-r from-emerald-500/5 to-cyan-500/5 rounded-full blur-[120px]" />
      
      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-white font-bold text-xl shadow-2xl shadow-emerald-500/20 mx-auto mb-4">
            CR
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">Hermes Dashboard</h1>
          <p className="text-sm text-slate-500">Hermes AI Command Center</p>
        </div>

        {/* Login card */}
        <div className="glass-card rounded-2xl p-8 border border-slate-800/50">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-2 block">
                Password
              </label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Masukkan password..."
                  autoFocus
                  className="w-full pl-10 pr-12 py-3 bg-slate-900/50 border border-slate-800/50 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500/30 transition-colors placeholder:text-slate-700"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 animate-fade-in">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !password.trim()}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-medium shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Login <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-700 mt-6">
          LexSkripta • Hermes Dashboard
        </p>
      </div>
    </div>
  )
}
