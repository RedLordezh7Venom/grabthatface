"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import Webcam from "react-webcam";
import axios from "axios";
import Link from "next/link";
import { ArrowLeft, Camera, RefreshCw, Download, Search, Scan, UserCheck, Sparkles, Binary, Zap, Eye } from "lucide-react";

const BACKEND_URL = "http://localhost:8000";

interface Occurence {
    id: number;
    filename: string;
    filepath: string;
    event_id: string;
}

export default function PatternMatcher() {
    const webcamRef = useRef<Webcam>(null);
    const [imgSrc, setImgSrc] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [matches, setMatches] = useState<Occurence[]>([]);
    const [scanned, setScanned] = useState(false);

    const handleSearch = async (base64Image: string) => {
        setLoading(true);
        setScanned(true);
        setMatches([]);

        try {
            const res = await fetch(base64Image);
            const blob = await res.blob();
            const file = new File([blob], "pattern_query.jpg", { type: "image/jpeg" });

            const formData = new FormData();
            formData.append("file", file);

            const response = await axios.post(`${BACKEND_URL}/api/v1/search/`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            setMatches(response.data);
        } catch (error) {
            console.error("Pattern Analysis error:", error);
        } finally {
            setLoading(false);
        }
    };

    const capture = useCallback(() => {
        if (webcamRef.current) {
            const imageSrc = webcamRef.current.getScreenshot();
            if (imageSrc) {
                setImgSrc(imageSrc);
                handleSearch(imageSrc);
            }
        }
    }, [webcamRef]);

    const rescan = () => {
        setImgSrc(null);
        setScanned(false);
        setMatches([]);
    };

    return (
        <main className="min-h-screen bg-[#020617] text-slate-100 selection:bg-cyan-500/30 overflow-x-hidden data-grid">
            {/* Intelligence Grid Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[20%] -left-[10%] w-[50%] h-[50%] bg-cyan-500/5 blur-[150px] rounded-full animate-data-flicker" />
                <div className="absolute bottom-0 -right-[10%] w-[40%] h-[40%] bg-blue-500/5 blur-[120px] rounded-full" />
            </div>

            <nav className="relative z-10 p-6 flex justify-between items-center max-w-7xl mx-auto">
                <Link href="/" className="group flex items-center gap-2 text-slate-500 hover:text-cyan-400 transition-all">
                    <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm font-mono uppercase tracking-widest">Exit Intelligence Portal</span>
                </Link>
                <div className="flex items-center gap-4">
                    <div className="glass-card px-3 py-1.5 flex items-center gap-2 border-cyan-500/20 bg-cyan-500/5">
                        <Scan size={12} className="text-cyan-400" />
                        <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-cyan-400/80">Vector Field Active</span>
                    </div>
                </div>
            </nav>

            <div className="relative z-10 max-w-6xl mx-auto px-6 pt-8 pb-24">
                <div className="grid lg:grid-cols-2 gap-16 items-start">

                    {/* Pattern Capture Section */}
                    <section className="animate-fade-in">
                        <div className="mb-10">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                                    <Binary size={20} className="text-cyan-400" />
                                </div>
                                <h1 className="text-3xl font-bold tracking-tight">Pattern Matcher</h1>
                            </div>
                            <p className="text-slate-400 leading-relaxed font-light">
                                Query our biometric archive to find recurring visual signatures across TikTok, Reels, and App Store creatives. Detect influencer saturation and content clones in real-time.
                            </p>
                        </div>

                        <div className="glass-card overflow-hidden p-3 group shadow-2xl relative">
                            <div className="aspect-[4/5] rounded-[14px] overflow-hidden bg-slate-900 relative">
                                {!imgSrc ? (
                                    <>
                                        <Webcam
                                            audio={false}
                                            ref={webcamRef}
                                            screenshotFormat="image/jpeg"
                                            className="w-full h-full object-cover grayscale opacity-80"
                                            videoConstraints={{ facingMode: "user" }}
                                        />
                                        {/* Scanning Overlay */}
                                        <div className="absolute inset-0 pointer-events-none">
                                            <div className="absolute top-0 left-0 w-full h-[1px] bg-cyan-400/50 shadow-[0_0_15px_rgba(6,182,212,0.8)] animate-[scan_3s_ease-in-out_infinite]" />
                                            <div className="absolute inset-0 border-[20px] border-[#020617]/40" />
                                        </div>
                                        <div className="absolute bottom-10 left-1/2 -translate-x-1/2">
                                            <button
                                                onClick={capture}
                                                className="w-20 h-20 rounded-full bg-cyan-500 flex items-center justify-center text-[#020617] hover:scale-110 active:scale-95 transition-all shadow-[0_0_30px_rgba(6,182,212,0.4)] group"
                                            >
                                                <Zap size={36} fill="currentColor" />
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="relative h-full w-full">
                                        <img src={imgSrc} alt="Pattern Query" className="w-full h-full object-cover grayscale opacity-40 blur-[2px]" />
                                        {loading && (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="flex flex-col items-center gap-6">
                                                    <div className="w-16 h-16 border-b-2 border-cyan-500 rounded-full animate-spin" />
                                                    <p className="text-[10px] font-mono tracking-[0.3em] text-cyan-400 uppercase">Neural Processing...</p>
                                                </div>
                                            </div>
                                        )}
                                        {!loading && (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 p-8 text-center bg-[#020617]/60 backdrop-blur-md">
                                                <div className="text-cyan-400 p-4 border border-cyan-500/20 rounded-2xl bg-cyan-500/5">
                                                    <Eye size={40} />
                                                </div>
                                                <h3 className="text-xl font-bold">Query Synchronized</h3>
                                                <button
                                                    onClick={rescan}
                                                    className="px-8 py-3 rounded-full bg-cyan-500 text-[#020617] font-bold hover:bg-cyan-400 transition-all text-sm uppercase tracking-widest"
                                                >
                                                    New Pattern Analysis
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* Retrieval Pipeline */}
                    <section className="min-h-[500px]">
                        {scanned && !loading ? (
                            <div className="animate-fade-in">
                                <header className="mb-10 flex justify-between items-end border-b border-slate-800 pb-6">
                                    <div>
                                        <h2 className="text-xl font-bold mb-1 uppercase tracking-tighter">Matched Signatures</h2>
                                        <p className="text-xs text-slate-500 font-mono italic">{matches.length} occurences detected in dataset</p>
                                    </div>
                                    <Binary className="text-cyan-400 mb-2" size={24} />
                                </header>

                                {matches.length > 0 ? (
                                    <div className="grid grid-cols-2 gap-4">
                                        {matches.map((match, i) => (
                                            <div key={match.id} style={{ animationDelay: `${i * 80}ms` }} className="animate-fade-in group relative aspect-[3/4] rounded-xl overflow-hidden glass-card p-1">
                                                <div className="h-full w-full rounded-[10px] overflow-hidden relative">
                                                    <img
                                                        src={`${BACKEND_URL}/static/${match.filename}`}
                                                        alt="Match"
                                                        className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-110"
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-cyan-950/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                                                        <a
                                                            href={`${BACKEND_URL}/static/${match.filename}`}
                                                            target="_blank"
                                                            className="w-full py-2 bg-cyan-500 text-[#020617] font-bold rounded-lg text-center flex items-center justify-center gap-2 hover:bg-cyan-400 active:scale-95 transition-all text-xs"
                                                        >
                                                            <Download size={14} />
                                                            EXPORT DATA
                                                        </a>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="glass-card h-64 flex flex-col items-center justify-center text-center p-8 border-dashed border-slate-800">
                                        <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center mb-4">
                                            <Search size={20} className="text-slate-600" />
                                        </div>
                                        <h3 className="text-lg font-medium mb-1 text-slate-300">No Signatures Detected</h3>
                                        <p className="text-xs text-slate-500 max-w-[240px]">The engine could not verify this visual pattern in the current market index.</p>
                                    </div>
                                )}
                            </div>
                        ) : !scanned ? (
                            <div className="h-full flex flex-col items-center justify-center text-center opacity-10 mt-20">
                                <Scan size={64} className="mb-6 stroke-[1px]" />
                                <p className="text-sm uppercase tracking-[0.4em] font-mono">Standby for Pattern Input</p>
                            </div>
                        ) : null}
                    </section>
                </div>
            </div>

            <footer className="mt-24 pt-10 border-t border-slate-800 flex justify-between items-center text-slate-600 font-mono text-[10px] uppercase tracking-[0.2em]">
                <span>Neural Crawler Node 4.2</span>
                <span>Precision Recall Mode</span>
                <span>OSS License 2026</span>
            </footer>

            <style jsx global>{`
                @keyframes scan {
                    0% { top: 0; }
                    50% { top: 100%; }
                    100% { top: 0; }
                }
            `}</style>
        </main>
    );
}
