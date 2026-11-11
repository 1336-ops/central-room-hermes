import { NextResponse } from "next/server"
import { execSync } from "child_process"

const ACTIONS: Record<string, { cmd: string; label: string; dangerous?: boolean }> = {
  "restart-gateway":    { cmd: "hermes gateway restart 2>&1 || echo 'restart attempted'", label: "Restart Gateway" },
  "restart-dashboard":  { cmd: "cd /home/ubuntu/hermes-dashboard && pm2 restart hermes-dashboard 2>&1 || echo 'not in pm2'", label: "Restart Dashboard" },
  "gateway-status":     { cmd: "hermes gateway status 2>&1", label: "Gateway Status" },
  "system-info":        { cmd: "echo '=== Memory ==='; free -h; echo '=== Disk ==='; df -h /; echo '=== Uptime ==='; uptime", label: "System Info" },
  "hermes-version":     { cmd: "hermes --version 2>&1", label: "Hermes Version" },
  "nginx-reload":       { cmd: "sudo nginx -t 2>&1 && sudo systemctl reload nginx 2>&1 && echo 'Nginx reloaded' || echo 'failed'", label: "Reload Nginx" },
  "clear-logs":         { cmd: "find /home/ubuntu/.hermes/profiles/*/logs -name '*.log' -exec truncate -s 0 {} \; 2>/dev/null; echo 'Logs cleared'", label: "Clear Logs", dangerous: true },
}

export async function POST(req: Request) {
  try {
    const { action } = await req.json()
    const def = ACTIONS[action]
    if (!def) return NextResponse.json({ error: "Unknown action" }, { status: 400 })
    let output = ""
    try {
      output = execSync(def.cmd, {
        timeout: 30000,
        env: { ...process.env, PATH: `/home/ubuntu/.local/bin:/usr/local/bin:/usr/bin:/bin:${process.env.PATH}` },
      }).toString().trim()
    } catch (e: any) { output = e.stdout?.toString() || e.message }
    return NextResponse.json({ ok: true, action, label: def.label, output })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ actions: Object.entries(ACTIONS).map(([id, v]) => ({ id, label: v.label, dangerous: v.dangerous || false })) })
}

