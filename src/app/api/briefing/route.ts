import { NextRequest, NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import { Profile, PROFILES, getProfileDir, getGatewayState } from "@/lib/hermes"

export async function GET(req: NextRequest) {
  const profile = (req.nextUrl.searchParams.get("profile") || "coding") as Profile
  const now = new Date()
  const dateStr = now.toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" })
  const timeStr = now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })

  const highlights: { type: "info" | "warning" | "success"; text: string }[] = []
  const agents: { name: string; status: string; lastActive: string }[] = []

  // Check all profiles gateway status
  for (const p of PROFILES) {
    const s = getGatewayState(p)
    const state = (s as any).gateway_state || "stopped"
    highlights.push({
      type: state === "running" ? "success" : "warning",
      text: `Profile ${p}: gateway ${state}`,
    })
  }

  // Check skills
  const skillsDir = path.join(getProfileDir(profile), "skills")
  try {
    if (fs.existsSync(skillsDir)) {
      const count = fs.readdirSync(skillsDir).length
      highlights.push({ type: "info", text: `${count} skills loaded for profile ${profile}` })
    }
  } catch {}

  // Check sessions count
  const sessionsDir = path.join(getProfileDir(profile), "sessions")
  try {
    if (fs.existsSync(sessionsDir)) {
      const count = fs.readdirSync(sessionsDir).filter(f => f.endsWith(".jsonl")).length
      highlights.push({ type: "info", text: `${count} sessions in profile ${profile}` })
    }
  } catch {}

  const summary = `Hermes berjalan normal. ${PROFILES.length} profiles aktif.`

  return NextResponse.json({ date: dateStr, time: timeStr, summary, highlights, agents, profile })
}

