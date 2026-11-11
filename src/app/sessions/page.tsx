"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { MessageSquare, User, Clock, Trash2, Eye, X, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"

interface Session {
  id: string
  name: string
  model: string
  status: string
  messages: number
  tokens: number
  started: string
  lastActive: string
  path: string
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteConfirm, setDeleteConfirm] = useState<Session | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [viewSession, setViewSession] = useState<{ session: Session; content: string } | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null)

  const showToast = (msg: string, type: "ok" | "err" = "ok") => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchSessions = () => {
    setLoading(true)
    fetch("/dashboard/api/sessions")
      .then(r => r.json())
      .then(d => { setSessions(d.sessions || []); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { fetchSessions() }, [])

  const deleteSession = async (session: Session) => {
    setDeleting(true)
    try {
      const params = new URLSearchParams()
      if (session.path) params.set("path", session.path)
      else params.set("id", session.id)
      const r = await fetch(`/dashboard/api/sessions?${params.toString()}`, { method: "DELETE" })
      const d = await r.json()
      if (d.ok) {
        showToast("Session deleted")
        setDeleteConfirm(null)
        fetchSessions()
      } else {
        showToast(d.error || "Failed", "err")
      }
    } catch (e: any) {
      showToast(e.message, "err")
    } finally {
      setDeleting(false)
    }
  }

  const viewSessionLog = async (session: Session) => {
    if (!session.path) { showToast("No file path for this session", "err"); return }
    try {
      const r = await fetch(`/dashboard/api/files?path=${encodeURIComponent(session.path)}&action=read`)
      const d = await r.json()
      if (d.error) { showToast(d.error, "err"); return }
      setViewSession({ session, content: d.content })
    } catch (e: any) {
      showToast(e.message, "err")
    }
  }

  const statusConfig: Record<string, { color: string; bg: string; border: string; dot: string; label: string }> = {
    active: { color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/20", dot: "bg-emerald-400", label: "Active" },
    idle: { color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/20", dot: "bg-amber-400", label: "Idle" },
    ended: { color: "text-slate-500", bg: "bg-slate-500/10", border: "border-slate-500/20", dot: "bg-slate-600", label: "Ended" },
  }

  return (
    <div className="space-y-6 bg-grid min-h-[calc(100vh-4rem)]">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold gradient-text">Sessions</h2>
          <p className="text-sm text-slate-500 mt-0.5">Active & recent conversations</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchSessions} className="p-2 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:bg-slate-700/50 transition-colors">
            <RefreshCw className={cn("h-4 w-4 text-slate-400", loading && "animate-spin")} />
          </button>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <span className="relative flex h-1.5 w-1.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span></span>
            <span className="text-xs text-emerald-400">{sessions.filter(s => s.status === "active").length} active</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/50 border border-slate-700/50">
            <span className="text-xs text-slate-400">{sessions.length} total</span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {sessions.length === 0 ? (
          <Card className="glass-card border-slate-800/50">
            <CardContent className="p-8 text-center">
              <MessageSquare className="h-8 w-8 text-slate-600 mx-auto mb-3" />
              <p className="text-sm text-slate-500">Belum ada session</p>
            </CardContent>
          </Card>
        ) : (
          sessions.map((session, i) => {
            const cfg = statusConfig[session.status] || statusConfig.ended
            return (
              <Card key={`${session.id}-${i}`} className="glass-card border-slate-800/50 group hover:scale-[1.003] transition-all duration-300 animate-fade-in" style={{ animationDelay: `${i * 40}ms` }}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/10 shrink-0">
                      <User className="h-4 w-4 text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-semibold text-white">{session.name}</p>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800/80 text-slate-400 border border-slate-700/50 font-mono">{session.model}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" />{session.messages} msgs</span>
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{session.started}</span>
                        {session.tokens > 0 && <span>{session.tokens.toLocaleString()} tokens</span>}
                      </div>
                    </div>
                    {/* Status */}
                    <div className={cn("flex items-center gap-2 px-3 py-1 rounded-full", cfg.bg, "border", cfg.border)}>
                      {session.status === "active" ? (
                        <span className="relative flex h-1.5 w-1.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span></span>
                      ) : (
                        <span className={cn("h-1.5 w-1.5 rounded-full", cfg.dot)}></span>
                      )}
                      <span className={cn("text-xs font-medium", cfg.color)}>{cfg.label}</span>
                    </div>
                    {/* Action buttons */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {session.path && (
                        <button onClick={() => viewSessionLog(session)} className="p-1.5 rounded-lg hover:bg-slate-700/50 text-slate-500 hover:text-cyan-400 transition-colors" title="View log">
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button onClick={() => setDeleteConfirm(session)} className="p-1.5 rounded-lg hover:bg-slate-700/50 text-slate-500 hover:text-red-400 transition-colors" title="Delete">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* View Session Modal */}
      {viewSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setViewSession(null)}>
          <Card className="glass-card border-slate-700/50 w-full max-w-3xl max-h-[80vh] animate-fade-in" onClick={e => e.stopPropagation()}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-medium text-white">{viewSession.session.name}</h3>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">{viewSession.session.path}</p>
                </div>
                <button onClick={() => setViewSession(null)} className="p-2 rounded-lg hover:bg-slate-700/50 text-slate-400">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <pre className="text-xs text-slate-300 font-mono leading-relaxed overflow-y-auto max-h-[60vh] p-4 rounded-xl bg-slate-900/50 border border-slate-800/50 whitespace-pre-wrap break-words">
                {viewSession.content}
              </pre>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setDeleteConfirm(null)}>
          <Card className="glass-card border-red-500/30 w-full max-w-md animate-fade-in" onClick={e => e.stopPropagation()}>
            <CardContent className="p-5 space-y-4">
              <h3 className="text-sm font-medium text-white flex items-center gap-2"><Trash2 className="h-4 w-4 text-red-400" /> Delete Session</h3>
              <p className="text-sm text-slate-400">Hapus session <span className="text-white font-medium">{deleteConfirm.name}</span>?</p>
              <div className="flex justify-end gap-2">
                <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 rounded-lg bg-slate-800/50 text-slate-400 text-sm border border-slate-700/50">Cancel</button>
                <button onClick={() => deleteSession(deleteConfirm)} disabled={deleting} className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 text-sm border border-red-500/30 hover:bg-red-500/30 transition-colors">
                  {deleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </CardContent>
          </Card>
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
