"use client";

import React, { useState } from "react";
import axios from "axios";
import Link from "next/link";
import { ArrowLeft, UploadCloud, CheckCircle, AlertCircle, Loader2, Activity, Terminal, ShieldCheck, Cpu, Database, Share2 } from "lucide-react";

const BACKEND_URL = "http://localhost:8000";

export default function AdminUpload() {
    const [files, setFiles] = useState<File[]>([]);
    const [uploading, setUploading] = useState(false);
    const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
    const [progress, setProgress] = useState(0);

    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFiles(Array.from(e.target.files));
            setStatus(null);
            setProgress(0);
        }
    };

    const handleUpload = async () => {
        if (files.length === 0) return;

        setUploading(true);
        setStatus(null);

        let successCount = 0;
        let errorCount = 0;

        for (let i = 0; i < files.length; i++) {
            const formData = new FormData();
            formData.append("file", files[i]);
            formData.append("event_id", "live-event-delta");

            try {
                await axios.post(`${BACKEND_URL}/api/v1/photos/`, formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                successCount++;
            } catch (err) {
                console.error("Upload error:", err);
                errorCount++;
            }
            setProgress(Math.round(((i + 1) / files.length) * 100));
        }

        setUploading(false);
        setStatus({
            type: errorCount === 0 ? "success" : "error",
            message: `Cluster Sync Complete: ${successCount} entries indexed. ${errorCount > 0 ? `${errorCount} nodes failed.` : ""}`
        });
        setFiles([]);
    };

    return (
        <main className="min-h-screen bg-[#000] text-white selection:bg-indigo-500/30 overflow-x-hidden font-sans">
            {/* Visionary Mesh Background */}
            <div className="mesh-container">
                <div className="mesh-sphere w-[60%] h-[60%] top-0 -left-[10%] bg-purple-600/10" />
                <div className="mesh-sphere w-[50%] h-[50%] bottom-0 -right-[10%] bg-indigo-600/10" style={{ animationDelay: '-5s' }} />
            </div>

            <nav className="relative z-10 p-8 flex justify-between items-center max-w-7xl mx-auto border-b border-white/5">
                <Link href="/" className="group flex items-center gap-3 text-white/40 hover:text-white transition-all uppercase tracking-[0.2em] font-black text-xs">
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    Terminal Exit
                </Link>
                <div className="flex items-center gap-6">
                    <div className="hidden md:flex items-center gap-3 glass-card px-4 py-2 bg-white/[0.01] border-white/5">
                        <Activity size={14} className="text-indigo-500 animate-pulse" />
                        <span className="text-[10px] font-mono text-white/30 uppercase tracking-widest leading-none">Node: Delta-01 // ACTIVE</span>
                    </div>
                </div>
            </nav>

            <div className="relative z-10 max-w-4xl mx-auto px-6 pt-20 pb-24">
                <header className="mb-20 space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 font-mono text-[10px] uppercase text-indigo-400 font-black tracking-widest">
                        <Database size={12} /> Data Pipeline Stage 0
                    </div>
                    <h1 className="text-7xl font-[1000] tracking-tighter italic uppercase leading-[0.8]">
                        Event <br /> Command
                    </h1>
                    <p className="text-xl text-white/40 max-w-xl font-light leading-relaxed pt-4">
                        Push raw visual assets to the neural indexing cluster. attendees will receive instant match notifications via the biometric mesh.
                    </p>
                </header>

                <div className="space-y-10">
                    {/* Uploader Hub */}
                    <div className="glass-card p-20 group hover:border-indigo-500/30 transition-all cursor-pointer relative overflow-hidden bg-white/[0.01] text-center border-dashed border-white/10 glass-card-hover">
                        <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={onFileChange}
                            className="absolute inset-0 opacity-0 cursor-pointer z-10"
                        />
                        <div className="flex flex-col items-center gap-10 relative z-20">
                            <div className="w-28 h-28 rounded-[32px] bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-all duration-700 shadow-2xl">
                                <UploadCloud size={48} />
                            </div>
                            <div className="space-y-3">
                                <p className="text-4xl font-[1000] uppercase italic tracking-tighter">
                                    {files.length > 0 ? `${files.length} Assets Loaded` : "Input Source Data"}
                                </p>
                                <p className="text-xs text-white/20 uppercase tracking-[0.4em] font-black">
                                    Supported: RAW, JPG, PNG // Bulk Deployment Active
                                </p>
                            </div>
                        </div>
                    </div>

                    {files.length > 0 && !uploading && (
                        <button
                            onClick={handleUpload}
                            className="w-full h-24 rounded-[32px] bg-white text-black font-[1000] text-2xl uppercase italic tracking-tighter transition-all hover:bg-neutral-200 active:scale-[0.98] shadow-[0_20px_50px_rgba(255,255,255,0.2)] flex items-center justify-center gap-6 group overflow-hidden relative"
                        >
                            <div className="absolute inset-0 bg-indigo-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-700 opacity-10" />
                            Execute Sync
                            <Terminal size={28} className="group-hover:translate-x-3 transition-transform duration-500" />
                        </button>
                    )}

                    {uploading && (
                        <div className="glass-card p-12 space-y-10 bg-white/[0.02]">
                            <div className="flex justify-between items-end">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
                                        <span className="text-[10px] font-black font-mono text-indigo-400 uppercase tracking-widest">Provisioning Mesh</span>
                                    </div>
                                    <h3 className="text-4xl font-[1000] italic uppercase tracking-tighter">Indexing {progress}%</h3>
                                </div>
                                <Loader2 size={40} className="animate-spin text-white/10" />
                            </div>
                            <div className="h-6 w-full bg-white/5 rounded-full overflow-hidden p-1.5 border border-white/5">
                                <div
                                    className="h-full bg-indigo-500 rounded-full transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] shadow-[0_0_30px_rgba(99,102,241,0.8)]"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-8 pt-4">
                                <div className="space-y-2">
                                    <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white/20">Extraction</p>
                                    <p className="text-sm font-mono text-indigo-300">Face Vectorizing...</p>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white/20">Throughput</p>
                                    <p className="text-sm font-mono text-indigo-300">12.4 Assets / Sec</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {status && (
                        <div className={`p-10 rounded-[40px] border flex items-center gap-8 animate-fade-in ${status.type === 'success'
                                ? 'bg-green-500/5 border-green-500/20 text-green-400'
                                : 'bg-red-500/5 border-red-500/20 text-red-400'
                            }`}>
                            <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center ${status.type === 'success' ? 'bg-green-500/10 shadow-[0_0_20px_rgba(34,197,94,0.2)]' : 'bg-red-500/10 shadow-[0_0_20px_rgba(239,68,68,0.2)]'}`}>
                                {status.type === 'success' ? <CheckCircle size={32} /> : <AlertCircle size={32} />}
                            </div>
                            <div className="space-y-1">
                                <p className="text-2xl font-[1000] italic uppercase tracking-tighter">{status.message}</p>
                                <p className="text-[10px] font-mono uppercase tracking-[0.4em] opacity-60">Session Log: Index:delta-sync-01</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Dashboard Stats */}
                <div className="mt-32 grid grid-cols-3 gap-8">
                    <div className="glass-card p-8 border-white/5 space-y-3 glass-card-hover group">
                        <Share2 size={24} className="text-white/20 group-hover:text-indigo-400 transition-colors" />
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 mb-1">Peer Mesh</p>
                            <p className="text-3xl font-[1000] italic uppercase leading-none">Global</p>
                        </div>
                    </div>
                    <div className="glass-card p-8 border-white/5 space-y-3 glass-card-hover group">
                        <ShieldCheck size={24} className="text-white/20 group-hover:text-indigo-400 transition-colors" />
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 mb-1">Encrypted</p>
                            <p className="text-3xl font-[1000] italic uppercase leading-none">AES-256</p>
                        </div>
                    </div>
                    <div className="glass-card p-8 border-white/5 space-y-3 glass-card-hover group">
                        <Cpu size={24} className="text-white/20 group-hover:text-indigo-400 transition-colors" />
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 mb-1">Latency</p>
                            <p className="text-3xl font-[1000] italic uppercase leading-none">12ms</p>
                        </div>
                    </div>
                </div>

                <footer className="mt-32 pt-16 border-t border-white/5 flex justify-between items-center text-white/10 font-mono text-[10px] uppercase tracking-[0.5em]">
                    <span>Node Cluster // Delta-01</span>
                    <span>Vision Architecture v1.0.4</span>
                </footer>
            </div>
        </main>
    );
}
