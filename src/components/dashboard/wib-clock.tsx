"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Clock, MapPin } from "lucide-react"

export function WibClock({ simplified }: { simplified?: boolean }) {
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    setNow(new Date())
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  if (!now) return null

  const getTime = (tz: string) => now.toLocaleTimeString("id-ID", {
    timeZone: tz, hour: "2-digit", minute: "2-digit", second: "2-digit"
  })

  const timeWIB = getTime("Asia/Jakarta")
  const [h, m, s] = timeWIB.split(/[.:]/)
  const date = now.toLocaleDateString("id-ID", {
    timeZone: "Asia/Jakarta",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  if (simplified) {
    return (
      <Card className="glass-card border-slate-800/50 group hover:scale-[1.02] transition-all duration-300">
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg shadow-amber-500/20">
              <Clock className="h-3.5 w-3.5 text-white" />
            </div>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
              <MapPin className="h-2 w-2 text-amber-400" />
              <span className="text-[8px] text-amber-400 font-bold uppercase">WIB</span>
            </div>
          </div>
          <p className="text-xl font-bold text-white tracking-tight font-mono">
            {h}<span className="text-amber-500 animate-status">:</span>{m}<span className="text-amber-500 animate-status">:</span>{s}
          </p>
          <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider">Jakarta Time</p>
          <p className="text-[8px] text-slate-600 mt-0.5 truncate">{date}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="glass-card border-slate-800/50 flex flex-col items-center justify-center">
      <CardContent className="py-6 flex flex-col items-center w-full">
        <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/10 mb-4">
          <Clock className="h-6 w-6 text-amber-400" />
        </div>
        <div className="flex items-baseline gap-1 mb-2">
          <span className="text-4xl font-bold font-mono text-white tracking-wider">{h}</span>
          <span className="text-4xl font-bold font-mono text-amber-400 animate-status">:</span>
          <span className="text-4xl font-bold font-mono text-white tracking-wider">{m}</span>
          <span className="text-4xl font-bold font-mono text-amber-400 animate-status">:</span>
          <span className="text-4xl font-bold font-mono text-white tracking-wider">{s}</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/50 border border-slate-700/50 mb-3">
          <span className="text-xs text-amber-400 font-medium">WIB (Jakarta)</span>
        </div>
        <p className="text-xs text-slate-500">{date}</p>
      </CardContent>
    </Card>
  )
}
