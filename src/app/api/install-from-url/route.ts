import { NextRequest, NextResponse } from "next/server"
import { execSync } from "child_process"

export async function POST(req: NextRequest) {
  try {
    const { url, profile = "coding" } = await req.json()
    if (!url?.trim()) return NextResponse.json({ ok: false, error: "URL required" }, { status: 400 })
    let output = ""
    try {
      output = execSync(`hermes --profile ${profile} skills install ${url.trim()} 2>&1`, {
        timeout: 120000,
        env: { ...process.env, PATH: `/home/ubuntu/.local/bin:/usr/local/bin:/usr/bin:/bin:${process.env.PATH}` },
      }).toString().trim()
    } catch (e: any) { output = e.stdout?.toString() || e.message }
    return NextResponse.json({ ok: true, url, output })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message })
  }
}

