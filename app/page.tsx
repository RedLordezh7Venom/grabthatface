import Link from "next/link";
import { TrendingUp, BarChart3, Zap, Globe, Cpu, Layers, Activity, Search } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#020617] text-slate-100 selection:bg-cyan-500/30 overflow-hidden data-grid">
      {/* Neural Background Elements */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-cyan-600/10 blur-[160px] rounded-full animate-data-flicker" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/5 blur-[140px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-32">
        {/* Navigation / Header */}
        <header className="flex justify-between items-center mb-24 animate-fade-in">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center border border-cyan-500/30">
              <TrendingUp className="text-cyan-400" size={20} />
            </div>
            <span className="text-xl font-bold tracking-tight">TREND-ORBIT</span>
          </div>
          <div className="flex items-center gap-6 text-xs font-mono text-slate-400 uppercase tracking-widest">
            <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" /> Live Analysis</span>
            <span className="opacity-50">Sprint v4.2.0</span>
          </div>
        </header>

        {/* Hero Section */}
        <div className="max-w-4xl mb-24 animate-fade-in" style={{ animationDelay: '100ms' }}>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-8 glass-card">
            <Zap size={14} className="text-cyan-400" />
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-cyan-200">6-Day Sprint Engine Active</span>
          </div>
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-8 premium-gradient leading-[0.9] drop-shadow-2xl">
            Spot Trends <br /> Before They Peak.
          </h1>
          <p className="text-xl md:text-2xl text-slate-400 max-w-2xl leading-relaxed font-light mt-6">
            The studio's early warning system. We translate the chaotic energy of internet culture into high-velocity product opportunities.
          </p>
        </div>

        {/* Intelligence Modules */}
        <div className="grid md:grid-cols-3 gap-6 w-full animate-fade-in" style={{ animationDelay: '300ms' }}>
          <Link href="/find" className="group">
            <div className="glass-card p-8 h-full flex flex-col gap-6 group-hover:bg-slate-800/50 transition-all border-slate-800 hover:border-cyan-500/30">
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                <Search size={28} />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-3">Pattern Matcher</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Use our Visual Neural Engine to identify emerging aesthetic patterns across socials.
                </p>
              </div>
              <div className="mt-auto pt-4 flex items-center gap-2 text-[10px] font-mono text-cyan-500">
                <span>OPEN SCANNER</span>
                <div className="h-[1px] flex-1 bg-cyan-500/20" />
              </div>
            </div>
          </Link>

          <Link href="/admin" className="group">
            <div className="glass-card p-8 h-full flex flex-col gap-6 group-hover:bg-slate-800/50 transition-all border-slate-800 hover:border-blue-500/30">
              <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                <BarChart3 size={28} />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-3">Data Ingestion</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Feed the engine with screenshots of TikToks, Reels, and App Store charts for real-time analysis.
                </p>
              </div>
              <div className="mt-auto pt-4 flex items-center gap-2 text-[10px] font-mono text-blue-500">
                <span>PORTAL ACTIVE</span>
                <div className="h-[1px] flex-1 bg-blue-500/20" />
              </div>
            </div>
          </Link>

          <div className="glass-card p-8 h-full flex flex-col gap-6 bg-slate-400/5 border-dashed">
            <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-500">
              <Globe size={28} />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-3 text-slate-500">Cultural Context</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Automated sentiment mapping and meme-origin tracking coming in Sprint 5.
              </p>
            </div>
            <div className="mt-auto pt-4 flex items-center gap-2 text-[10px] font-mono text-slate-700">
              <span>MODULE LOCKED</span>
              <div className="h-[1px] flex-1 bg-slate-800" />
            </div>
          </div>
        </div>

        {/* Real-time Ticker */}
        <div className="mt-24 py-6 border-y border-slate-800 flex overflow-hidden whitespace-nowrap gap-12 text-[10px] font-mono text-slate-500 animate-fade-in">
          <span className="flex items-center gap-2"><Activity size={12} className="text-green-500" /> TIKTOK VELOCITY: +54% W/W</span>
          <span className="flex items-center gap-2"><Activity size={12} className="text-cyan-500" /> IG REEL MOMENTUM: HIGH</span>
          <span className="flex items-center gap-2"><Activity size={12} className="text-blue-500" /> APP STORE GAP IDENTIFIED: #AI-EDITOR</span>
          <span className="flex items-center gap-2"><Activity size={12} className="text-purple-500" /> SPRINT READY: 6 OPPORTUNITIES</span>
          <span className="flex items-center gap-2"><Activity size={12} className="text-green-500" /> GEN-Z SENTIMENT: POSITIVE</span>
        </div>
      </div>

      <footer className="fixed bottom-10 right-10 flex flex-col items-end gap-1 opacity-20 pointer-events-none">
        <span className="text-[8px] font-mono uppercase tracking-[0.5em]">System Orbiting</span>
        <span className="text-[8px] font-mono uppercase tracking-[0.5em]">Velocity Tracking Active</span>
      </footer>
    </main>
  );
}
