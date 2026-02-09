"use client";

import React, { useState, useCallback } from "react";
import axios from "axios";
import Link from "next/link";
import { ArrowLeft, UploadCloud, CheckCircle, AlertCircle, Image as ImageIcon, Loader2 } from "lucide-react";

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
            formData.append("event_id", "live-event-01");

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
            message: `Successfully processed ${successCount} photos. ${errorCount > 0 ? `${errorCount} failed.` : ""}`
        });
        setFiles([]);
    };

    return (
        <main className="min-h-screen bg-black text-white selection:bg-indigo-500/30">
            {/* Background Glow */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full" />
                <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full" />
            </div>

            <nav className="relative z-10 p-6 flex justify-between items-center max-w-7xl mx-auto">
                <Link href="/" className="group flex items-center gap-2 text-white/50 hover:text-white transition-all">
                    <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm font-medium">Exit Dashboard</span>
                </Link>
                <div className="h-8 w-[1px] bg-white/10 mx-4" />
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs font-mono text-white/40 uppercase tracking-widest">System Active</span>
                </div>
            </nav>

            <div className="relative z-10 max-w-2xl mx-auto px-6 pt-12 pb-24 animate-fade-in">
                <header className="mb-12">
                    <h1 className="text-4xl font-bold tracking-tight mb-3">Event Command</h1>
                    <p className="text-lg text-white/50 leading-relaxed">
                        Deploy your event photos to the Vision RAG engine.
                        Faces are indexed in real-time for instant discovery.
                    </p>
                </header>

                <div className="space-y-6">
                    <div className="glass-card p-10 group hover:border-white/20 transition-all cursor-pointer relative overflow-hidden">
                        <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={onFileChange}
                            className="absolute inset-0 opacity-0 cursor-pointer z-10"
                        />
                        <div className="flex flex-col items-center gap-6">
                            <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                                <UploadCloud size={32} className="text-indigo-400" />
                            </div>
                            <div className="text-center">
                                <p className="text-xl font-semibold mb-1">
                                    {files.length > 0 ? `${files.length} Photos Prepared` : "Drop Event Photos"}
                                </p>
                                <p className="text-sm text-white/30 lowercase tracking-wide">
                                    Supports High-Res JPG & PNG
                                </p>
                            </div>
                        </div>
                    </div>

                    {files.length > 0 && !uploading && (
                        <button
                            onClick={handleUpload}
                            className="w-full h-16 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-lg transition-all active:scale-[0.98] shadow-lg shadow-indigo-500/20"
                        >
                            Sync to Neural Index
                        </button>
                    )}

                    {uploading && (
                        <div className="glass-card p-8 space-y-4">
                            <div className="flex justify-between text-sm font-mono tracking-tighter">
                                <span className="text-white/40 uppercase">Processing Neural Pipeline</span>
                                <span className="text-indigo-400">{progress}%</span>
                            </div>
                            <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-indigo-500 transition-all duration-500 ease-out shadow-[0_0_15px_rgba(99,102,241,0.5)]"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <div className="flex items-center gap-2 text-xs text-white/30 animate-pulse">
                                <Loader2 size={12} className="animate-spin" />
                                <span>Extracting Biometric Features...</span>
                            </div>
                        </div>
                    )}

                    {status && (
                        <div className={`p-6 rounded-2xl border flex items-center gap-4 animate-fade-in ${status.type === 'success'
                                ? 'bg-green-500/10 border-green-500/20 text-green-400'
                                : 'bg-red-500/10 border-red-500/20 text-red-400'
                            }`}>
                            {status.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                            <p className="text-sm font-medium">{status.message}</p>
                        </div>
                    )}
                </div>

                <footer className="mt-20 pt-10 border-t border-white/5 flex justify-between items-center text-white/20 font-mono text-[10px] uppercase tracking-[0.2em]">
                    <span>Vision RAG Node v1.0</span>
                    <span>GrabThatFace OSS</span>
                </footer>
            </div>
        </main>
    );
}
