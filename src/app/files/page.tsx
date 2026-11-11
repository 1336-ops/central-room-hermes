"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import {
  FolderOpen, File, FileText, FileCode, FileCog, FileImage, FileType,
  ChevronRight, ArrowLeft, Upload, Plus, Trash2, Edit3, Download,
  Search, X, Save, FolderPlus, RefreshCw, Home, AlertTriangle,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface FileItem {
  name: string; path: string; relative: string; isDir: boolean
  size: number; modified: string; icon: string; editable: boolean
}

interface Breadcrumb { name: string; path: string }

const iconMap: Record<string, any> = {
  folder: FolderOpen, code: FileCode, config: FileCog,
  text: FileText, web: FileCode, image: FileImage,
  document: FileType, script: FileCode, python: FileCode,
  env: FileCog, file: File,
}

const iconColorMap: Record<string, string> = {
  folder: "text-amber-400", code: "text-emerald-400", config: "text-cyan-400",
  text: "text-slate-400", web: "text-orange-400", image: "text-pink-400",
  document: "text-blue-400", script: "text-green-400", python: "text-yellow-400",
  env: "text-red-400", file: "text-slate-500",
}

function formatSize(bytes: number): string {
  if (bytes === 0) return "—"
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`
}

function formatDate(iso: string): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleString("id-ID", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  })
}

export default function FilesPage() {
  const [items, setItems] = useState<FileItem[]>([])
  const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([])
  const [currentPath, setCurrentPath] = useState("/home/ubuntu")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // Editor state
  const [editing, setEditing] = useState<{ path: string; name: string; content: string } | null>(null)
  const [editModified, setEditModified] = useState(false)
  const [saving, setSaving] = useState(false)

  // Search state
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[] | null>(null)
  const [searching, setSearching] = useState(false)

  // Modal state
  const [showNewFile, setShowNewFile] = useState(false)
  const [showNewFolder, setShowNewFolder] = useState(false)
  const [newName, setNewName] = useState("")
  const [showDelete, setShowDelete] = useState<FileItem | null>(null)
  const [showRename, setShowRename] = useState<FileItem | null>(null)
  const [renameName, setRenameName] = useState("")
  const [actionBusy, setActionBusy] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const showToast = (msg: string, type: "ok" | "err" = "ok") => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const navigate = useCallback((p: string) => {
    setCurrentPath(p)
    setEditing(null)
    setSearchResults(null)
    setSearchQuery("")
  }, [])

  const fetchDir = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const r = await fetch(`/dashboard/api/files?path=${encodeURIComponent(currentPath)}`)
      const d = await r.json()
      if (d.error) { setError(d.error); return }
      setItems(d.items || [])
      setBreadcrumbs(d.breadcrumbs || [])
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [currentPath])

  useEffect(() => { fetchDir() }, [fetchDir])

  const openFile = async (item: FileItem) => {
    if (item.isDir) { navigate(item.path); return }
    if (!item.editable) {
      // Download non-text files
      window.open(`/dashboard/api/files?path=${encodeURIComponent(item.path)}&action=download`, "_blank")
      return
    }
    try {
      const r = await fetch(`/dashboard/api/files?path=${encodeURIComponent(item.path)}&action=read`)
      const d = await r.json()
      if (d.error) { showToast(d.error, "err"); return }
      setEditing({ path: d.path, name: d.name, content: d.content })
      setEditModified(false)
    } catch (e: any) {
      showToast(e.message, "err")
    }
  }

  const saveFile = async () => {
    if (!editing) return
    setSaving(true)
    try {
      const r = await fetch("/dashboard/api/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "write", path: editing.path, content: editing.content }),
      })
      const d = await r.json()
      if (d.ok) { showToast("File saved!"); setEditModified(false) }
      else showToast(d.error || "Save failed", "err")
    } catch (e: any) {
      showToast(e.message, "err")
    } finally {
      setSaving(false)
    }
  }

  const doSearch = async () => {
    if (!searchQuery.trim()) { setSearchResults(null); return }
    setSearching(true)
    try {
      const r = await fetch(`/dashboard/api/files?path=${encodeURIComponent(currentPath)}&action=search&q=${encodeURIComponent(searchQuery)}`)
      const d = await r.json()
      setSearchResults(d.results || [])
    } catch {
      setSearchResults([])
    } finally {
      setSearching(false)
    }
  }

  const createFile = async () => {
    if (!newName.trim()) return
    setActionBusy(true)
    try {
      const filePath = `${currentPath}/${newName.trim()}`
      const r = await fetch("/dashboard/api/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", path: filePath, content: "" }),
      })
      const d = await r.json()
      if (d.ok) { showToast("File created"); setShowNewFile(false); setNewName(""); fetchDir() }
      else showToast(d.error || "Failed", "err")
    } finally { setActionBusy(false) }
  }

  const createFolder = async () => {
    if (!newName.trim()) return
    setActionBusy(true)
    try {
      const folderPath = `${currentPath}/${newName.trim()}`
      const r = await fetch("/dashboard/api/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mkdir", path: folderPath }),
      })
      const d = await r.json()
      if (d.ok) { showToast("Folder created"); setShowNewFolder(false); setNewName(""); fetchDir() }
      else showToast(d.error || "Failed", "err")
    } finally { setActionBusy(false) }
  }

  const deleteItem = async (item: FileItem) => {
    setActionBusy(true)
    try {
      const r = await fetch("/dashboard/api/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", path: item.path }),
      })
      const d = await r.json()
      if (d.ok) { showToast("Deleted"); setShowDelete(null); fetchDir() }
      else showToast(d.error || "Failed", "err")
    } finally { setActionBusy(false) }
  }

  const renameItem = async () => {
    if (!showRename || !renameName.trim()) return
    setActionBusy(true)
    try {
      const dir = showRename.path.replace(/\/[^/]+$/, "")
      const newPath = `${dir}/${renameName.trim()}`
      const r = await fetch("/dashboard/api/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "rename", oldPath: showRename.path, newPath }),
      })
      const d = await r.json()
      if (d.ok) { showToast("Renamed"); setShowRename(null); setRenameName(""); fetchDir() }
      else showToast(d.error || "Failed", "err")
    } finally { setActionBusy(false) }
  }

  const uploadFile = async (file: globalThis.File) => {
    const form = new FormData()
    form.append("file", file)
    form.append("path", currentPath)
    try {
      const r = await fetch("/dashboard/api/files", { method: "POST", body: form })
      const d = await r.json()
      if (d.ok) { showToast(`Uploaded: ${file.name}`); fetchDir() }
      else showToast(d.error || "Upload failed", "err")
    } catch (e: any) {
      showToast(e.message, "err")
    }
  }

  const toastEl = toast && (
    <div className={cn(
      "fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-2xl text-sm font-medium animate-fade-in border",
      toast.type === "ok"
        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
        : "bg-red-500/10 text-red-400 border-red-500/30"
    )}>
      {toast.msg}
    </div>
  )

  // Editor view
  if (editing) {
    return (
      <div className="space-y-4 bg-grid min-h-[calc(100vh-4rem)]">
        {/* Editor header */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <button onClick={() => setEditing(null)} className="p-2 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:bg-slate-700/50 transition-colors">
              <ArrowLeft className="h-4 w-4 text-slate-400" />
            </button>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <FileCode className="h-5 w-5 text-emerald-400" />
                {editing.name}
                {editModified && <span className="text-xs text-amber-400 font-normal">(unsaved)</span>}
              </h2>
              <p className="text-xs text-slate-500 font-mono">{editing.path}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={saveFile}
              disabled={saving || !editModified}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                editModified
                  ? "bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40"
                  : "bg-slate-800/50 text-slate-500 border border-slate-700/50"
              )}
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              onClick={() => {
                window.open(`/dashboard/api/files?path=${encodeURIComponent(editing.path)}&action=download`, "_blank")
              }}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-slate-400 text-sm hover:bg-slate-700/50 transition-colors"
            >
              <Download className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Editor */}
        <Card className="glass-card border-slate-800/50">
          <CardContent className="p-0">
            <textarea
              value={editing.content}
              onChange={e => { setEditing({ ...editing, content: e.target.value }); setEditModified(true) }}
              className="w-full min-h-[calc(100vh-14rem)] p-4 bg-transparent text-sm text-slate-200 font-mono resize-none focus:outline-none leading-relaxed"
              spellCheck={false}
              placeholder="Empty file..."
            />
          </CardContent>
        </Card>

        {toastEl}
      </div>
    )
  }


  return (
    <div className="space-y-5 bg-grid min-h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold gradient-text">File Manager</h2>
          <p className="text-sm text-slate-500 mt-0.5">Browse & manage files on VPS</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={fetchDir} className="p-2 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:bg-slate-700/50 transition-colors" title="Refresh">
            <RefreshCw className={cn("h-4 w-4 text-slate-400", loading && "animate-spin")} />
          </button>
          <button onClick={() => { setShowNewFile(true); setNewName("") }} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-slate-300 text-sm hover:bg-slate-700/50 transition-colors">
            <Plus className="h-4 w-4" /> File
          </button>
          <button onClick={() => { setShowNewFolder(true); setNewName("") }} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-slate-300 text-sm hover:bg-slate-700/50 transition-colors">
            <FolderPlus className="h-4 w-4" /> Folder
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-500/20 text-emerald-400 text-sm hover:from-emerald-500/30 hover:to-cyan-500/30 transition-colors">
            <Upload className="h-4 w-4" /> Upload
          </button>
          <input ref={fileInputRef} type="file" className="hidden" onChange={e => { if (e.target.files?.[0]) uploadFile(e.target.files[0]); e.target.value = "" }} />
        </div>
      </div>

      {/* Breadcrumbs */}
      <div className="flex items-center gap-1 text-sm flex-wrap">
        {breadcrumbs.map((bc, i) => (
          <span key={bc.path} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="h-3 w-3 text-slate-600" />}
            <button onClick={() => navigate(bc.path)} className={cn("px-2 py-0.5 rounded-md transition-colors", i === breadcrumbs.length - 1 ? "text-white font-medium bg-slate-800/50" : "text-slate-400 hover:text-white hover:bg-slate-800/50")}>
              {i === 0 ? <Home className="h-3.5 w-3.5 inline" /> : bc.name}
            </button>
          </span>
        ))}
      </div>

      {/* Search */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && doSearch()}
            placeholder="Search files..."
            className="w-full pl-10 pr-10 py-2.5 bg-slate-900/50 border border-slate-800/50 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500/30 transition-colors"
          />
          {searchQuery && (
            <button onClick={() => { setSearchQuery(""); setSearchResults(null) }} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="h-4 w-4 text-slate-500 hover:text-white" />
            </button>
          )}
        </div>
        <button onClick={doSearch} disabled={searching} className="px-4 py-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 text-sm text-slate-300 hover:bg-slate-700/50 transition-colors">
          {searching ? "..." : "Search"}
        </button>
      </div>

      {/* Search results */}
      {searchResults && (
        <Card className="glass-card border-cyan-500/20">
          <CardContent className="p-4">
            <p className="text-xs text-slate-500 mb-3">Search results: {searchResults.length}</p>
            {searchResults.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">No results found</p>
            ) : (
              <div className="space-y-1 max-h-60 overflow-y-auto">
                {searchResults.map((r, i) => (
                  <button key={i} onClick={() => r.isDir ? navigate(r.path) : openFile({ ...r, editable: true, size: 0, modified: "", icon: "file" })} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-800/50 transition-colors text-left">
                    {r.isDir ? <FolderOpen className="h-4 w-4 text-amber-400 shrink-0" /> : <File className="h-4 w-4 text-slate-400 shrink-0" />}
                    <span className="truncate font-mono text-xs">{r.relative}</span>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Error */}
      {error && (
        <Card className="glass-card border-red-500/30">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-400 shrink-0" />
            <p className="text-sm text-red-400">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* File list */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="glass-card rounded-xl p-4 animate-shimmer border border-slate-800/50">
              <div className="h-5 w-48 bg-slate-800/50 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-1">
          {/* Parent directory */}
          {currentPath !== "/home/ubuntu" && (
            <button
              onClick={() => navigate(currentPath.replace(/\/[^/]+$/, "") || "/home/ubuntu")}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-slate-400 hover:bg-slate-800/30 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>..</span>
            </button>
          )}

          {items.map((item, i) => {
            const Icon = iconMap[item.icon] || File
            const color = iconColorMap[item.icon] || "text-slate-500"
            return (
              <div
                key={item.name}
                className="group flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-800/30 transition-all animate-fade-in cursor-pointer"
                style={{ animationDelay: `${i * 20}ms` }}
                onClick={() => openFile(item)}
              >
                <Icon className={cn("h-5 w-5 shrink-0", color)} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium truncate">{item.name}</p>
                  <p className="text-xs text-slate-600">{formatDate(item.modified)}</p>
                </div>
                <span className="text-xs text-slate-600 hidden sm:block">{formatSize(item.size)}</span>
                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!item.isDir && (
                    <button
                      onClick={e => { e.stopPropagation(); window.open(`/dashboard/api/files?path=${encodeURIComponent(item.path)}&action=download`, "_blank") }}
                      className="p-1.5 rounded-lg hover:bg-slate-700/50 text-slate-500 hover:text-cyan-400 transition-colors" title="Download"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button
                    onClick={e => { e.stopPropagation(); setShowRename(item); setRenameName(item.name) }}
                    className="p-1.5 rounded-lg hover:bg-slate-700/50 text-slate-500 hover:text-amber-400 transition-colors" title="Rename"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); setShowDelete(item) }}
                    className="p-1.5 rounded-lg hover:bg-slate-700/50 text-slate-500 hover:text-red-400 transition-colors" title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )
          })}

          {items.length === 0 && !error && (
            <div className="text-center py-12">
              <FolderOpen className="h-10 w-10 text-slate-700 mx-auto mb-3" />
              <p className="text-sm text-slate-500">Folder kosong</p>
            </div>
          )}
        </div>
      )}

      {/* === MODALS === */}

      {/* New File Modal */}
      {showNewFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setShowNewFile(false)}>
          <Card className="glass-card border-slate-700/50 w-full max-w-md animate-fade-in" onClick={e => e.stopPropagation()}>
            <CardContent className="p-5 space-y-4">
              <h3 className="text-sm font-medium text-white flex items-center gap-2"><Plus className="h-4 w-4 text-emerald-400" /> New File</h3>
              <input value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === "Enter" && createFile()} placeholder="filename.txt" autoFocus className="w-full px-3 py-2.5 bg-slate-900/50 border border-slate-800/50 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500/30" />
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowNewFile(false)} className="px-4 py-2 rounded-lg bg-slate-800/50 text-slate-400 text-sm border border-slate-700/50">Cancel</button>
                <button onClick={createFile} disabled={actionBusy || !newName.trim()} className="px-4 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 text-sm border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors">Create</button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* New Folder Modal */}
      {showNewFolder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setShowNewFolder(false)}>
          <Card className="glass-card border-slate-700/50 w-full max-w-md animate-fade-in" onClick={e => e.stopPropagation()}>
            <CardContent className="p-5 space-y-4">
              <h3 className="text-sm font-medium text-white flex items-center gap-2"><FolderPlus className="h-4 w-4 text-amber-400" /> New Folder</h3>
              <input value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === "Enter" && createFolder()} placeholder="folder-name" autoFocus className="w-full px-3 py-2.5 bg-slate-900/50 border border-slate-800/50 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500/30" />
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowNewFolder(false)} className="px-4 py-2 rounded-lg bg-slate-800/50 text-slate-400 text-sm border border-slate-700/50">Cancel</button>
                <button onClick={createFolder} disabled={actionBusy || !newName.trim()} className="px-4 py-2 rounded-lg bg-amber-500/20 text-amber-400 text-sm border border-amber-500/30 hover:bg-amber-500/30 transition-colors">Create</button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setShowDelete(null)}>
          <Card className="glass-card border-red-500/30 w-full max-w-md animate-fade-in" onClick={e => e.stopPropagation()}>
            <CardContent className="p-5 space-y-4">
              <h3 className="text-sm font-medium text-white flex items-center gap-2"><Trash2 className="h-4 w-4 text-red-400" /> Delete Confirmation</h3>
              <p className="text-sm text-slate-400">Delete <span className="text-white font-medium">{showDelete.name}</span>{showDelete.isDir ? " (folder + all contents)" : ""}?</p>
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowDelete(null)} className="px-4 py-2 rounded-lg bg-slate-800/50 text-slate-400 text-sm border border-slate-700/50">Cancel</button>
                <button onClick={() => deleteItem(showDelete)} disabled={actionBusy} className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 text-sm border border-red-500/30 hover:bg-red-500/30 transition-colors">Delete</button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Rename Modal */}
      {showRename && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setShowRename(null)}>
          <Card className="glass-card border-amber-500/30 w-full max-w-md animate-fade-in" onClick={e => e.stopPropagation()}>
            <CardContent className="p-5 space-y-4">
              <h3 className="text-sm font-medium text-white flex items-center gap-2"><Edit3 className="h-4 w-4 text-amber-400" /> Rename</h3>
              <input value={renameName} onChange={e => setRenameName(e.target.value)} onKeyDown={e => e.key === "Enter" && renameItem()} autoFocus className="w-full px-3 py-2.5 bg-slate-900/50 border border-slate-800/50 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500/30" />
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowRename(null)} className="px-4 py-2 rounded-lg bg-slate-800/50 text-slate-400 text-sm border border-slate-700/50">Cancel</button>
                <button onClick={renameItem} disabled={actionBusy || !renameName.trim() || renameName === showRename.name} className="px-4 py-2 rounded-lg bg-amber-500/20 text-amber-400 text-sm border border-amber-500/30 hover:bg-amber-500/30 transition-colors">Rename</button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {toastEl}
    </div>
  )
}
