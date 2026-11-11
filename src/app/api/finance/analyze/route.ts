import { NextRequest, NextResponse } from "next/server";
import { writeFileSync, unlinkSync } from "fs";
import { execSync, ExecSyncOptions } from "child_process";
import { tmpdir } from "os";
import { join } from "path";

export async function GET(req: NextRequest) {
  const ticker = req.nextUrl.searchParams.get("ticker") || "BBCA.JK";
  const venvPython = "/home/ubuntu/.venv/trading/bin/python3";
  const scriptPath = join(tmpdir(), `stock_${Date.now()}.py`);

  const script = `
import warnings
warnings.filterwarnings("ignore")
import yfinance as yf
import json

ticker_symbol = "${ticker}"
try:
    stock = yf.Ticker(ticker_symbol)
    info = stock.info
    result = {
        "ticker": ticker_symbol,
        "name": info.get("longName") or info.get("shortName") or "N/A",
        "price": info.get("currentPrice") or info.get("regularMarketPrice") or "N/A",
        "change_pct": round(info.get("regularMarketChangePercent", 0), 2),
        "volume": info.get("averageVolume") or 0,
        "market_cap": info.get("marketCap") or 0,
        "pe_ratio": info.get("trailingPE") or "N/A",
        "dividend_yield": round(info.get("dividendYield", 0) * 100, 2) if info.get("dividendYield") else 0,
        "week52_high": info.get("fiftyTwoWeekHigh") or "N/A",
        "week52_low": info.get("fiftyTwoWeekLow") or "N/A",
        "analyst_target": info.get("targetMeanPrice") or "N/A",
        "recommendation": info.get("recommendationKey") or "N/A",
        "sector": info.get("sector") or "N/A",
        "industry": info.get("industry") or "N/A",
        "description": (info.get("longBusinessSummary") or "N/A")[:300],
    }
    print(json.dumps(result))
except Exception as e:
    print(json.dumps({"error": str(e)}))
`;

  try {
    writeFileSync(scriptPath, script);
    
    const opts: ExecSyncOptions = {
      timeout: 20000,
      stdio: ["pipe", "pipe", "pipe"],
      env: { ...process.env, PYTHONUNBUFFERED: "1" },
    };

    let output = "";
    try {
      output = execSync(`${venvPython} ${scriptPath}`, opts).toString();
    } catch (e: any) {
      // Check if it's a timeout
      const msg = e.message?.toString() || "";
      if (msg.includes("timeout") || msg.includes("Timed out")) {
        try { unlinkSync(scriptPath); } catch {}
        return NextResponse.json({
          error: `Timeout. Yahoo Finance rate-limited dari server ini.`,
          suggestion: "Coba lagi nanti, atau gunakan chat agent untuk analisis saham."
        });
      }
      // Try to get stderr
      try { unlinkSync(scriptPath); } catch {}
      return NextResponse.json({
        error: `Gagal fetch ${ticker}. Yahoo Finance memblokir request dari server ini.`,
        suggestion: "Gunakan chat agent untuk analisis real-time."
      });
    }

    try { unlinkSync(scriptPath); } catch {}

    let data: any;
    try {
      data = JSON.parse(output.trim());
    } catch {
      return NextResponse.json({ error: "Failed to parse response", raw: output.slice(0, 100) });
    }

    if (data.error) {
      if (data.error.includes("YFRateLimitError") || data.error.includes("Too Many Requests")) {
        return NextResponse.json({
          error: `Rate limited oleh Yahoo Finance. Server ini diblokir.`,
          suggestion: "Gunakan chat agent untuk analisis real-time."
        });
      }
      return NextResponse.json({ error: data.error });
    }

    // Format numbers
    if (data.market_cap) {
      const cap = data.market_cap;
      if (cap >= 1e12) data.market_cap_fmt = `Rp ${(cap / 1e12).toFixed(1)}T`;
      else if (cap >= 1e9) data.market_cap_fmt = `Rp ${(cap / 1e9).toFixed(1)}M`;
    }
    if (data.volume) {
      const vol = data.volume;
      if (vol >= 1e6) data.volume_fmt = `${(vol / 1e6).toFixed(1)}M`;
      else if (vol >= 1e3) data.volume_fmt = `${(vol / 1e3).toFixed(0)}K`;
    }

    return NextResponse.json(data);

  } catch (e: any) {
    try { unlinkSync(scriptPath); } catch {}
    return NextResponse.json({ error: `Server error: ${e.message?.slice(0, 100)}` });
  }
}