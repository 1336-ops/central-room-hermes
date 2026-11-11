import { NextRequest, NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import { Profile, getProfileDir } from "@/lib/hermes"

export async function GET(req: NextRequest) {
  const profile = (req.nextUrl.searchParams.get("profile") || "coding") as Profile
  const sessionsDir = path.join(getProfileDir(profile), "sessions")
  const sessions: any[] = []

  try {
    if (fs.existsSync(sessionsDir)) {
      const files = fs.readdirSync(sessionsDir)
        .filter(f => f.endsWith(".jsonl") && !f.includes("checkpoint"))
        .sort((a, b) => {
          const sa = fs.statSync(path.join(sessionsDir, a)).mtime.getTime()
          const sb = fs.statSync(path.join(sessionsDir, b)).mtime.getTime()
          return sb - sa
        })
        .slice(0, 50)

      for (const file of files) {
        const filePath = path.join(sessionsDir, file)
        try {
          const stat = fs.statSync(filePath)
          const content = fs.readFileSync(filePath, "utf-8")
          const lines = content.split("\n").filter(Boolean)
          let model = "unknown"
          let messageCount = 0
          let tokens = 0
          let title = file.replace(".jsonl", "").slice(0, 16)

          for (const line of lines) {
            try {
              const msg = JSON.parse(line)
              if (msg.type === "message" && msg.message?.role === "assistant") {
                messageCount++
                model = msg.message.model || model
                const u = msg.message.usage || {}
                tokens += u.totalTokens || (u.input || 0) + (u.output || 0)
              }
              if (msg.type === "title" && msg.title) title = msg.title
            } catch {}
          }

          sessions.push({
            id: file.replace(".jsonl", ""),
            name: title,
            model,
            status: "ended",
            messages: messageCount,
            tokens,
            started: stat.birthtime.toLocaleString("id-ID"),
            lastActive: stat.mtime.toLocaleString("id-ID"),
            path: filePath,
          })
        } catch {}
      }
    }
  } catch {}

  return NextResponse.json({ sessions, profile })
}

export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const sessionPath = url.searchParams.get("path")
    const profile = (url.searchParams.get("profile") || "coding") as Profile
    const profileDir = getProfileDir(profile)

    if (sessionPath) {
      const resolved = path.resolve(sessionPath)
      if (!resolved.startsWith("/home/ubuntu/.hermes/")) {
        return NextResponse.json({ error: "Invalid path" }, { status: 400 })
      }
      if (fs.existsSync(resolved)) fs.unlinkSync(resolved)
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: "No path provided" }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

