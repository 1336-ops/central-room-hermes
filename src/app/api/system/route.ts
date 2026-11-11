import { NextResponse } from "next/server"
import { safeExec, PROFILES, getGatewayState } from "@/lib/hermes"

export async function GET() {
  const uptime = safeExec("uptime -p").replace("up ", "")
  const memRaw = safeExec("free -m | awk \'NR==2{print $2,$3,$4}\'")
  const [memTotal, memUsed, memFree] = memRaw.split(" ").map(Number)
  const diskRaw = safeExec("df -h / | awk \'NR==2{print $2,$3,$4,$5}\'")
  const [diskTotal, diskUsed, diskFree, diskPct] = diskRaw.split(" ")
  const loadRaw = safeExec("cat /proc/loadavg")
  const [load1, load5, load15] = loadRaw.split(" ")

  const gateways = PROFILES.map(p => {
    const s = getGatewayState(p)
    return { profile: p, pid: s.pid, state: (s as any).gateway_state || "stopped", platforms: (s as any).platforms || {} }
  })

  return NextResponse.json({
    uptime,
    memory: { total: memTotal, used: memUsed, free: memFree },
    disk: { total: diskTotal, used: diskUsed, free: diskFree, pct: diskPct },
    load: { "1m": load1, "5m": load5, "15m": load15 },
    gateways,
  })
}

