import { NextRequest, NextResponse } from "next/server"
import { Profile, readConfig, PROFILES } from "@/lib/hermes"

export async function GET(req: NextRequest) {
  const profile = (req.nextUrl.searchParams.get("profile") || "coding") as Profile
  const config = readConfig(profile)

  const providers = (config.custom_providers || []).map((p: any) => ({
    name: p.name,
    baseUrl: p.base_url || "",
    model: p.model || "",
    hasKey: !!p.api_key,
  }))

  const defaultModel = config.model?.default || "unknown"
  const fallbackProviders = config.fallback_providers || []

  return NextResponse.json({ providers, defaultModel, fallbackProviders, profile })
}

