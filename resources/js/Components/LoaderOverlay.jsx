/**
 * LoaderOverlay — overlay loading profesional di tengah layar.
 * Props:
 *  - show: boolean
 *  - message: string (opsional)
 *  - subMessage: string (opsional)
 */
export default function LoaderOverlay({
    show,
    message = "Sedang memproses...",
    subMessage,
    type = "default",
    progress,
}) {
    if (!show) return null;

    const isExport = type === "export";
    const total = Number(progress?.total) || 0;
    const processed = Number(progress?.processed) || 0;
    const percentage = total > 0 ? Math.min(Math.round((processed / total) * 100), 100) : 0;
    const formatBytes = (bytes) => {
        if (bytes === 0) return "0 KB";
        if (bytes < 1024 * 1024) {
            return `${Math.max(1, Math.round(bytes / 1024))} KB`;
        }

        return `${(bytes / (1024 * 1024)).toLocaleString("id-ID", {
            maximumFractionDigits: 1,
        })} MB`;
    };

    return (
        <div className="fixed inset-0 z-[998] flex items-center justify-center bg-slate-950/50 backdrop-blur-sm transition-all duration-300">
            <div
                className="flex w-full max-w-xs flex-col items-center gap-5 rounded-3xl border border-white/20 bg-white p-8 shadow-2xl"
                style={{ boxShadow: "0 30px 70px -15px rgba(0,0,0,0.25)" }}
            >
                {/* Animated spinner */}
                <div className="relative flex h-20 w-20 items-center justify-center">
                    {/* Outer ring */}
                    <svg className="absolute inset-0 h-full w-full animate-spin" viewBox="0 0 80 80" fill="none">
                        <circle
                            cx="40" cy="40" r="35"
                            stroke="#e2e8f0" strokeWidth="6"
                        />
                        <circle
                            cx="40" cy="40" r="35"
                            stroke={isExport ? "url(#exportGrad)" : "url(#spinnerGrad)"}
                            strokeWidth="6"
                            strokeLinecap="round"
                            strokeDasharray="160"
                            strokeDashoffset="120"
                        />
                        <defs>
                            <linearGradient id="spinnerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#10264A" />
                                <stop offset="100%" stopColor="#3b82f6" />
                            </linearGradient>
                            <linearGradient id="exportGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#059669" />
                                <stop offset="100%" stopColor="#0d9488" />
                            </linearGradient>
                        </defs>
                    </svg>

                    {/* Inner icon */}
                    <div className={`flex h-11 w-11 items-center justify-center rounded-2xl text-white shadow-lg ${
                        isExport
                            ? "bg-gradient-to-br from-emerald-600 to-teal-700"
                            : "bg-gradient-to-br from-[#10264A] to-[#1e4a8a]"
                    }`}>
                        {isExport ? (
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                        ) : (
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                        )}
                    </div>
                </div>

                {/* Text */}
                <div className="text-center">
                    <p className="text-base font-bold text-[#10264A]">{message}</p>
                    {subMessage && (
                        <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">{subMessage}</p>
                    )}
                </div>

                {progress && (
                    <div className="w-full">
                        <div className="mb-2 flex justify-between text-xs text-slate-500">
                            <span>
                                {isExport
                                    ? total > 0
                                        ? `${formatBytes(processed)} / ${formatBytes(total)}`
                                        : `${formatBytes(processed)} diterima`
                                    : `${processed.toLocaleString("id-ID")} / ${total.toLocaleString("id-ID")} data`}
                            </span>
                            <span className="font-semibold text-[#10264A]">
                                {total > 0 ? `${percentage}%` : isExport ? "Mengunduh" : "0%"}
                            </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                            <div
                                className={`h-full rounded-full bg-gradient-to-r ${isExport ? "from-emerald-600 to-teal-500" : "from-[#10264A] to-blue-500"} ${isExport && total === 0 ? "animate-pulse" : "transition-all duration-500"}`}
                                style={{ width: isExport && total === 0 ? "35%" : `${percentage}%` }}
                            />
                        </div>
                        {!isExport && (
                            <div className="mt-3 flex justify-center gap-4 text-[11px]">
                                <span className="text-emerald-700">Baru: {Number(progress.created || 0).toLocaleString("id-ID")}</span>
                                <span className="text-blue-700">Diperbarui: {Number(progress.updated || 0).toLocaleString("id-ID")}</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Animated dots */}
                <div className="flex items-center gap-1.5">
                    {[0, 1, 2].map((i) => (
                        <span
                            key={i}
                            className="h-2 w-2 rounded-full bg-[#10264A]/30"
                            style={{
                                animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                            }}
                        />
                    ))}
                </div>

                <style>{`
                    @keyframes pulse {
                        0%, 100% { opacity: 0.25; transform: scale(0.8); }
                        50%       { opacity: 1;    transform: scale(1.15); }
                    }
                `}</style>
            </div>
        </div>
    );
}
