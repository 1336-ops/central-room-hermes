import { NextRequest, NextResponse } from "next/server"
import { readFileSync, existsSync, writeFileSync, mkdirSync } from "fs"
import path from "path"
import { Profile, readConfig, getProfileDir } from "@/lib/hermes"

const HISTORY_PATH = "/home/ubuntu/hermes-dashboard/data/model-history.json"

const MODEL_CAPABILITIES: Record<string, { caps: string[]; category: string; desc: string }> = {
  "deepseek-r1":                    { caps: ["reasoning"], category: "Reasoning", desc: "Deep reasoning & complex problem solving" },
  "qwen3-235b-a22b-thinking":       { caps: ["reasoning"], category: "Reasoning", desc: "Advanced chain-of-thought reasoning" },
  "kimi-k2-thinking":               { caps: ["reasoning"], category: "Reasoning", desc: "Deep thinking with Kimi K2" },
  "qwen3-coder-plus":               { caps: ["code"], category: "Coding", desc: "Specialized code generation" },
  "claude-sonnet-4-6":              { caps: ["general", "code"], category: "General", desc: "Balanced performance" },
  "claude-opus-4-6":                { caps: ["general", "reasoning"], category: "General", desc: "Most capable Claude" },
  "gpt-5-mini-free":                { caps: ["general"], category: "General", desc: "Fast & free GPT" },
}

function readHistory(): Record<string, any[]> {
  try { return JSON.parse(readFileSync(HISTORY_PATH, "utf-8")) } catch { return {} }
}

export async function GET(req: NextRequest) {
  const profile = (req.nextUrl.searchParams.get("profile") || "coding") as Profile
  const config = readConfig(profile)
  const history = readHistory()
  const providers = config.custom_providers || []
  const defaultModel = config.model?.default || ""

  const models = providers.map((p: any) => {
    const modelId = p.model || p.name
    const shortId = modelId.split("/").pop() || modelId
    const caps = MODEL_CAPABILITIES[shortId] || { caps: ["general"], category: "General", desc: p.name }
    const hist = history[modelId] || []
    const lastCheck = hist[hist.length - 1]
    return {
      id: modelId,
      name: p.name,
      provider: p.name,
      baseUrl: p.base_url,
      hasKey: !!p.api_key,
      isPrimary: modelId === defaultModel || p.name === defaultModel,
      category: caps.category,
      caps: caps.caps,
      desc: caps.desc,
      status: lastCheck?.ok ? "online" : "unknown",
      latency: lastCheck?.latency || null,
      lastChecked: lastCheck?.time || null,
      history: hist.slice(-10),
    }
  })

  return NextResponse.json({ models, profile, defaultModel })
}

