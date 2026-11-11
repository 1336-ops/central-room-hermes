import { NextResponse } from "next/server"
import { exec } from "child_process"
import { promisify } from "util"
import fs from "fs"
import path from "path"

const execAsync = promisify(exec)

async function run(cmd: string): Promise<string> {
  try {
    const { stdout } = await execAsync(cmd, { timeout: 8000 })
    return stdout.trim()
  } catch (e: any) {
    return e.stdout?.trim() || ""
  }
}

export async function GET() {
  const hermesBase = "/home/ubuntu/.hermes"

  // Profiles
  const profiles = ["coding", "law", "research", "social"]
  const profilesStatus = await Promise.all(
    profiles.map(async (p) => {
      const pidFile = `${hermesBase}/profiles/${p}/.pid`
      let state = "stopped"
      let pid: number | undefined
      try {
        if (fs.existsSync(pidFile)) {
          pid = parseInt(fs.readFileSync(pidFile, "utf8").trim())
          const check = await run(`kill -0 ${pid} 2>&1`)
          state = check === "" ? "running" : "stopped"
        }
      } catch {}
      return { profile: p, pid, state }
    })
  )

  // Gateway
  const gatewayPid = await run("pgrep -f 'hermes.*gateway' | head -1")
  const gatewayState = gatewayPid ? "running" : "stopped"

  // Memory files
  const memoryDir = `${hermesBase}/memory`
  let memoryFiles: { name: string; size: number; modified: string }[] = []
  try {
    const files = fs.readdirSync(memoryDir).filter(f => f.endsWith(".md"))
    memoryFiles = files.map(f => {
      const stat = fs.statSync(path.join(memoryDir, f))
      return {
        name: f,
        size: stat.size,
        modified: stat.mtime.toISOString(),
      }
    }).sort((a, b) => b.modified.localeCompare(a.modified)).slice(0, 10)
  } catch {}

  // Cron jobs
  const cronRaw = await run("crontab -l 2>/dev/null")
  const cronJobs = cronRaw
    .split("\n")
    .filter(l => l.trim() && !l.startsWith("#"))
    .map(l => {
      const parts = l.trim().split(/\s+/)
      const schedule = parts.slice(0, 5).join(" ")
      const command = parts.slice(5).join(" ").substring(0, 80)
      return { schedule, command }
    })

  // Skills count per profile
  const skillsCount: Record<string, number> = {}
  for (const p of profiles) {
    try {
      const skillsDir = `${hermesBase}/profiles/${p}/skills`
      if (fs.existsSync(skillsDir)) {
        skillsCount[p] = fs.readdirSync(skillsDir).filter(f => f.endsWith(".md")).length
      } else {
        skillsCount[p] = 0
      }
    } catch {
      skillsCount[p] = 0
    }
  }

  // Sessions count
  let totalSessions = 0
  try {
    const sessDir = `${hermesBase}/sessions`
    if (fs.existsSync(sessDir)) {
      totalSessions = fs.readdirSync(sessDir).length
    }
  } catch {}

  // Hermes version
  const version = await run("cat /home/ubuntu/.hermes/VERSION 2>/dev/null || echo 'unknown'")

  // System uptime
  const uptime = await run("uptime -p")

  // Disk usage for hermes dir
  const diskUsage = await run("du -sh /home/ubuntu/.hermes 2>/dev/null | cut -f1")

  // Recent diary entries
  const diaryDir = `${hermesBase}/memory`
  let recentDiaries: string[] = []
  try {
    recentDiaries = fs.readdirSync(diaryDir)
      .filter(f => /^\d{4}-\d{2}-\d{2}\.md$/.test(f))
      .sort()
      .reverse()
      .slice(0, 5)
  } catch {}

  // Active services
  const services = ["9router.service", "central-room.service", "hermes-coding.service", "hermes-law.service"]
  const servicesStatus = await Promise.all(
    services.map(async (svc) => {
      const out = await run(`systemctl is-active ${svc} 2>/dev/null`)
      return { name: svc.replace(".service", ""), active: out === "active" }
    })
  )

  return NextResponse.json({
    profiles: profilesStatus,
    gateway: { state: gatewayState, pid: gatewayPid ? parseInt(gatewayPid) : undefined },
    memory: memoryFiles,
    cron: cronJobs,
    skills: skillsCount,
    totalSessions,
    version: version || "unknown",
    uptime,
    diskUsage,
    recentDiaries,
    services: servicesStatus,
  })
}
