"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import Webcam from "react-webcam";
import axios from "axios";
import Link from "next/link";
import { ArrowLeft, Camera, RefreshCw, Download, Search, Scan, UserCheck, Sparkles, ShieldCheck, Zap } from "lucide-react";

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

        // Simulating biometric scan progress for "wow" factor
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
            // Non-blocking notification or alert preferred, but staying simple
        } finally {
            setTimeout(() => {
                setLoading(false);
                setScanProgress(0);
            }, 1500);
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
        <main className="min-h-screen bg-[#030303] text-white selection:bg-indigo-500/30 overflow-x-hidden">
            {/* Background Atmosphere */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[20%] -left-[10%] w-[50%] h-[50%] bg-indigo-500/10 blur-[150px] rounded-full animate-pulse" />
                <div className="absolute bottom-0 -right-[10%] w-[40%] h-[40%] bg-purple-500/5 blur-[120px] rounded-full" />
            </div>

            <nav className="relative z-10 p-6 flex justify-between items-center max-w-7xl mx-auto">
                <Link href="/" className="group flex items-center gap-3 text-white/50 hover:text-white transition-all">
                    <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm font-bold tracking-tighter uppercase">Exit Neural Node</span>
                </Link>
                <div className="flex gap-4">
                    <div className="hidden md:flex glass-card px-4 py-1.5 items-center gap-2 border-white/5">
                        <ShieldCheck size={14} className="text-green-400" />
                        <span className="text-[10px] font-mono uppercase tracking-widest text-white/40">Encryption active</span>
                    </div>
                </div>
            </nav>

            <div className="relative z-10 max-w-6xl mx-auto px-6 pt-12 pb-24">
                <div className="grid lg:grid-cols-2 gap-16 items-start">

                    {/* Capture Section */}
                    <section className="animate-fade-in space-y-8">
                        <div>
                            <h1 className="text-5xl font-black tracking-tighter mb-4 flex items-center gap-4 italic uppercase">
                                <Scan className="text-indigo-500" size={40} strokeWidth={3} />
                                Neural Finder
                            </h1>
                            <p className="text-white/40 leading-relaxed font-light text-lg">
                                Deploying Vision RAG to index 128D face embeddings.
                                Find your <span className="text-indigo-400 font-medium">Main Character</span> moments in sub-second latency.
                            </p>
                        </div>

                        <div className="glass-card overflow-hidden p-3 group shadow-2xl shadow-indigo-500/5 border-white/10 relative max-w-md mx-auto lg:mx-0">
                            <div className="aspect-[4/5] rounded-[20px] overflow-hidden bg-white/5 relative">
                                {!imgSrc ? (
                                    <>
                                        <Webcam
                                            audio={false}
                                            ref={webcamRef}
                                            screenshotFormat="image/jpeg"
                                            className="w-full h-full object-cover scale-x-[-1]"
                                            videoConstraints={{ facingMode: "user" }}
                                        />
                                        {/* HUD Elements */}
                                        <div className="absolute inset-x-0 top-0 p-6 flex justify-between items-start pointer-events-none">
                                            <div className="w-12 h-12 border-l-2 border-t-2 border-indigo-500/50" />
                                            <div className="w-12 h-12 border-r-2 border-t-2 border-indigo-500/50" />
                                        </div>
                                        <div className="absolute inset-x-0 bottom-0 p-6 flex justify-between items-end pointer-events-none">
                                            <div className="w-12 h-12 border-l-2 border-b-2 border-indigo-500/50" />
                                            <div className="w-12 h-12 border-r-2 border-b-2 border-indigo-500/50" />
                                        </div>

                                        <div className="absolute inset-0 pointer-events-none">
                                            <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-transparent via-indigo-400 to-transparent shadow-[0_0_20px_rgba(99,102,241,1)] animate-[scan_2.5s_ease-in-out_infinite]" />
                                        </div>

                                        <div className="absolute bottom-10 left-1/2 -translate-x-1/2">
                                            <button
                                                onClick={capture}
                                                className="w-20 h-20 rounded-full bg-white flex items-center justify-center text-black hover:scale-110 active:scale-95 transition-all shadow-[0_0_30px_rgba(255,255,255,0.4)] group"
                                            >
                                                <Camera size={40} className="group-hover:rotate-12 transition-transform" />
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="relative h-full w-full">
                                        <img src={imgSrc} alt="Selfie" className="w-full h-full object-cover grayscale brightness-75 transition-all duration-1000" />
                                        {loading && (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-xl transition-all">
                                                <div className="mb-8 relative">
                                                    <div className="w-24 h-24 border-2 border-indigo-500/20 rounded-full animate-ping" />
                                                    <div className="absolute inset-0 border-t-2 border-indigo-500 rounded-full animate-spin" />
                                                </div>
                                                <div className="text-center space-y-2">
                                                    <p className="text-xs font-mono tracking-[0.4em] text-indigo-400 uppercase font-bold">Matching Biometrics</p>
                                                    <p className="text-[10px] text-white/30 font-mono italic">Iteration {scanProgress}% complete</p>
                                                </div>
                                            </div>
                                        )}
                                        {!loading && (
                                            <button
                                                onClick={retake}
                                                className="absolute bottom-10 left-1/2 -translate-x-1/2 px-8 py-4 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 text-white flex items-center gap-3 hover:bg-white/20 transition-all font-bold uppercase tracking-widest text-xs"
                                            >
                                                <RefreshCw size={16} />
                                                Restart Node
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* Results Section */}
                    <section className="min-h-[500px] lg:border-l lg:border-white/5 lg:pl-16">
                        {searched && !loading ? (
                            <div className="animate-fade-in space-y-8">
                                <header className="flex justify-between items-end border-b border-white/5 pb-8">
                                    <div>
                                        <h2 className="text-3xl font-black italic tracking-tighter uppercase mb-2">Retrievals</h2>
                                        <p className="text-sm text-indigo-400/60 font-mono tracking-wide">FOUND {photos.length} BIOMETRIC SIGHTINGS</p>
                                    </div>
                                    <div className="glass-card p-3 border-indigo-500/20">
                                        <Zap className="text-indigo-400" size={24} />
                                    </div>
                                </header>

                                {photos.length > 0 ? (
                                    <div className="grid grid-cols-2 gap-6">
                                        {photos.map((photo, i) => (
                                            <div key={photo.id} style={{ animationDelay: `${i * 150}ms` }} className="animate-fade-in group relative aspect-[3/4] rounded-3xl overflow-hidden glass-card p-1.5 border-white/5 hover:border-indigo-500/30 transition-all">
                                                <div className="h-full w-full rounded-[22px] overflow-hidden relative">
                                                    <img
                                                        src={`${BACKEND_URL}/static/${photo.filename}`}
                                                        alt="Match"
                                                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-125 group-hover:rotate-3"
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-6">
                                                        <div className="mb-4 space-y-1">
                                                            <p className="text-[10px] font-mono text-indigo-400 uppercase font-bold tracking-[0.2em]">Match Verified</p>
                                                            <p className="text-lg font-black italic text-white uppercase tracking-tighter">HD Original</p>
                                                        </div>
                                                        <a
                                                            href={`${BACKEND_URL}/static/${photo.filename}`}
                                                            target="_blank"
                                                            className="w-full py-4 bg-white text-black font-black uppercase text-[10px] tracking-widest rounded-xl text-center flex items-center justify-center gap-2 hover:bg-white/90 active:scale-95 transition-all"
                                                        >
                                                            <Download size={14} />
                                                            Download HD
                                                        </a>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="glass-card h-80 flex flex-col items-center justify-center text-center p-12 border-dashed border-white/10">
                                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-6">
                                            <Search size={28} className="text-white/20" />
                                        </div>
                                        <h3 className="text-xl font-black uppercase tracking-tighter mb-2 italic">Zero Sightings</h3>
                                        <p className="text-sm text-white/30 max-w-[240px] leading-relaxed">The neural crawler processed the archive but couldn't verify your feature set.</p>
                                    </div>
                                )}
                            </div>
                        ) : !searched ? (
                            <div className="h-full flex flex-col items-center justify-center text-center py-32 space-y-6 opacity-30">
                                <div className="relative">
                                    <Scan size={80} className="stroke-[1px] animate-pulse" />
                                    <div className="absolute inset-0 bg-indigo-500 blur-3xl opacity-20" />
                                </div>
                                <p className="text-sm uppercase tracking-[0.5em] font-mono font-bold">Scanning mode ready</p>
                            </div>
                        ) : null}
                    </section>
                </div>

                <footer className="mt-24 pt-12 border-t border-white/5 flex flex-wrap gap-8 justify-between items-center text-white/20 font-mono text-[9px] uppercase tracking-[0.4em]">
                    <span className="flex items-center gap-2"><div className="w-1 h-1 bg-green-500 rounded-full animate-pulse" /> Neural Pipeline Online</span>
                    <span>Precision: 128D Embeddings</span>
                    <span>© GrabThatFace OSS 2026</span>
                </footer>
            </div>

            <style jsx global>{`
                @keyframes scan {
                    0% { top: 0; opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { top: 100%; opacity: 0; }
                }
            `}</style>
        </main>
    );
}
