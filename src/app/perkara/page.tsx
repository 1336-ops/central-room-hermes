"use client"
import { useEffect, useState, useCallback } from "react"
import { Search, RefreshCw, Calendar, Clock, Users, FileText, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface Perkara {
  id: string
  nomor: string
  jenisPerkara: string
  agenda: string
  tanggal: string
  jam: string
  majelis: string
  terdakwa?: string
  penggugat?: string
  pemohon?: string
  termohon?: string
  kuasaHukum: string
  status: "scheduled" | "in_progress" | "decided"
  tahapan: string
  lamaProses: number
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

const STATUS_CFG = {
  scheduled:   { label: "Terjadwal",  color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  in_progress: { label: "Berjalan",   color: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  decided:     { label: "Diputus",    color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
}

const JENIS_COLOR: Record<string, string> = {
  "Pidana Biasa":   "text-red-400",
  "Pidana Singkat": "text-orange-400",
  "Perdata":        "text-blue-400",
  "Perdata Gugatan":"text-blue-400",
  "Praperadilan":   "text-violet-400",
}

export default function PerkaraPage() {
  const [perkara, setPerkara] = useState<Perkara[]>([])
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 1 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [selected, setSelected] = useState<Perkara | null>(null)

  const load = useCallback((page = 1) => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: "20" })
    if (search) params.set("search", search)
    if (statusFilter) params.set("status", statusFilter)
    fetch(`/dashboard/api/perkara?${params}`)
      .then(r => r.json())
      .then(d => {
        setPerkara(d.data || d.perkara || [])
        setPagination(d.pagination || { page, limit: 20, total: d.data?.length || 0, totalPages: 1 })
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [search, statusFilter])

  useEffect(() => { load(1) }, [load])

  const pihak = (p: Perkara) => p.terdakwa || p.penggugat || p.pemohon || "-"

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-white">Perkara</h1>
          <p className="text-slate-500 text-sm mt-0.5">{pagination.total} perkara terdaftar</p>
        </div>
        <button onClick={() => load(pagination.page)} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg transition-colors">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-500" />
          <input
            className="bg-slate-800 border border-slate-700 text-slate-200 pl-8 pr-3 py-1.5 rounded-lg text-xs w-56 focus:outline-none focus:border-sky-500"
            placeholder="Cari nomor / pihak..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === "Enter" && load(1)}
          />
        </div>
        <select
          className="bg-slate-800 border border-slate-700 text-slate-300 px-3 py-1.5 rounded-lg text-xs focus:outline-none"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="">Semua Status</option>
          <option value="scheduled">Terjadwal</option>
          <option value="in_progress">Berjalan</option>
          <option value="decided">Diputus</option>
        </select>
      </div>

      <div className="flex gap-4">
        {/* List */}
        <div className="flex-1 min-w-0">
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            {loading ? (
              <div className="divide-y divide-slate-800">
                {[...Array(5)].map((_, i) => <div key={i} className="h-16 animate-pulse bg-slate-800/30" />)}
              </div>
            ) : perkara.length === 0 ? (
              <div className="p-12 text-center">
                <FileText className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                <p className="text-slate-500 text-sm">Tidak ada perkara</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800/50">
                {perkara.map(p => {
                  const st = STATUS_CFG[p.status] || STATUS_CFG.scheduled
                  return (
                    <div
                      key={p.id}
                      onClick={() => setSelected(selected?.id === p.id ? null : p)}
                      className={cn("px-4 py-3 cursor-pointer hover:bg-slate-800/40 transition-colors",
                        selected?.id === p.id && "bg-slate-800/60 border-l-2 border-sky-500"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-slate-200 text-sm font-mono font-medium">{p.nomor}</span>
                            <span className={cn("text-xs font-medium", JENIS_COLOR[p.jenisPerkara] || "text-slate-400")}>{p.jenisPerkara}</span>
                          </div>
                          <p className="text-slate-500 text-xs mt-0.5 truncate">{pihak(p)}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={cn("px-2 py-0.5 rounded-full text-xs border font-medium", st.color)}>{st.label}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-600">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{p.tanggal}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{p.jam}</span>
                        <span>{p.agenda}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-3">
              <span className="text-slate-600 text-xs">
                Hal {pagination.page} / {pagination.totalPages} · {pagination.total} total
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => load(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-slate-200 disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => load(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-slate-200 disabled:opacity-30 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Detail Panel */}
        {selected && (
          <div className="w-72 shrink-0 bg-slate-900 border border-slate-800 rounded-xl p-4 self-start sticky top-4">
            <div className="flex items-start justify-between mb-3">
              <h2 className="text-sky-400 font-semibold text-sm">Detail Perkara</h2>
              <button onClick={() => setSelected(null)} className="text-slate-500 hover:text-slate-300 text-lg leading-none">×</button>
            </div>
            <div className="space-y-2.5">
              {[
                ["Nomor", selected.nomor],
                ["Jenis", selected.jenisPerkara],
                ["Agenda", selected.agenda],
                ["Tanggal", `${selected.tanggal} ${selected.jam}`],
                ["Majelis", selected.majelis],
                ["Terdakwa/Pihak", pihak(selected)],
                ["Kuasa Hukum", selected.kuasaHukum || "-"],
                ["Tahapan", selected.tahapan],
                ["Lama Proses", `${selected.lamaProses} hari`],
              ].map(([k, v]) => (
                <div key={k} className="border-b border-slate-800/50 pb-2 last:border-0">
                  <p className="text-slate-600 text-xs">{k}</p>
                  <p className="text-slate-300 text-xs mt-0.5 break-words">{v}</p>
                </div>
              ))}
              <div className="pt-1">
                <span className={cn("px-2 py-1 rounded-full text-xs border font-medium", STATUS_CFG[selected.status]?.color)}>
                  {STATUS_CFG[selected.status]?.label}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
