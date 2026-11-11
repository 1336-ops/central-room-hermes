import { NextRequest, NextResponse } from "next/server"
import { readFileSync, readdirSync, existsSync, statSync } from "fs"
import path from "path"
import {
  PROFILES, Profile, getProfileDir, readConfig,
  getGatewayState, safeExec, getTimeAgo, HERMES_HOME, getSessionsDirs
} from "@/lib/hermes"

export async function GET(req: NextRequest) {
  const profile = (req.nextUrl.searchParams.get("profile") || "coding") as Profile

  try {
    const profileDir = getProfileDir(profile)
    const config = readConfig(profile)
    const gwState = getGatewayState(profile)

    // Sessions
    const sessionsDirs = getSessionsDirs(profile)
    let totalSessions = 0
    const sessionFiles: { file: string; dir: string }[] = []
    for (const sessionsDir of sessionsDirs) {
      if (existsSync(sessionsDir)) {
        try {
          const files = readdirSync(sessionsDir).filter(f => f.endsWith(".jsonl") && !f.includes("checkpoint"))
          totalSessions += files.length
          sessionFiles.push(...files.sort((a, b) => {
            const sa = statSync(path.join(sessionsDir, a)).mtime.getTime()
            const sb = statSync(path.join(sessionsDir, b)).mtime.getTime()
            return sb - sa
          }).map(f => ({ file: f, dir: sessionsDir })))
        } catch {}
      }
    }

    // Uptime
    let uptimeStr = "N/A"
    const uptimeRaw = safeExec("uptime -p")
    if (uptimeRaw) uptimeStr = uptimeRaw.replace("up ", "")

    // All profiles gateway status
    const profilesStatus = PROFILES.map(p => {
      const s = getGatewayState(p)
      return { profile: p, pid: s.pid, state: s.gateway_state || "stopped" }
    })

    // Token usage from sessions
    const today = new Date()
    const days = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"]
    const hist7d: Record<string, any>[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today); d.setDate(d.getDate() - i)
      hist7d.push({ date: days[d.getDay()], tokens: 0 })
    }

    const usageBreakdown: Record<string, number> = {}
    let totalWeekTokens = 0

    for (const f of sessionFiles.slice(0, 200)) {
      const file = f.file
      const sessionsDir = f.dir
      try {
        const content = readFileSync(path.join(f.dir, f.file), "utf-8")
        const lines = content.split("\n").filter(Boolean)
        for (const line of lines) {
          try {
            const msg = JSON.parse(line)
            if (msg.type !== "message") continue
            const m = msg.message
            if (!m || m.role !== "assistant") continue
            const shortModel = (m.model || "unknown").split("/").pop() || m.model
            const usage = m.usage || {}
            let totalTokens = usage.totalTokens || (usage.input || 0) + (usage.output || 0)
            if (totalTokens === 0) {
              const contentStr = typeof m.content === "string"
                ? m.content
                : Array.isArray(m.content)
                ? m.content.map((c: any) => c.text || c.thinking || "").join(" ")
                : ""
              totalTokens = Math.ceil(contentStr.length / 4 * 3)
            }
            if (totalTokens === 0) continue
            const msgDate = new Date(m.timestamp || msg.timestamp)
            const msAgo = today.getTime() - msgDate.getTime()
            const dayDiff = Math.floor(msAgo / 86400000)
            if (dayDiff >= 0 && dayDiff < 7) {
              usageBreakdown[shortModel] = (usageBreakdown[shortModel] || 0) + totalTokens
              hist7d[6 - dayDiff].tokens += totalTokens
              totalWeekTokens += totalTokens
            }
          } catch {}
        }
      } catch {}
    }

    const breakdownWithProvider = Object.entries(usageBreakdown)
      .map(([model, tokens]) => ({ model, tokens }))
      .sort((a, b) => b.tokens - a.tokens)

    const recentActivity: any[] = []
    for (const f of sessionFiles.slice(0, 5)) {
      const file = f.file
      const sessionsDir = f.dir
      try {
        const stat = statSync(path.join(sessionsDir, file))
        const id = file.replace(".jsonl", "").slice(0, 8)
        recentActivity.push({
          id: `session-${id}`,
          type: "session",
          message: `Session: ${id}...`,
          time: getTimeAgo(stat.mtime.getTime()),
        })
      } catch {}
    }

    return NextResponse.json({
      profile,
      profilesStatus,
      stats: {
        totalSessions,
        tokenUsage: totalWeekTokens,
        activeModels: config.custom_providers?.length || 0,
        uptime: uptimeStr,
        usageBreakdown,
        breakdownWithProvider,
        defaultModel: config.model?.default || "unknown",
      },
      gateway: {
        pid: gwState.pid,
        state: gwState.gateway_state || "stopped",
        platforms: gwState.platforms || {},
      },
      usageHistory: hist7d,
      recentActivity: recentActivity.slice(0, 10),
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}