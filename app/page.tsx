import Link from "next/link";
import { Camera, Upload, Sparkles, Zap, Shield, Image as ImageIcon } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white selection:bg-indigo-500/30 overflow-hidden">
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-24 pb-32 flex flex-col items-center">
        {/* Hero Section */}
        <div className="text-center mb-20 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-6 glass-card">
            <Sparkles size={14} className="text-indigo-400" />
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/60">Powered by Vision RAG</span>
          </div>
          <h1 className="text-7xl md:text-8xl font-black tracking-tighter mb-6 premium-gradient leading-none">
            GrabThatFace
          </h1>
          <p className="text-xl md:text-2xl text-white/40 max-w-2xl mx-auto leading-relaxed font-light mt-4">
            The instant neural retrieval system for event photography.
            Deployed in seconds. Searched in milliseconds.
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid md:grid-cols-2 gap-8 w-full max-w-4xl animate-fade-in" style={{ animationDelay: '200ms' }}>
          <Link href="/find" className="group">
            <div className="glass-card p-10 h-full flex flex-col items-center text-center gap-6 group-hover:bg-white/5 transition-all active:scale-[0.98] border-white/5 group-hover:border-indigo-500/30 group-hover:shadow-[0_0_40px_rgba(99,102,241,0.1)]">
              <div className="w-20 h-20 rounded-[24px] bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:scale-110 group-hover:bg-indigo-500 group-hover:text-white transition-all duration-500 shadow-inner">
                <Camera size={40} />
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-2">Neural Finder</h3>
                <p className="text-sm text-white/30 leading-relaxed max-w-[240px]">
                  Use biometric scanning to find every photo you're in across the entire event index.
                </p>
              </div>
            </div>
          </Link>

          <Link href="/admin" className="group">
            <div className="glass-card p-10 h-full flex flex-col items-center text-center gap-6 group-hover:bg-white/5 transition-all active:scale-[0.98] border-white/5 group-hover:border-purple-500/30 group-hover:shadow-[0_0_40px_rgba(168,85,247,0.1)]">
              <div className="w-20 h-20 rounded-[24px] bg-purple-500/10 flex items-center justify-center text-purple-400 group-hover:scale-110 group-hover:bg-purple-500 group-hover:text-white transition-all duration-500 shadow-inner">
                <Upload size={40} />
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-2">Event Control</h3>
                <p className="text-sm text-white/30 leading-relaxed max-w-[240px]">
                  Upload high-res archives. The AI engine handles face detection and vector indexing.
                </p>
              </div>
            </div>
          </Link>
        </div>

        {/* Features Row */}
        <div className="mt-32 grid grid-cols-2 md:grid-cols-4 gap-12 opacity-30 animate-fade-in" style={{ animationDelay: '400ms' }}>
          <div className="flex flex-col items-center gap-3">
            <Zap size={20} />
            <span className="text-[10px] font-mono uppercase tracking-[0.2em]">FAISS Vector</span>
          </div>
          <div className="flex flex-col items-center gap-3">
            <Shield size={20} />
            <span className="text-[10px] font-mono uppercase tracking-[0.2em]">Neural Encryption</span>
          </div>
          <div className="flex flex-col items-center gap-3">
            <ImageIcon size={20} />
            <span className="text-[10px] font-mono uppercase tracking-[0.2em]">HD Retrieval</span>
          </div>
          <div className="flex flex-col items-center gap-3">
            <Sparkles size={20} />
            <span className="text-[10px] font-mono uppercase tracking-[0.2em]">HOG Detection</span>
          </div>
        </div>
      </div>

      {/* Footer Decoration */}
      <footer className="fixed bottom-10 left-10 text-[10px] font-mono text-white/10 uppercase tracking-[0.3em] rotate-180 [writing-mode:vertical-lr]">
        Vision Retrieval Architecture v1.0
      </footer>
    </main>
  );
}
