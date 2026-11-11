import { NextRequest, NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import { Profile, PROFILES, getProfileDir } from "@/lib/hermes"

export async function GET(req: NextRequest) {
  const profile = (req.nextUrl.searchParams.get("profile") || "coding") as Profile
  const skillsDir = path.join(getProfileDir(profile), "skills")
  const skills: any[] = []

  try {
    if (fs.existsSync(skillsDir)) {
      const entries = fs.readdirSync(skillsDir, { withFileTypes: true })
      for (const entry of entries) {
        const skillPath = path.join(skillsDir, entry.name)
        let description = ""
        let content = ""
        try {
          const mdPath = entry.isDirectory() ? path.join(skillPath, "SKILL.md") : skillPath
          content = fs.readFileSync(mdPath, "utf-8")
          const m = content.match(/description[:\s]+(.+)/i) || content.match(/\n(.{20,120})\n/)
          if (m) description = m[1].trim()
        } catch {}
        skills.push({
          name: entry.name.replace(".md", ""),
          description,
          status: "active",
          profile,
          path: skillPath,
        })
      }
    }
  } catch {}

  return NextResponse.json({ skills, profile })
}

