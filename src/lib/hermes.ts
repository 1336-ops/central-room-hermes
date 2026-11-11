import { readFileSync, existsSync } from "fs"
import path from "path"
import { execSync } from "child_process"
import yaml from "js-yaml"

export const PROFILES = ["coding", "law", "research", "social"] as const
export type Profile = typeof PROFILES[number]

export const HERMES_HOME = "/home/ubuntu/.hermes"
export const PROFILES_DIR = `${HERMES_HOME}/profiles`

export function getProfileDir(profile: Profile) {
  return path.join(PROFILES_DIR, profile)
}

export function readConfig(profile: Profile): any {
  const p = path.join(getProfileDir(profile), "config.yaml")
  try {
    return yaml.load(readFileSync(p, "utf-8")) as any
  } catch {
    return {}
  }
}

export function getGatewayState(profile: Profile): any {
  const p = path.join(getProfileDir(profile), "gateway_state.json")
  try {
    return JSON.parse(readFileSync(p, "utf-8"))
  } catch {
    return {}
  }
}

export function getGatewayPort(profile: Profile): number {
  // Hermes gateway exposes OpenAI-compatible API — find port from pid via ss
  const state = getGatewayState(profile)
  if (!state.pid) return 0
  try {
    const out = execSync(`ss -tlnp | grep pid=${state.pid}`, { timeout: 5000 }).toString()
    const match = out.match(/:(\d+)/)
    if (match) return parseInt(match[1])
  } catch {}
  return 0
}

export function getGatewayToken(profile: Profile): string {
  try {
    const authPath = path.join(getProfileDir(profile), "auth.json")
    const auth = JSON.parse(readFileSync(authPath, "utf-8"))
    // Try to get token from credential pool
    const pool = auth.credential_pool || {}
    for (const creds of Object.values(pool) as any[][]) {
      if (Array.isArray(creds) && creds[0]?.access_token) {
        return creds[0].access_token
      }
    }
  } catch {}
  return ""
}


export const LEGACY_SESSIONS_DIRS = [
  "/home/ubuntu/.openclaw/agents/main/sessions",
  "/home/ubuntu/.openclaw/completions",
  "/home/ubuntu/.openclaw/sessions",
]

export function getSessionsDirs(profile: Profile): string[] {
  const primary = path.join(getProfileDir(profile), "sessions")
  // Include legacy OpenClaw sessions for historical data
  const legacy = LEGACY_SESSIONS_DIRS.filter(d => existsSync(d))
  return [primary, ...legacy]
}

export function safeExec(cmd: string): string {
  try {
    return execSync(cmd, { timeout: 10000, stdio: ["pipe", "pipe", "pipe"] }).toString().trim()
  } catch {
    return ""
  }
}

export function getTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  return `${days}d`
}