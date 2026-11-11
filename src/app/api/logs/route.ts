import { NextRequest, NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import { Profile, getProfileDir } from "@/lib/hermes"

export async function GET(req: NextRequest) {
  const profile = (req.nextUrl.searchParams.get("profile") || "coding") as Profile
  const logsDir = path.join(getProfileDir(profile), "logs")
  const lines: string[] = []

  try {
    if (fs.existsSync(logsDir)) {
      const files = fs.readdirSync(logsDir)
        .filter(f => f.endsWith(".log"))
        .sort()
        .slice(-3)

      for (const file of files) {
        try {
          const content = fs.readFileSync(path.join(logsDir, file), "utf-8")
          lines.push(...content.split("\n").filter(Boolean).slice(-200))
        } catch {}
      }
    }
  } catch {}

  return NextResponse.json({ logs: lines.slice(-500), profile })
}

