import { NextRequest, NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import { Profile, getProfileDir } from "@/lib/hermes"

export async function GET(req: NextRequest) {
  const skillName = req.nextUrl.searchParams.get("name") || ""
  const profile = (req.nextUrl.searchParams.get("profile") || "coding") as Profile
  if (!skillName) return NextResponse.json({ error: "name required" }, { status: 400 })

  const skillsDir = path.join(getProfileDir(profile), "skills")
  const candidates = [
    path.join(skillsDir, skillName, "SKILL.md"),
    path.join(skillsDir, `${skillName}.md`),
    path.join("/home/ubuntu/.hermes/skills", skillName, "SKILL.md"),
    path.join("/home/ubuntu/.hermes/skills", `${skillName}.md`),
  ]

  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) {
        const content = fs.readFileSync(p, "utf-8")
        return NextResponse.json({ content, path: p })
      }
    } catch {}
  }

  return NextResponse.json({ error: "Skill not found" }, { status: 404 })
}

