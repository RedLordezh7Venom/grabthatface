"use client";

import React, { useState, useCallback } from "react";
import axios from "axios";
import Link from "next/link";
import { ArrowLeft, Database, CheckCircle, AlertCircle, Share2, Loader2, UploadCloud, Cpu } from "lucide-react";

const BACKEND_URL = "http://localhost:8000";

export default function IntelligencePortal() {
    const [files, setFiles] = useState<File[]>([]);
    const [ingesting, setIngesting] = useState(false);
    const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
    const [progress, setProgress] = useState(0);

    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFiles(Array.from(e.target.files));
            setStatus(null);
            setProgress(0);
        }
    };

    const handleIngestion = async () => {
        if (files.length === 0) return;

        setIngesting(true);
        setStatus(null);

        let successCount = 0;
        let errorCount = 0;

        for (let i = 0; i < files.length; i++) {
            const formData = new FormData();
            formData.append("file", files[i]);
            formData.append("event_id", "market-feed-01");

            try {
                await axios.post(`${BACKEND_URL}/api/v1/photos/`, formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                successCount++;
            } catch (err) {
                console.error("Ingestion error:", err);
                errorCount++;
            }
            setProgress(Math.round(((i + 1) / files.length) * 100));
        }

        setIngesting(false);
        setStatus({
            type: errorCount === 0 ? "success" : "error",
            message: `Successfully indexed ${successCount} market signals. ${errorCount > 0 ? `${errorCount} nodes failed.` : ""}`
        });
        setFiles([]);
    };

    return (
        <main className="min-h-screen bg-[#020617] text-slate-100 selection:bg-cyan-500/30 data-grid">
            {/* Background Glow */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-cyan-500/10 blur-[120px] rounded-full" />
                <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full" />
            </div>

            <nav className="relative z-10 p-6 flex justify-between items-center max-w-7xl mx-auto">
                <Link href="/" className="group flex items-center gap-2 text-slate-500 hover:text-cyan-400 transition-all">
                    <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm font-mono uppercase tracking-widest">Back to Terminal</span>
                </Link>
                <div className="h-8 w-[1px] bg-slate-800 mx-4" />
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                    <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">Data Stream Active</span>
                </div>
            </nav>

            <div className="relative z-10 max-w-2xl mx-auto px-6 pt-12 pb-24 animate-fade-in">
                <header className="mb-12">
                    <div className="flex items-center gap-3 mb-4">
                        <Cpu className="text-cyan-400" size={32} />
                        <h1 className="text-4xl font-bold tracking-tight">Intelligence Ingestion</h1>
                    </div>
                    <p className="text-lg text-slate-400 leading-relaxed font-light">
                        Populate the Neural Index with market signals. Upload screenshots of viral content, app store charts, or user behavior logs for pattern extraction.
                    </p>
                </header>

                <div className="space-y-6">
                    <div className="glass-card p-12 group hover:border-cyan-500/30 transition-all cursor-pointer relative overflow-hidden bg-slate-900/40">
                        <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={onFileChange}
                            className="absolute inset-0 opacity-0 cursor-pointer z-10"
                        />
                        <div className="flex flex-col items-center gap-6">
                            <div className="w-20 h-20 rounded-2xl bg-cyan-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 border border-cyan-500/20">
                                <UploadCloud size={32} className="text-cyan-400" />
                            </div>
                            <div className="text-center">
                                <p className="text-xl font-bold mb-1">
                                    {files.length > 0 ? `${files.length} SIGNALS STAGED` : "DROP DATA FEED"}
                                </p>
                                <p className="text-xs text-slate-500 font-mono uppercase tracking-tighter">
                                    Supports PNG, JPG, JSON Meta
                                </p>
                            </div>
                        </div>
                    </div>

                    {files.length > 0 && !ingesting && (
                        <button
                            onClick={handleIngestion}
                            className="w-full h-16 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-[#020617] font-bold text-lg transition-all active:scale-[0.98] shadow-lg shadow-cyan-500/20 uppercase tracking-widest"
                        >
                            Propagate to Neural Index
                        </button>
                    )}

                    {ingesting && (
                        <div className="glass-card p-8 space-y-4 bg-slate-900/60 border-cyan-500/30">
                            <div className="flex justify-between text-xs font-mono tracking-tighter">
                                <span className="text-cyan-400 uppercase">Indexing Signals...</span>
                                <span className="text-cyan-400">{progress}%</span>
                            </div>
                            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-cyan-500 transition-all duration-500 ease-out shadow-[0_0_15px_rgba(6,182,212,0.5)]"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono animate-pulse">
                                <Loader2 size={12} className="animate-spin text-cyan-500" />
                                <span>Extracting Market Vectors...</span>
                            </div>
                        </div>
                    )}

                    {status && (
                        <div className={`p-6 rounded-xl border flex items-center gap-4 animate-fade-in ${status.type === 'success'
                                ? 'bg-green-500/10 border-green-500/30 text-green-400'
                                : 'bg-red-500/10 border-red-500/30 text-red-400'
                            }`}>
                            {status.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                            <p className="text-sm font-medium font-mono uppercase tracking-tight">{status.message}</p>
                        </div>
                    )}
                </div>

                <footer className="mt-20 pt-10 border-t border-slate-800 flex justify-between items-center text-slate-600 font-mono text-[10px] uppercase tracking-[0.2em]">
                    <span>Neural Crawler Node 4.2</span>
                    <span>Ingestion Mode</span>
                </footer>
            </div>
        </main>
    );
}
