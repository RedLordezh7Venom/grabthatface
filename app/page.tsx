import Link from "next/link";
import { Camera, Upload, Sparkles, Zap, Shield, Image as ImageIcon, Flame, TrendingUp, Users } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#030303] text-white selection:bg-indigo-500/30 overflow-hidden font-sans">
      {/* Dynamic Aura Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-indigo-600/15 blur-[160px] rounded-full opacity-50" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-purple-600/10 blur-[160px] rounded-full opacity-50" />
        <div className="absolute top-[30%] left-[40%] w-[20%] h-[20%] bg-blue-500/5 blur-[100px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-32 flex flex-col items-center">
        {/* Hot Trend Badge */}
        <div className="animate-fade-in opacity-0" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.03] border border-white/10 mb-8 glass-card">
            <Flame size={14} className="text-orange-500 fill-orange-500" />
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/80">Viral at Coachella 2026</span>
          </div>
        </div>

        {/* High-Impact Hero Section */}
        <div className="text-center mb-20 animate-fade-in opacity-0" style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}>
          <h1 className="text-7xl md:text-9xl font-[900] tracking-tighter mb-8 premium-gradient leading-[0.85]">
            GrabThatFace
          </h1>
          <p className="text-2xl md:text-3xl text-white/50 max-w-3xl mx-auto leading-tight font-light mt-8 tracking-tight">
            Stop scrolling 4,000 photos for <span className="text-white font-medium border-b-2 border-indigo-500/50">one good pic</span>.
            Claim your <span className="italic font-serif">Main Character</span> moments in milliseconds.
          </p>

          <div className="mt-12 flex flex-wrap justify-center gap-6 opacity-40">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest">
              <Users size={14} /> 1.2M+ Faces Scanned
            </div>
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest">
              <TrendingUp size={14} /> 99.8% Recall Speed
            </div>
          </div>
        </div>

        {/* Viral Action Cards */}
        <div className="grid md:grid-cols-2 gap-10 w-full max-w-5xl animate-fade-in opacity-0" style={{ animationDelay: '500ms', animationFillMode: 'forwards' }}>
          <Link href="/find" className="group">
            <div className="glass-card p-12 h-full flex flex-col items-start text-left gap-8 group-hover:bg-white/[0.05] transition-all active:scale-[0.98] border-white/5 group-hover:border-indigo-500/40 relative overflow-hidden">
              {/* Subtle Grid Pattern */}
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

              <div className="w-16 h-16 rounded-[20px] bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:scale-110 group-hover:bg-indigo-500 group-hover:text-white transition-all duration-500">
                <Camera size={32} />
              </div>
              <div>
                <h3 className="text-3xl font-black mb-3 italic">Find My Content</h3>
                <p className="text-base text-white/40 leading-relaxed max-w-[320px]">
                  Take a biometric selfie. Let the neural engine rip through the archive to find every shot you're in.
                </p>
                <div className="mt-6 flex items-center gap-2 text-indigo-400 text-sm font-bold uppercase tracking-widest group-hover:translate-x-2 transition-transform">
                  Launch Neural Search →
                </div>
              </div>
            </div>
          </Link>

          <Link href="/admin" className="group">
            <div className="glass-card p-12 h-full flex flex-col items-start text-left gap-8 group-hover:bg-white/[0.05] transition-all active:scale-[0.98] border-white/5 group-hover:border-purple-500/40 relative overflow-hidden">
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

              <div className="w-16 h-16 rounded-[20px] bg-purple-500/10 flex items-center justify-center text-purple-400 group-hover:scale-110 group-hover:bg-purple-500 group-hover:text-white transition-all duration-500">
                <Upload size={32} />
              </div>
              <div>
                <h3 className="text-3xl font-black mb-3 italic">Event Organizer</h3>
                <p className="text-base text-white/40 leading-relaxed max-w-[320px]">
                  Upload raw event folders. The Vision RAG pipeline indexes metadata for your attendees instantly.
                </p>
                <div className="mt-6 flex items-center gap-2 text-purple-400 text-sm font-bold uppercase tracking-widest group-hover:translate-x-2 transition-transform">
                  Access Portal 01 →
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Tech Stack Pulse */}
        <div className="mt-32 grid grid-cols-2 md:grid-cols-4 gap-16 opacity-[0.15] hover:opacity-50 transition-opacity animate-fade-in opacity-0" style={{ animationDelay: '700ms', animationFillMode: 'forwards' }}>
          <div className="flex flex-col items-center gap-3 grayscale hover:grayscale-0 transition-all">
            <Zap size={24} />
            <span className="text-[9px] font-bold uppercase tracking-[0.3em]">Vector Optimized</span>
          </div>
          <div className="flex flex-col items-center gap-3 grayscale hover:grayscale-0 transition-all">
            <Shield size={24} />
            <span className="text-[9px] font-bold uppercase tracking-[0.3em]">Privacy First</span>
          </div>
          <div className="flex flex-col items-center gap-3 grayscale hover:grayscale-0 transition-all">
            <ImageIcon size={24} />
            <span className="text-[9px] font-bold uppercase tracking-[0.3em]">8K Lossless</span>
          </div>
          <div className="flex flex-col items-center gap-3 grayscale hover:grayscale-0 transition-all">
            <Sparkles size={24} />
            <span className="text-[9px] font-bold uppercase tracking-[0.3em]">Neural Reco</span>
          </div>
        </div>
      </div>

      <footer className="fixed bottom-10 left-10 text-[10px] font-mono text-white/10 uppercase tracking-[0.5em] rotate-180 [writing-mode:vertical-lr] pointer-events-none">
        Vision Architecture // Node v1.0.4-Stable
      </footer>
    </main>
  );
}
