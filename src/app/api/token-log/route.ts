import { NextRequest, NextResponse } from "next/server"
import { readFileSync, readdirSync, existsSync } from "fs"
import path from "path"
import { Profile, getSessionsDirs } from "@/lib/hermes"

const COST_PER_1M: Record<string, number> = {
  "deepseek-r1": 0.27, "deepseek-v3-671b": 0.27,
  "qwen3-coder-plus": 0.17, "qwen3-max": 0.34, "qwen3-235b-a22b-thinking": 0.34,
  "claude-sonnet-4-6": 3.00, "claude-opus-4-6": 15.00,
  "gpt-5-mini-free": 0, "kimi-k2-0905": 0.27,
}
const DEFAULT_COST = 0.20
const USD_TO_IDR = 16250

export async function GET(req: NextRequest) {
  const profile = (req.nextUrl.searchParams.get("profile") || "coding") as Profile
  const entries: any[] = []

  try {
    const sessionsDirs = getSessionsDirs(profile)
    const allFiles: { file: string; dir: string }[] = []
    for (const dir of sessionsDirs) {
      if (!existsSync(dir)) continue
      const files = readdirSync(dir)
        .filter(f => f.endsWith(".jsonl") && !f.includes("checkpoint"))
        .sort()
      allFiles.push(...files.map(f => ({ file: f, dir })))
    }

    for (const { file, dir } of allFiles.slice(-200)) {
      try {
        const content = readFileSync(path.join(dir, file), "utf-8")
        for (const line of content.split("\n").filter(Boolean)) {
          try {
            const msg = JSON.parse(line)
            if (msg.type !== "message" || msg.message?.role !== "assistant") continue
            const m = msg.message
            const shortModel = (m.model || "unknown").split("/").pop() || m.model
            const u = m.usage || {}
            const tokens = u.totalTokens || (u.input || 0) + (u.output || 0)
            if (!tokens) continue
            const costPer1M = COST_PER_1M[shortModel] ?? DEFAULT_COST
            const costUsd = (tokens / 1_000_000) * costPer1M
            entries.push({
              time: m.timestamp || msg.timestamp,
              model: shortModel,
              tokens,
              costUsd,
              costIdr: costUsd * USD_TO_IDR,
              session: file.replace(".jsonl", "").slice(0, 8),
            })
          } catch {}
        }
      } catch {}
    }
  } catch {}

  const totalCostUsd = entries.reduce((s, e) => s + e.costUsd, 0)
  return NextResponse.json({
    entries: entries.slice(-200).reverse(),
    totalCostUsd,
    totalCostIdr: totalCostUsd * USD_TO_IDR,
    profile,
  })
}