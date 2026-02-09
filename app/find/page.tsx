"use client";

import React, { useRef, useState, useCallback } from "react";
import Webcam from "react-webcam";
import axios from "axios";
import Link from "next/link";
import { ArrowLeft, Camera, RefreshCw, Download, Search, Scan, Sparkles, Crosshair, Cpu, ChevronRight } from "lucide-react";

const BACKEND_URL = "http://localhost:8000";

interface Photo {
    id: number;
    filename: string;
    filepath: string;
    event_id: string;
}

export default function FindPhotos() {
    const webcamRef = useRef<Webcam>(null);
    const [imgSrc, setImgSrc] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [photos, setPhotos] = useState<Photo[]>([]);
    const [searched, setSearched] = useState(false);
    const [scanProgress, setScanProgress] = useState(0);

    const handleSearch = async (base64Image: string) => {
        setLoading(true);
        setSearched(true);
        setPhotos([]);

        let p = 0;
        const interval = setInterval(() => {
            p += 5;
            setScanProgress(p);
            if (p >= 100) clearInterval(interval);
        }, 50);

        try {
            const res = await fetch(base64Image);
            const blob = await res.blob();
            const file = new File([blob], "selfie.jpg", { type: "image/jpeg" });

            const formData = new FormData();
            formData.append("file", file);

            const response = await axios.post(`${BACKEND_URL}/api/v1/search/`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            setPhotos(response.data);
        } catch (error) {
            console.error("Search error:", error);
        } finally {
            setTimeout(() => {
                setLoading(false);
                setScanProgress(0);
            }, 1800);
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

    const retake = () => {
        setImgSrc(null);
        setSearched(false);
        setPhotos([]);
    };

    return (
        <main className="min-h-screen bg-[#000] text-white selection:bg-indigo-500/30 overflow-x-hidden font-sans">
            {/* Visionary Mesh Background */}
            <div className="mesh-container">
                <div className="mesh-sphere w-[50%] h-[50%] top-0 -left-[10%] bg-indigo-600/20" />
                <div className="mesh-sphere w-[40%] h-[40%] bottom-0 -right-[10%] bg-purple-600/10" style={{ animationDelay: '-8s' }} />
            </div>

            <nav className="relative z-10 p-8 flex justify-between items-center max-w-7xl mx-auto border-b border-white/5">
                <Link href="/" className="group flex items-center gap-3 text-white/40 hover:text-white transition-all uppercase tracking-[0.2em] font-black text-xs">
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    Disconnect Node
                </Link>
                <div className="hidden md:flex glass-card px-4 py-2 items-center gap-3 border-white/5 bg-white/[0.02]">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/40">Secure Uplink: Stable</span>
                </div>
            </nav>

            <div className="relative z-10 max-w-7xl mx-auto px-6 pt-16 pb-24">
                <div className="grid lg:grid-cols-2 gap-24 items-start">

                    {/* Capture Section */}
                    <section className="animate-fade-in space-y-10">
                        <header>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-6 font-mono text-[10px] uppercase text-indigo-400 font-black tracking-widest">
                                <Cpu size={12} /> Biometric Input 01
                            </div>
                            <h1 className="text-6xl font-[1000] tracking-tighter mb-4 italic uppercase leading-tight">
                                Neural <br /> Retrieval
                            </h1>
                            <p className="text-white/40 leading-relaxed font-light text-xl max-w-lg">
                                Deploying 128-dimensional Vision RAG to index your face embeddings against global event archives.
                            </p>
                        </header>

                        <div className="glass-card overflow-hidden p-4 group shadow-[0_0_80px_rgba(99,102,241,0.1)] border-white/10 relative max-w-md mx-auto lg:mx-0">
                            <div className="aspect-[3/4] rounded-[24px] overflow-hidden bg-white/5 relative group">
                                {!imgSrc ? (
                                    <>
                                        <Webcam
                                            audio={false}
                                            ref={webcamRef}
                                            screenshotFormat="image/jpeg"
                                            className="w-full h-full object-cover scale-x-[-1]"
                                            videoConstraints={{ facingMode: "user" }}
                                        />

                                        <div className="absolute inset-0 border-[20px] border-black/20 pointer-events-none" />
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                            <Crosshair size={40} className="text-indigo-400 opacity-30" />
                                        </div>
                                        <div className="absolute top-8 left-8 flex flex-col gap-1 pointer-events-none">
                                            <div className="w-8 h-px bg-indigo-500/50" />
                                            <div className="h-8 w-px bg-indigo-500/50" />
                                        </div>
                                        <div className="absolute bottom-8 right-8 flex flex-col gap-1 pointer-events-none items-end justify-end">
                                            <div className="h-8 w-px bg-indigo-500/50" />
                                            <div className="w-8 h-px bg-indigo-500/50" />
                                        </div>

                                        <div className="absolute inset-x-8 top-12 flex justify-between pointer-events-none opacity-40">
                                            <span className="text-[9px] font-mono text-white/60 tracking-widest uppercase">Target Lock: Active</span>
                                            <span className="text-[9px] font-mono text-white/60 tracking-widest uppercase">32ms</span>
                                        </div>

                                        <div className="absolute inset-0 pointer-events-none">
                                            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent shadow-[0_0_25px_rgba(99,102,241,1)] animate-scan" />
                                        </div>

                                        <div className="absolute bottom-12 left-1/2 -translate-x-1/2">
                                            <button
                                                onClick={capture}
                                                className="w-24 h-24 rounded-full bg-white flex items-center justify-center text-black hover:scale-110 active:scale-95 transition-all shadow-[0_0_40px_rgba(255,255,255,0.4)] group overflow-hidden relative"
                                            >
                                                <div className="absolute inset-0 bg-indigo-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500" />
                                                <Camera size={44} className="relative group-hover:text-white transition-colors" />
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="relative h-full w-full">
                                        <img src={imgSrc} alt="Selfie" className="w-full h-full object-cover grayscale brightness-50 contrast-125 transition-all duration-1000" />
                                        {loading && (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-3xl transition-all">
                                                <div className="mb-10 relative">
                                                    <div className="w-32 h-32 border border-indigo-500/10 rounded-full animate-ping" />
                                                    <div className="absolute inset-0 border-t-2 border-indigo-500 rounded-full animate-spin" />
                                                    <div className="absolute inset-4 border-b-2 border-purple-500 rounded-full animate-spin-reverse opacity-50" />
                                                </div>
                                                <div className="text-center space-y-3">
                                                    <p className="text-xs font-black tracking-[0.5em] text-indigo-400 uppercase">Indexing Embeddings</p>
                                                    <p className="text-[10px] text-white/20 font-mono italic">Synchronizing Node Cluster: {scanProgress}%</p>
                                                </div>
                                            </div>
                                        )}
                                        {!loading && (
                                            <button
                                                onClick={retake}
                                                className="absolute bottom-12 left-1/2 -translate-x-1/2 px-10 py-5 rounded-full bg-white/5 backdrop-blur-2xl border border-white/10 text-white flex items-center gap-4 hover:bg-white/10 transition-all font-black uppercase tracking-[0.3em] text-[10px]"
                                            >
                                                <RefreshCw size={18} />
                                                New Acquisition
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* Results Section */}
                    <section className="min-h-[600px] lg:pl-12">
                        {searched && !loading ? (
                            <div className="animate-fade-in space-y-12">
                                <header className="flex justify-between items-end border-b border-white/5 pb-10">
                                    <div>
                                        <h2 className="text-4xl font-[1000] italic tracking-tighter uppercase mb-2">Verified Matches</h2>
                                        <p className="text-xs text-indigo-400 font-black tracking-[0.3em] uppercase opacity-60">{photos.length} Biometric Occurrences Detected</p>
                                    </div>
                                    <div className="glass-card p-4 border-indigo-500/20 bg-indigo-500/5">
                                        <Sparkles className="text-indigo-400" size={28} />
                                    </div>
                                </header>

                                {photos.length > 0 ? (
                                    <div className="grid grid-cols-2 gap-8">
                                        {photos.map((photo, i) => (
                                            <div key={photo.id} style={{ animationDelay: `${i * 150}ms` }} className="animate-fade-in group relative aspect-[3/4] rounded-[40px] overflow-hidden glass-card p-2 border-white/5 glass-card-hover">
                                                <div className="h-full w-full rounded-[32px] overflow-hidden relative">
                                                    <img
                                                        src={`${BACKEND_URL}/static/${photo.filename}`}
                                                        alt="Match"
                                                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-125"
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-8">
                                                        <div className="mb-6 space-y-1">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,1)]" />
                                                                <span className="text-[10px] font-black font-mono text-indigo-400 uppercase tracking-widest">Biometric Match</span>
                                                            </div>
                                                            <p className="text-2xl font-[1000] italic text-white uppercase tracking-tighter">HD Asset</p>
                                                        </div>
                                                        <a
                                                            href={`${BACKEND_URL}/static/${photo.filename}`}
                                                            target="_blank"
                                                            className="w-full py-5 bg-white text-black font-black uppercase text-[11px] tracking-[0.2em] rounded-2xl text-center flex items-center justify-center gap-3 hover:bg-neutral-200 transition-all active:scale-95"
                                                        >
                                                            <Download size={16} />
                                                            Download RAW
                                                        </a>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="glass-card h-[400px] flex flex-col items-center justify-center text-center p-16 border-dashed border-white/10 opacity-30">
                                        <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-8">
                                            <Search size={32} className="text-white/40" />
                                        </div>
                                        <h3 className="text-2xl font-black uppercase tracking-tighter mb-3 italic">Index Empty</h3>
                                        <p className="text-lg text-white/40 max-w-[280px] leading-relaxed font-light">The neural crawler processed the archive but couldn't verify your feature set.</p>
                                    </div>
                                )}
                            </div>
                        ) : !searched ? (
                            <div className="h-full flex flex-col items-center justify-center text-center py-40 space-y-8 opacity-[0.05] group">
                                <div className="relative">
                                    <Scan size={120} className="stroke-[0.5px] animate-pulse" />
                                    <div className="absolute inset-0 bg-indigo-500 blur-[100px] rounded-full opacity-20" />
                                </div>
                                <p className="text-sm uppercase tracking-[0.8em] font-black">Standby for Signal</p>
                            </div>
                        ) : null}
                    </section>
                </div>

                <footer className="mt-32 pt-16 border-t border-white/5 flex flex-wrap gap-12 justify-between items-center text-white/20 font-mono text-[10px] uppercase tracking-[0.5em]">
                    <span className="flex items-center gap-3"><div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(99,102,241,0.5)]" /> Neural Mesh: Active</span>
                    <span className="hidden md:block">Latent Space: 128D Embeddings</span>
                    <span>© NEURAL ARCHITECTURE OSS 2026</span>
                </footer>
            </div>
        </main>
    );
}
