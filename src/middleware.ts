import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const AUTH_PASSWORD = process.env.DASHBOARD_PASSWORD || "12345678"
const AUTH_COOKIE = "hermes-auth"
const SALT = "hermes-salt-2026"

function simpleHash(password: string): string {
  return btoa(password + SALT)
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow login page, auth API, stats, and static assets
  if (
    pathname === "/login" ||
    pathname === "/stats" ||
    pathname.startsWith("/stats") ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next()
  }

  // Check auth cookie
  const authCookie = request.cookies.get(AUTH_COOKIE)?.value
  const expectedHash = simpleHash(AUTH_PASSWORD)

  if (!authCookie || authCookie !== expectedHash) {
    // Redirect to /dashboard/login (with basePath)
    const loginUrl = new URL("/dashboard/login", request.url)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}

