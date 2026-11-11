import { NextResponse } from "next/server"
import { readFileSync, existsSync } from "fs"
import path from "path"
import { Profile, getProfileDir, getGatewayState, safeExec } from "@/lib/hermes"
import { execSync } from "child_process"

function getGatewayEndpoint(profile: Profile): { url: string; token: string } {
  const state = getGatewayState(profile)
  let port = 0
  if (state.pid) {
    try {
      const out = execSync(`ss -tlnp | grep pid=${state.pid}`, { timeout: 5000 }).toString()
      const match = out.match(/:(\d+)/)
      if (match) port = parseInt(match[1])
    } catch {}
  }

  // Fallback: read from config
  if (!port) {
    try {
      const yaml = require("js-yaml")
      const cfg = yaml.load(readFileSync(path.join(getProfileDir(profile), "config.yaml"), "utf-8")) as any
      port = cfg?.gateway?.port || 18789
    } catch {}
  }

  // Get token from auth.json
  let token = ""
  try {
    const auth = JSON.parse(readFileSync(path.join(getProfileDir(profile), "auth.json"), "utf-8"))
    const pool = auth.credential_pool || {}
    for (const creds of Object.values(pool) as any[][]) {
      if (Array.isArray(creds) && creds[0]?.access_token) {
        token = creds[0].access_token
        break
      }
    }
  } catch {}

  return { url: `http://127.0.0.1:${port}/v1/chat/completions`, token }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const profile = (body.profile || "coding") as Profile
    const { url, token } = getGatewayEndpoint(profile)

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    }

    if (body.backendModel) {
      headers["x-hermes-model"] = body.backendModel
    }

    const sessionKey = body.sessionKey || `webchat-${Date.now()}`
    const payload = {
      model: body.backendModel || "hermes/default",
      messages: body.messages,
      stream: body.stream || false,
      user: sessionKey,
      max_tokens: body.maxTokens || 2048,
      temperature: body.temperature ?? 0.7,
    }

    if (body.stream) {
      const response = await fetch(url, { method: "POST", headers, body: JSON.stringify(payload) })
      if (!response.ok) {
        const errText = await response.text().catch(() => "Unknown error")
        return NextResponse.json({ error: errText }, { status: response.status })
      }
      return new Response(response.body, {
        headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
      })
    } else {
      const response = await fetch(url, { method: "POST", headers, body: JSON.stringify(payload) })
      const data = await response.json()
      if (!response.ok) {
        return NextResponse.json({ error: data.error?.message || "Gateway error" }, { status: response.status })
      }
      return NextResponse.json(data)
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Internal server error" }, { status: 500 })
  }
}

