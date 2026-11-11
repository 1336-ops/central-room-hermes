import { NextRequest, NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import { Profile, getProfileDir, safeExec } from "@/lib/hermes"

export async function GET(req: NextRequest) {
  const profile = (req.nextUrl.searchParams.get("profile") || "coding") as Profile
  const cronDir = path.join(getProfileDir(profile), "cron")
  const jobs: any[] = []

  try {
    if (fs.existsSync(cronDir)) {
      const entries = fs.readdirSync(cronDir, { withFileTypes: true })
      for (const entry of entries) {
        if (!entry.isDirectory()) continue
        const jobPath = path.join(cronDir, entry.name)
        try {
          const metaPath = path.join(jobPath, "job.json")
          if (fs.existsSync(metaPath)) {
            const meta = JSON.parse(fs.readFileSync(metaPath, "utf-8"))
            jobs.push({ id: entry.name, ...meta })
          } else {
            jobs.push({ id: entry.name, name: entry.name, status: "unknown" })
          }
        } catch {}
      }
    }
  } catch {}

  // Also try hermes cron list
  const raw = safeExec(`hermes --profile ${profile} cron list --json 2>/dev/null || echo "[]"`)
  let cliJobs: any[] = []
  try { cliJobs = JSON.parse(raw) } catch {}

  return NextResponse.json({ jobs, cliJobs, profile })
}

