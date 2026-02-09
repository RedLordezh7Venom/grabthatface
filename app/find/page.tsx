"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import Webcam from "react-webcam";
import axios from "axios";
import Link from "next/link";
import { ArrowLeft, Camera, RefreshCw, Download, Search, Scan, UserCheck, Sparkles } from "lucide-react";

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
    const [scanActive, setScanActive] = useState(true);

    const handleSearch = async (base64Image: string) => {
        setLoading(true);
        setSearched(true);
        setPhotos([]);

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
            setLoading(false);
        }
    };

    const capture = useCallback(() => {
        if (webcamRef.current) {
            const imageSrc = webcamRef.current.getScreenshot();
            if (imageSrc) {
                setImgSrc(imageSrc);
                setScanActive(false);
                handleSearch(imageSrc);
            }
        }
    }, [webcamRef]);

    const retake = () => {
        setImgSrc(null);
        setSearched(false);
        setPhotos([]);
        setScanActive(true);
    };

    return (
        <main className="min-h-screen bg-black text-white selection:bg-indigo-500/30 overflow-x-hidden">
            {/* Background Atmosphere */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[20%] -left-[10%] w-[50%] h-[50%] bg-indigo-500/10 blur-[150px] rounded-full animate-pulse" />
                <div className="absolute bottom-0 -right-[10%] w-[40%] h-[40%] bg-purple-500/5 blur-[120px] rounded-full" />
            </div>

            <nav className="relative z-10 p-6 flex justify-between items-center max-w-7xl mx-auto">
                <Link href="/" className="group flex items-center gap-2 text-white/50 hover:text-white transition-all">
                    <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm font-medium">Exit Search</span>
                </Link>
                <div className="flex items-center gap-4">
                    <div className="glass-card px-3 py-1 flex items-center gap-2 border-white/5">
                        <Scan size={12} className="text-indigo-400" />
                        <span className="text-[10px] font-mono uppercase tracking-widest text-white/40">Biometric Scan Active</span>
                    </div>
                </div>
            </nav>

            <div className="relative z-10 max-w-5xl mx-auto px-6 pt-8 pb-24">
                <div className="grid lg:grid-cols-2 gap-12 items-start">

                    {/* Neural Capture Section */}
                    <section className="animate-fade-in">
                        <div className="mb-8">
                            <h1 className="text-4xl font-bold tracking-tight mb-2 flex items-center gap-3">
                                <Sparkles className="text-indigo-400" size={28} />
                                Neural Finder
                            </h1>
                            <p className="text-white/40 leading-relaxed font-light">
                                Take a high-resolution selfie. Our Vision RAG engine will crawl the event index for biometric matches.
                            </p>
                        </div>

                        <div className="glass-card overflow-hidden p-2 group shadow-2xl shadow-indigo-500/5 relative">
                            <div className="aspect-[4/5] rounded-[18px] overflow-hidden bg-white/5 relative">
                                {!imgSrc ? (
                                    <>
                                        <Webcam
                                            audio={false}
                                            ref={webcamRef}
                                            screenshotFormat="image/jpeg"
                                            className="w-full h-full object-cover scale-x-[-1]"
                                            videoConstraints={{ facingMode: "user" }}
                                        />
                                        {/* Scanning Overlay Animation */}
                                        <div className="absolute inset-0 pointer-events-none">
                                            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-indigo-400 to-transparent shadow-[0_0_15px_rgba(99,102,241,1)] animate-[scan_2s_ease-in-out_infinite]" />
                                        </div>
                                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4">
                                            <button
                                                onClick={capture}
                                                className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-black hover:scale-110 active:scale-95 transition-all shadow-xl shadow-white/20"
                                            >
                                                <Camera size={32} />
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="relative h-full w-full">
                                        <img src={imgSrc} alt="Selfie" className="w-full h-full object-cover grayscale opacity-50" />
                                        {loading && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                                                <div className="flex flex-col items-center gap-6">
                                                    <div className="w-12 h-12 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                                                    <p className="text-xs font-mono tracking-[0.2em] text-indigo-400 uppercase">Synchronizing Nodes</p>
                                                </div>
                                            </div>
                                        )}
                                        {!loading && (
                                            <button
                                                onClick={retake}
                                                className="absolute bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white flex items-center gap-2 hover:bg-white/20 transition-all text-sm font-medium"
                                            >
                                                <RefreshCw size={16} />
                                                New Scan
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* Results Pipeline */}
                    <section className="min-h-[400px]">
                        {searched && !loading ? (
                            <div className="animate-fade-in">
                                <header className="mb-8 flex justify-between items-end border-b border-white/5 pb-6">
                                    <div>
                                        <h2 className="text-2xl font-semibold mb-1">Retrieval Results</h2>
                                        <p className="text-sm text-white/30 font-mono italic">Found {photos.length} biometric occurrences</p>
                                    </div>
                                    <UserCheck className="text-indigo-400 mb-2" size={24} />
                                </header>

                                {photos.length > 0 ? (
                                    <div className="grid grid-cols-2 gap-4">
                                        {photos.map((photo, i) => (
                                            <div key={photo.id} style={{ animationDelay: `${i * 100}ms` }} className="animate-fade-in group relative aspect-[3/4] rounded-2xl overflow-hidden glass-card p-1">
                                                <div className="h-full w-full rounded-[14px] overflow-hidden relative">
                                                    <img
                                                        src={`${BACKEND_URL}/static/${photo.filename}`}
                                                        alt="Match"
                                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                                                        <a
                                                            href={`${BACKEND_URL}/static/${photo.filename}`}
                                                            target="_blank"
                                                            className="w-full py-2 bg-white text-black font-semibold rounded-xl text-center flex items-center justify-center gap-2 hover:bg-indigo-50 active:scale-95 transition-all text-xs"
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
                                    <div className="glass-card h-64 flex flex-col items-center justify-center text-center p-8 border-dashed border-white/5">
                                        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4">
                                            <Search size={20} className="text-white/20" />
                                        </div>
                                        <h3 className="text-lg font-medium mb-1">Zero Matches</h3>
                                        <p className="text-xs text-white/30 max-w-[200px]">The neural engine couldn't verify your feature set in the current index.</p>
                                    </div>
                                )}
                            </div>
                        ) : !searched ? (
                            <div className="h-full flex flex-col items-center justify-center text-center opacity-20 mt-20">
                                <Scan size={48} className="mb-4 stroke-[1px]" />
                                <p className="text-sm uppercase tracking-[0.3em] font-mono">Standby for Biometric Input</p>
                            </div>
                        ) : null}
                    </section>
                </div>

                <footer className="mt-24 pt-10 border-t border-white/5 flex justify-between items-center text-white/20 font-mono text-[10px] uppercase tracking-[0.2em]">
                    <span>Neural Crawler Node 4.2</span>
                    <span>Precision Recall Mode</span>
                    <span>OSS License 2026</span>
                </footer>
            </div>

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
