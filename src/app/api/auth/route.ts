import { NextResponse } from "next/server"

const AUTH_PASSWORD = process.env.DASHBOARD_PASSWORD || "12345678"
const AUTH_COOKIE = "hermes-auth"
const SALT = "hermes-salt-2026"

const loginAttempts = new Map<string, { count: number; lastAttempt: number }>()
const MAX_ATTEMPTS = 5
const LOCKOUT_MS = 15 * 60 * 1000

function getClientIP(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for")
  return forwarded?.split(",")[0]?.trim() || "unknown"
}

function checkRateLimit(ip: string): boolean {
  const attempt = loginAttempts.get(ip)
  if (!attempt) return true
  if (Date.now() - attempt.lastAttempt > LOCKOUT_MS) {
    loginAttempts.delete(ip)
    return true
  }
  return attempt.count < MAX_ATTEMPTS
}

// Same hash as middleware — btoa based
function hashPassword(password: string): string {
  return Buffer.from(password + SALT).toString("base64")
}

export async function POST(req: Request) {
  try {
    const ip = getClientIP(req)
    if (!checkRateLimit(ip)) {
      return NextResponse.json({ error: "Terlalu banyak percobaan. Coba lagi dalam 15 menit." }, { status: 429 })
    }

    const { password } = await req.json()

    if (password === AUTH_PASSWORD) {
      loginAttempts.delete(ip)
      const response = NextResponse.json({ ok: true })
      response.cookies.set(AUTH_COOKIE, hashPassword(AUTH_PASSWORD), {
        httpOnly: true,
        sameSite: "lax",
        secure: true,
        maxAge: 60 * 60 * 24 * 7,
        path: "/dashboard",
      })
      return response
    }

    const attempt = loginAttempts.get(ip) || { count: 0, lastAttempt: 0 }
    attempt.count++
    attempt.lastAttempt = Date.now()
    loginAttempts.set(ip, attempt)
    const remaining = MAX_ATTEMPTS - attempt.count
    const errorMsg = remaining > 0
      ? `Password salah. ${remaining} percobaan tersisa.`
      : "Akun terkunci 15 menit."
    return NextResponse.json({ error: errorMsg }, { status: 401 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true })
  response.cookies.delete({ name: AUTH_COOKIE, path: "/dashboard" })
  return response
}

