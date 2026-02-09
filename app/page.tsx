```javascript
import Link from "next/link";
import { Camera, Upload, Sparkles, Zap, Shield, Image as ImageIcon, Flame, TrendingUp, Users, ChevronRight } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#000] text-white selection:bg-indigo-500/30 overflow-hidden font-sans">
      {/* Visionary Mesh Background */}
      <div className="mesh-container">
        <div className="mesh-sphere w-[60%] h-[60%] -top-[10%] -left-[10%] bg-indigo-600/30" />
        <div className="mesh-sphere w-[50%] h-[50%] -bottom-[10%] -right-[10%] bg-purple-600/20" style={{ animationDelay: '-5s' }} />
        <div className="mesh-sphere w-[30%] h-[30%] top-[20%] left-[30%] bg-blue-500/10" style={{ animationDelay: '-10s' }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-24 pb-32 flex flex-col items-center">
        {/* Hot Trend Badge */}
        <div className="animate-fade-in opacity-0" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/[0.03] border border-white/10 mb-10 glass-card">
            <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse shadow-[0_0_10px_rgba(249,115,22,0.8)]" />
            <span className="text-[11px] font-black uppercase tracking-[0.3em] text-white/80">LIVE // COACHELLA MAIN STAGE</span>
          </div>
        </div>

        {/* High-Impact Hero Section */}
        <div className="text-center mb-24 animate-fade-in opacity-0" style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}>
          <div className="relative inline-block">
            <h1 className="text-8xl md:text-[11rem] font-[1000] tracking-tighter mb-8 premium-gradient leading-[0.8] select-none">
              GrabThatFace
            </h1>
            <div className="absolute -top-6 -right-12 animate-float">
                <div className="glass-card px-3 py-1 text-[10px] font-mono border-indigo-500/30 uppercase tracking-widest text-indigo-400">Beta 1.0</div>
            </div>
          </div>
          
          <p className="text-2xl md:text-4xl text-white/60 max-w-4xl mx-auto leading-[1.1] font-light mt-12 tracking-tight">
            Stop scrolling 4,000 photos for <span className="text-white font-medium underline decoration-indigo-500/50 underline-offset-8">one good pic</span>. <br/>
            Claim your <span className="italic font-serif text-indigo-300">Main Character</span> moments instantly.
          </p>
          
          <div className="mt-16 flex flex-wrap justify-center gap-10 opacity-30 hover:opacity-60 transition-opacity">
            <div className="flex items-center gap-3 text-xs font-mono uppercase tracking-[0.3em]">
              <Users size={16} /> 1.2M SCANS
            </div>
            <div className="flex items-center gap-3 text-xs font-mono uppercase tracking-[0.3em]">
              <TrendingUp size={16} /> 12MS LATENCY
            </div>
          </div>
        </div>

        {/* Visionary Action Cards */}
        <div className="grid md:grid-cols-2 gap-10 w-full max-w-6xl animate-fade-in opacity-0" style={{ animationDelay: '500ms', animationFillMode: 'forwards' }}>
          <Link href="/find" className="group">
            <div className="glass-card glass-card-hover p-14 h-full flex flex-col items-start text-left gap-10 relative overflow-hidden group">
              {/* Animated HUD line */}
              <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-indigo-500/50 to-transparent scale-y-0 group-hover:scale-y-100 transition-transform duration-700 origin-top" />
              
              <div className="w-16 h-16 rounded-[24px] bg-white/5 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-all duration-500 shadow-xl">
                <Camera size={32} />
              </div>
              <div className="space-y-4">
                <h3 className="text-4xl font-[900] tracking-tighter italic uppercase group-hover:translate-x-2 transition-transform duration-500">I'm a Guest</h3>
                <p className="text-lg text-white/40 leading-relaxed max-w-[340px] font-light">
                  Deploy biometric scan to retrieve every visual asset encoded with your face.
                </p>
                <div className="inline-flex items-center gap-2 text-indigo-400 text-xs font-black uppercase tracking-[0.4em] pt-4 group-hover:gap-4 transition-all">
                  Launch Scan <ChevronRight size={14} />
                </div>
              </div>
            </div>
          </Link>

          <Link href="/admin" className="group">
            <div className="glass-card glass-card-hover p-14 h-full flex flex-col items-start text-left gap-10 relative overflow-hidden group">
               {/* Animated HUD line */}
               <div className="absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-purple-500/50 to-transparent scale-y-0 group-hover:scale-y-100 transition-transform duration-700 origin-top" />

              <div className="w-16 h-16 rounded-[24px] bg-white/5 flex items-center justify-center text-purple-400 group-hover:bg-purple-500 group-hover:text-white transition-all duration-500 shadow-xl">
                <Upload size={32} />
              </div>
              <div className="space-y-4">
                <h3 className="text-4xl font-[900] tracking-tighter italic uppercase group-hover:translate-x-2 transition-transform duration-500">I'm staff</h3>
                <p className="text-lg text-white/40 leading-relaxed max-w-[340px] font-light">
                  Push raw event data to the indexing cluster. Metadata extraction happens on edge.
                </p>
                <div className="inline-flex items-center gap-2 text-purple-400 text-xs font-black uppercase tracking-[0.4em] pt-4 group-hover:gap-4 transition-all">
                  Access Portal <ChevronRight size={14} />
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Tech Stack Pulse */}
        <div className="mt-40 grid grid-cols-2 lg:grid-cols-4 gap-20 opacity-[0.1] hover:opacity-40 transition-opacity animate-fade-in opacity-0" style={{ animationDelay: '700ms', animationFillMode: 'forwards' }}>
          <div className="flex flex-col items-center gap-4">
            <Zap size={24} />
            <span className="text-[10px] font-black uppercase tracking-[0.5em]">HNSW INDEX</span>
          </div>
          <div className="flex flex-col items-center gap-4">
            <Shield size={24} />
            <span className="text-[10px] font-black uppercase tracking-[0.5em]">SHA-256</span>
          </div>
          <div className="flex flex-col items-center gap-4">
            <ImageIcon size={24} />
            <span className="text-[10px] font-black uppercase tracking-[0.5em]">RAW 12BIT</span>
          </div>
          <div className="flex flex-col items-center gap-4">
            <Sparkles size={24} />
            <span className="text-[10px] font-black uppercase tracking-[0.5em]">VISION RAG</span>
          </div>
        </div>
      </div>

      <footer className="fixed bottom-10 left-10 text-[9px] font-mono text-white/5 uppercase tracking-[0.6em] rotate-180 [writing-mode:vertical-lr] pointer-events-none">
        NEURAL ARCHITECTURE // v1.0.4-LATEST
      </footer>
    </main>
  );
}
```
