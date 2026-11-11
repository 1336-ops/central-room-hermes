import { NextResponse } from "next/server"
import { NextRequest } from "next/server"
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
        if (!entry.isDirectory() && !entry.name.endsWith(".md")) continue
        const skillPath = path.join(skillsDir, entry.name)
        let name = entry.name.replace(".md", "")
        let description = ""
        let status = "active"

        try {
          const content = entry.isDirectory()
            ? fs.readFileSync(path.join(skillPath, "SKILL.md"), "utf-8")
            : fs.readFileSync(skillPath, "utf-8")
          const descMatch = content.match(/description[:\s]+(.+)/i) || content.match(/\n(.{20,120})\n/)
          if (descMatch) description = descMatch[1].trim()
        } catch {}

        skills.push({ name, description, status, path: skillPath })
      }
    }
  } catch {}

  // Also check global skills dir
  const globalSkillsDir = "/home/ubuntu/.hermes/skills"
  const globalSkills: any[] = []
  try {
    if (fs.existsSync(globalSkillsDir)) {
      const entries = fs.readdirSync(globalSkillsDir, { withFileTypes: true })
      for (const entry of entries) {
        if (!entry.isDirectory() && !entry.name.endsWith(".md")) continue
        globalSkills.push({ name: entry.name.replace(".md", ""), description: "", status: "global" })
      }
    }
  } catch {}

  return NextResponse.json({ skills, globalSkills, profile, skillsDir })
}

