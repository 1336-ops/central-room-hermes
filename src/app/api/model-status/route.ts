import { NextRequest, NextResponse } from "next/server"
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs"
import path from "path"
import { Profile, readConfig } from "@/lib/hermes"

const HISTORY_PATH = "/home/ubuntu/hermes-dashboard/data/model-history.json"

function readHistory(): Record<string, any[]> {
  try { return JSON.parse(readFileSync(HISTORY_PATH, "utf-8")) } catch { return {} }
}
function writeHistory(h: Record<string, any[]>) {
  const dir = path.dirname(HISTORY_PATH)
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  writeFileSync(HISTORY_PATH, JSON.stringify(h, null, 2))
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const profile = (searchParams.get("profile") || "coding") as Profile
    const config = readConfig(profile)
    const providers = config.custom_providers || []
    const history = readHistory()

    const models = providers.map((p: any) => {
      const modelId = p.model || p.name
      const hist = history[modelId] || []
      const last = hist[hist.length - 1]
      const uptime = hist.length > 0 ? (hist.filter((h: any) => h.ok).length / hist.length) * 100 : 0
      return {
        id: modelId,
        alias: p.name || modelId,
        provider: p.provider || "custom",
        isPrimary: p.isPrimary || false,
        isFallback: p.isFallback || false,
        status: last ? (last.ok ? "online" : "offline") : "unknown",
        latency: last?.latency || null,
        error: null,
        lastChecked: last?.time || null,
        inferenceTime: last?.inferenceTime || null,
        tokensPerSecond: null,
        httpStatus: last?.httpStatus || null,
        uptimePercent: Math.round(uptime),
        history: hist.slice(-20),
      }
    })

    return NextResponse.json({ models, lastUpdated: new Date().toISOString() })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { modelId, profile = "coding" } = await req.json() as { modelId: string; profile: Profile }
    const config = readConfig(profile as Profile)
    const providers = config.custom_providers || []
    const provider = providers.find((p: any) => p.model === modelId || p.name === modelId)
    if (!provider) return NextResponse.json({ error: "Model not found" }, { status: 404 })

    const url = `${provider.base_url?.replace(/\/$/, "")}/chat/completions`
    const start = Date.now()
    let ok = false
    let latency: number | null = null
    let error: string | null = null
    let httpStatus: number | null = null

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${provider.api_key || ""}`,
        },
        body: JSON.stringify({
          model: provider.model || modelId,
          messages: [{ role: "user", content: "hi" }],
          max_tokens: 5,
        }),
        signal: AbortSignal.timeout(15000),
      })
      httpStatus = res.status
      ok = res.ok
      latency = Date.now() - start
      if (!ok) error = `HTTP ${res.status}`
    } catch (e: any) {
      error = e.message
      latency = Date.now() - start
    }

    const history = readHistory()
    if (!history[modelId]) history[modelId] = []
    history[modelId].push({ time: new Date().toISOString(), ok, latency, httpStatus })
    history[modelId] = history[modelId].slice(-20)
    writeHistory(history)

    return NextResponse.json({ modelId, ok, latency, error, httpStatus, time: new Date().toISOString() })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
