import { NextResponse } from "next/server"
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs"
import { execSync } from "child_process"
import path from "path"
import yaml from "js-yaml"
import { Profile, PROFILES, getProfileDir, readConfig } from "@/lib/hermes"

const SETTINGS_PATH = "/home/ubuntu/hermes-dashboard/data/settings.json"

const DEFAULTS = { autoRefresh: true, autoRefreshInterval: 30, activeProfile: "coding" }

function readSettings() {
  try { return { ...DEFAULTS, ...JSON.parse(readFileSync(SETTINGS_PATH, "utf-8")) } }
  catch { return { ...DEFAULTS } }
}

function writeSettings(s: any) {
  const dir = path.dirname(SETTINGS_PATH)
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  writeFileSync(SETTINGS_PATH, JSON.stringify(s, null, 2), "utf-8")
}

export async function GET() {
  try {
    const settings = readSettings()
    const profile = (settings.activeProfile || "coding") as Profile
    const config = readConfig(profile)

    const providers = (config.custom_providers || []).map((p: any) => ({
      id: p.name,
      baseUrl: p.base_url || "",
      apiKey: p.api_key ? `${p.api_key.slice(0, 6)}...${p.api_key.slice(-4)}` : "",
      model: p.model || "",
    }))

    const allProfiles = PROFILES.map(p => {
      const cfg = readConfig(p)
      return { profile: p, defaultModel: cfg.model?.default || "unknown" }
    })

    return NextResponse.json({
      settings,
      providers,
      allProfiles,
      activeProfile: profile,
      defaultModel: config.model?.default || "unknown",
      dashboardInfo: {
        version: "0.2.0",
        framework: "Next.js 16",
        runtime: "Node.js",
        port: "3001",
        mode: process.env.NODE_ENV || "production",
        theme: "Hermes Dark",
      },
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const settings = readSettings()

    if (body.autoRefresh !== undefined) settings.autoRefresh = body.autoRefresh
    if (body.autoRefreshInterval !== undefined) settings.autoRefreshInterval = body.autoRefreshInterval
    if (body.activeProfile !== undefined) settings.activeProfile = body.activeProfile

    if (body.action === "update-api-key" && body.providerId && body.apiKey) {
      const profile = (settings.activeProfile || "coding") as Profile
      const cfgPath = path.join(getProfileDir(profile), "config.yaml")
      const config = readConfig(profile) as any
      const providers = config.custom_providers || []
      const idx = providers.findIndex((p: any) => p.name === body.providerId)
      if (idx >= 0) {
        providers[idx].api_key = body.apiKey
        config.custom_providers = providers
        writeFileSync(cfgPath, yaml.dump(config), "utf-8")
        writeSettings(settings)
        return NextResponse.json({ ok: true, message: "API key updated" })
      }
      return NextResponse.json({ error: "Provider not found" }, { status: 404 })
    }

    writeSettings(settings)
    return NextResponse.json({ ok: true, settings })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

