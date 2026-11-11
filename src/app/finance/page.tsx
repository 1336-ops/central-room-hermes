"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Search, TrendingUp, TrendingDown, Activity, DollarSign, BarChart3, Clock, AlertCircle, CheckCircle, Loader2 } from "lucide-react";

const POPULAR_STOCKS = [
  { ticker: "BBCA.JK", name: "Bank Central Asia" },
  { ticker: "TLKM.JK", name: "Telkom Indonesia" },
  { ticker: "BMRI.JK", name: "Bank Mandiri" },
  { ticker: "BBNI.JK", name: "Bank BNI" },
  { ticker: "ASII.JK", name: "Astra International" },
  { ticker: "UNTR.JK", name: "United Tractors" },
  { ticker: "GOTO.JK", name: "GoTo Gojek Tokopedia" },
  { ticker: "EMTK.JK", name: "Elang Mahkota Teknologi" },
];

const MOCK_DATA: Record<string, any> = {
  "BBCA.JK": {
    price: "10,850",
    change: "+1.25%",
    up: true,
    volume: "45.2M",
    marketCap: "1,342T",
    pe: "28.5x",
    dividend: "4.2%",
    analyst: "STRONG BUY",
    target: "12,500",
    analystCount: 28,
  },
  "TLKM.JK": {
    price: "3,020",
    change: "-0.45%",
    up: false,
    volume: "32.1M",
    marketCap: "298T",
    pe: "14.2x",
    dividend: "5.8%",
    analyst: "BUY",
    target: "3,500",
    analystCount: 22,
  },
};

type Stock = {
  ticker: string;
  name: string;
  price: string;
  change: string;
  up: boolean;
  volume: string;
  marketCap: string;
  pe: string;
  dividend: string;
  analyst: string;
  target: string;
  analystCount: number;
};

function StockCard({ stock }: { stock: Stock }) {
  return (
    <Card className="glass-card border-slate-800/50 hover:border-emerald-500/20 transition-all duration-200">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="text-sm font-bold text-white">{stock.ticker}</p>
            <p className="text-[10px] text-slate-500">{stock.name}</p>
          </div>
          <Badge className={cn(
            "text-[10px] font-bold",
            stock.analyst === "STRONG BUY" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" :
            stock.analyst === "BUY" ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/30" :
            "bg-slate-500/10 text-slate-400 border-slate-500/30"
          )}>
            {stock.analyst}
          </Badge>
        </div>
        <div className="flex items-end gap-2 mb-3">
          <span className="text-xl font-bold text-white">Rp{stock.price}</span>
          <span className={cn(
            "text-xs font-medium flex items-center gap-0.5",
            stock.up ? "text-emerald-400" : "text-red-400"
          )}>
            {stock.up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {stock.change}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-[10px]">
          <div className="p-1.5 rounded bg-slate-900/50">
            <p className="text-slate-500">Volume</p>
            <p className="text-white font-medium">{stock.volume}</p>
          </div>
          <div className="p-1.5 rounded bg-slate-900/50">
            <p className="text-slate-500">Market Cap</p>
            <p className="text-white font-medium">{stock.marketCap}</p>
          </div>
          <div className="p-1.5 rounded bg-slate-900/50">
            <p className="text-slate-500">P/E Ratio</p>
            <p className="text-white font-medium">{stock.pe}</p>
          </div>
          <div className="p-1.5 rounded bg-slate-900/50">
            <p className="text-slate-500">Dividen</p>
            <p className="text-white font-medium">{stock.dividend}</p>
          </div>
        </div>
        <div className="mt-2 p-2 rounded bg-slate-900/30 border border-slate-800/30">
          <p className="text-[10px] text-slate-500 mb-0.5">Target Price</p>
          <p className="text-sm font-bold text-emerald-400">Rp{stock.target}</p>
          <p className="text-[9px] text-slate-600">{stock.analystCount} analyst ratings</p>
        </div>
      </CardContent>
    </Card>
  );
}

function ComingSoonCard({ ticker }: { ticker: string }) {
  return (
    <Card className="glass-card border-slate-800/50">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="text-sm font-bold text-slate-300">{ticker}</p>
            <p className="text-[10px] text-slate-600">Klik untuk analisis</p>
          </div>
          <Loader2 className="h-4 w-4 text-slate-600 animate-spin" />
        </div>
        <div className="p-3 rounded bg-slate-900/30 border border-slate-800/30 text-center">
          <p className="text-xs text-slate-500">TradingAgents AI</p>
          <p className="text-sm text-slate-400 mt-1">Klik Search untuk analisis</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function FinancePage() {
  const [search, setSearch] = useState("");
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  const handleSearch = async () => {
    if (!search.trim()) return;
    const ticker = search.toUpperCase().trim();
    const fullTicker = ticker.endsWith(".JK") ? ticker : `${ticker}.JK`;
    setSelectedTicker(fullTicker);
    setAnalyzing(true);
    setAnalysisResult(null);

    try {
      const r = await fetch(`/dashboard/api/finance/analyze?ticker=${encodeURIComponent(fullTicker)}`);
      const d = await r.json();
      setAnalysisResult(d);
    } catch {
      setAnalysisResult({ error: "Gagal mengambil data. Coba lagi." });
    } finally {
      setAnalyzing(false);
    }
  };

  const displayedStock = selectedTicker && MOCK_DATA[selectedTicker];

  return (
    <div className="space-y-6 bg-grid min-h-[calc(100vh-4rem)]">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold gradient-text">Finance & Stocks</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Analisis saham Indonesia dengan AI agent — Powered by TradingAgents
        </p>
      </div>

      {/* Search */}
      <Card className="glass-card border-slate-800/50">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
              <Input
                placeholder="Ketik ticker... contoh: BBCA.JK, TLKM.JK"
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSearch()}
                className="pl-10 bg-slate-900/50 border-slate-800/50 text-white placeholder:text-slate-700 focus:border-emerald-500/30"
              />
            </div>
            <Button
              onClick={handleSearch}
              disabled={!search.trim() || analyzing}
              className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:opacity-90 text-white"
            >
              {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Analisis"}
            </Button>
          </div>

          {/* Popular Stocks */}
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="text-[10px] text-slate-600 self-center">Popular:</span>
            {POPULAR_STOCKS.map(s => (
              <button
                key={s.ticker}
                onClick={() => { setSearch(s.ticker); }}
                className="text-[10px] px-2 py-1 rounded-full bg-slate-800/50 border border-slate-700/50 text-slate-400 hover:text-white hover:border-emerald-500/30 transition-all"
              >
                {s.ticker}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* TradingAgents Status */}
      <Card className="glass-card border-emerald-500/10">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10">
              <Activity className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-white flex items-center gap-2">
                TradingAgents v0.2.4
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Active
                </span>
              </p>
              <p className="text-xs text-slate-500">
                Multi-Agent Stock Analysis • NYSE • NASDAQ • IDX Support
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analysis Result */}
      {analysisResult && !analysisResult.error && (
        <Card className="glass-card border-emerald-500/20">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-400" />
              <p className="text-sm font-bold text-emerald-400">Analisis Selesai — {selectedTicker}</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/50 text-sm text-slate-300 whitespace-pre-wrap font-mono leading-relaxed max-h-96 overflow-y-auto">
              {typeof analysisResult === "string" ? analysisResult : JSON.stringify(analysisResult, null, 2)}
            </div>
          </CardContent>
        </Card>
      )}

      {analysisResult?.error && (
        <Card className="glass-card border-red-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-400">
              <AlertCircle className="h-4 w-4" />
              <p className="text-sm">{analysisResult.error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stock Grid */}
      {displayedStock && (
        <div>
          <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-emerald-400" />
            Hasil Analisis — {selectedTicker}
          </h3>
          <StockCard stock={displayedStock} />
        </div>
      )}

      {/* Info */}
      <Card className="glass-card border-slate-800/50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 mt-0.5">
              <AlertCircle className="h-4 w-4 text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">⚠️ Disclaimer</p>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Data saham bersifatReferensi saja. Analisis ini bukan nasihat keuangan,
                investasi, atau trading. Performansi masa lalu tidak menjamin hasil masa depan.
                Selalu lakukan riset sendiri (DYOR) sebelum mengambil keputusan investasi.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}