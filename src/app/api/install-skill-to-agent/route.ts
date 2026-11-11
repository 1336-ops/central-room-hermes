import { NextRequest, NextResponse } from "next/server"
import { execSync } from "child_process"

export async function POST(req: NextRequest) {
  try {
    const { skill, profile = "coding" } = await req.json()
    if (!skill?.trim()) return NextResponse.json({ ok: false, error: "Skill required" }, { status: 400 })
    let output = ""
    try {
      output = execSync(`hermes --profile ${profile} skills install ${skill.trim()} 2>&1`, {
        timeout: 60000,
        env: { ...process.env, PATH: `/home/ubuntu/.local/bin:/usr/local/bin:/usr/bin:/bin:${process.env.PATH}` },
      }).toString().trim()
    } catch (e: any) { output = e.stdout?.toString() || e.message }
    return NextResponse.json({ ok: true, skill, profile, output })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message })
  }
}

