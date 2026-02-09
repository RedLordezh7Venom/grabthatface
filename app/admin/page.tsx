"use client";

import React, { useState, useCallback } from "react";
import axios from "axios";
import Link from "next/link";
import { ArrowLeft, UploadCloud, CheckCircle, AlertCircle, Image as ImageIcon, Loader2, Activity, Terminal, ShieldCheck } from "lucide-react";

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
            message: `Event Index Updated: ${successCount} entries synced. ${errorCount > 0 ? `${errorCount} nodes failed.` : ""}`
        });
        setFiles([]);
    };

    return (
        <main className="min-h-screen bg-[#030303] text-white selection:bg-indigo-500/30 overflow-x-hidden font-sans">
            {/* Command Center Overlay */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                <div className="absolute top-20 left-10 w-px h-64 bg-gradient-to-b from-indigo-500/20 to-transparent" />
            </div>

            <nav className="relative z-10 p-8 flex justify-between items-center max-w-7xl mx-auto border-b border-white/5">
                <Link href="/" className="group flex items-center gap-3 text-white/40 hover:text-white transition-all uppercase tracking-[0.2em] font-black text-xs">
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    Terminal Exit
                </Link>
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <Activity size={14} className="text-indigo-500 animate-pulse" />
                        <span className="text-[10px] font-mono text-white/30 uppercase tracking-widest">Vision Node: Delta-01</span>
                    </div>
                </div>
            </nav>

            <div className="relative z-10 max-w-3xl mx-auto px-6 pt-20 pb-24">
                <header className="mb-16 space-y-4 text-center lg:text-left">
                    <h1 className="text-6xl font-[900] tracking-tighter italic uppercase leading-none">
                        Event Control
                    </h1>
                    <p className="text-lg text-white/40 max-w-xl font-light leading-relaxed">
                        Deploy your event assets to the global biometric mesh.
                        attendees will receive instant neural match notifications.
                    </p>
                </header>

                <div className="space-y-8">
                    {/* Uploader Hub */}
                    <div className="glass-card p-12 group hover:border-indigo-500/20 transition-all cursor-pointer relative overflow-hidden bg-white/[0.01]">
                        <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={onFileChange}
                            className="absolute inset-0 opacity-0 cursor-pointer z-10"
                        />
                        <div className="flex flex-col items-center gap-8 relative z-20">
                            <div className="w-24 h-24 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 group-hover:bg-indigo-500 group-hover:text-white transition-all duration-700 shadow-[0_0_40px_rgba(99,102,241,0.1)]">
                                <UploadCloud size={40} />
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-black uppercase italic tracking-tighter mb-2">
                                    {files.length > 0 ? `${files.length} Assets Loaded` : "Input Event Data"}
                                </p>
                                <p className="text-xs text-white/20 uppercase tracking-[0.3em] font-bold">
                                    Supported: RAW, JPG, PNG // Bulk enabled
                                </p>
                            </div>
                        </div>
                    </div>

                    {files.length > 0 && !uploading && (
                        <button
                            onClick={handleUpload}
                            className="w-full h-20 rounded-3xl bg-white text-black font-[900] text-xl uppercase italic tracking-tighter transition-all hover:bg-indigo-50 active:scale-[0.98] shadow-2xl flex items-center justify-center gap-4 group"
                        >
                            Execute Deployment
                            <Terminal size={24} className="group-hover:translate-x-2 transition-transform" />
                        </button>
                    )}

                    {uploading && (
                        <div className="glass-card p-10 space-y-6 bg-white/[0.02]">
                            <div className="flex justify-between items-end">
                                <div className="space-y-1">
                                    <span className="text-[10px] font-mono text-indigo-400 uppercase font-black tracking-widest">Provisioning Mesh</span>
                                    <h3 className="text-2xl font-black italic uppercase tracking-tighter">Indexing {progress}%</h3>
                                </div>
                                <Loader2 size={32} className="animate-spin text-white/20" />
                            </div>
                            <div className="h-4 w-full bg-white/5 rounded-full overflow-hidden p-1 border border-white/5">
                                <div
                                    className="h-full bg-indigo-500 rounded-full transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] shadow-[0_0_20px_rgba(99,102,241,0.8)]"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <div className="flex items-center gap-3 text-[10px] text-white/30 font-mono uppercase tracking-[0.2em]">
                                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-ping" />
                                Extracting 128D Face Encodings...
                            </div>
                        </div>
                    )}

                    {status && (
                        <div className={`p-8 rounded-[32px] border flex items-center gap-6 animate-fade-in ${status.type === 'success'
                                ? 'bg-green-500/5 border-green-500/20 text-green-400'
                                : 'bg-red-500/5 border-red-500/20 text-red-400'
                            }`}>
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${status.type === 'success' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                                {status.type === 'success' ? <CheckCircle size={24} /> : <AlertCircle size={24} />}
                            </div>
                            <p className="text-lg font-black italic uppercase tracking-tighter">{status.message}</p>
                        </div>
                    )}
                </div>

                {/* Dashboard Stats */}
                <div className="mt-20 grid grid-cols-2 gap-6 opacity-20">
                    <div className="glass-card p-6 border-white/5 space-y-2">
                        <p className="text-[9px] font-mono uppercase tracking-widest">Global Latency</p>
                        <p className="text-2xl font-black italic uppercase">12ms</p>
                    </div>
                    <div className="glass-card p-6 border-white/5 space-y-2">
                        <p className="text-[9px] font-mono uppercase tracking-widest">Secure Uplink</p>
                        <p className="text-2xl font-black italic uppercase items-center flex gap-3">Live <ShieldCheck size={20} className="text-green-500" /></p>
                    </div>
                </div>

                <footer className="mt-24 pt-12 border-t border-white/5 flex justify-between items-center text-white/10 font-mono text-[9px] uppercase tracking-[0.4em]">
                    <span>Node Cluster // Delta</span>
                    <span>vision rAG pipeline v1.0.4</span>
                </footer>
            </div>
        </main>
    );
}
