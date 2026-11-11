import { NextRequest, NextResponse } from "next/server"
import { execSync } from "child_process"
import fs from "fs"
import path from "path"
import { Profile, getProfileDir } from "@/lib/hermes"

export async function GET(req: NextRequest) {
  const profile = (req.nextUrl.searchParams.get("profile") || "coding") as Profile
  // Try hermes skills hub list
  let skills: string[] = []
  try {
    const raw = execSync(`hermes --profile ${profile} skills list 2>/dev/null || echo ""`, { timeout: 15000 }).toString().trim()
    skills = raw.split("\n").map(l => l.trim()).filter(Boolean)
  } catch {}

  // Also list from global skills dir
  const globalDir = "/home/ubuntu/.hermes/skills"
  try {
    if (fs.existsSync(globalDir)) {
      const entries = fs.readdirSync(globalDir)
      skills.push(...entries.filter(e => !skills.includes(e)))
    }
  } catch {}

  return NextResponse.json({ skills: skills.length ? skills : ["self-improving"] })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { skill, profile = "coding" } = body
    if (!skill?.trim()) return NextResponse.json({ ok: false, error: "Skill name required" }, { status: 400 })
    let output = ""
    try {
      output = execSync(`hermes --profile ${profile} skills install ${skill.trim()} 2>&1`, { timeout: 60000 }).toString().trim()
    } catch (e: any) { output = e.message }
    return NextResponse.json({ ok: true, skill: skill.trim(), output })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message })
  }
}

