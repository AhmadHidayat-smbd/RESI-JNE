import { useEffect, useState } from "react";
import { Link } from "@inertiajs/react";

/**
 * ModalNotification — notifikasi tengah layar yang profesional.
 * Mendukung tipe: "success" | "error" | "export"
 * Auto-dismiss setelah `duration` ms (default 8000), bisa ditutup manual.
 */
export default function ModalNotification({
    notice,
    onClose,
    duration = 8000,
    showImportHints = true,
    successHref = "/resi",
    successLabel = "Lihat Monitoring Resi",
}) {
    const [progress, setProgress] = useState(100);
    const [visible, setVisible] = useState(false);
    const [leaving, setLeaving] = useState(false);

    const handleClose = () => {
        setLeaving(true);
        setTimeout(() => {
            setVisible(false);
            onClose?.();
        }, 280);
    };

    useEffect(() => {
        if (!notice) { setVisible(false); return; }
        setLeaving(false);
        setVisible(true);
        setProgress(100);

        if (!duration) return;

        const start = Date.now();
        const interval = setInterval(() => {
            const elapsed = Date.now() - start;
            const pct = Math.max(0, 100 - (elapsed / duration) * 100);
            setProgress(pct);
            if (pct <= 0) clearInterval(interval);
        }, 50);

        const timer = setTimeout(() => handleClose(), duration);

        return () => {
            clearInterval(interval);
            clearTimeout(timer);
        };
    }, [notice]);

    if (!notice || !visible) return null;

    const isSuccess = notice.type === "success";
    const isError   = notice.type === "error";
    const isExport  = notice.type === "export";
    const importProgress = notice.progress;
    const hasImportProgress = importProgress && (
        importProgress.total !== undefined || importProgress.processed !== undefined
    );
    const formatCount = (value) => Number(value || 0).toLocaleString("id-ID");
    const progressTotal = Number(importProgress?.total) || 0;
    const progressProcessed = Number(importProgress?.processed) || 0;
    const progressPercentage = progressTotal > 0
        ? Math.min(Math.round((progressProcessed / progressTotal) * 100), 100)
        : 0;

    const colorMap = {
        success: {
            overlay:  "bg-emerald-950/30",
            card:     "border-emerald-200/80",
            glow:     "shadow-emerald-500/10",
            iconBg:   "bg-gradient-to-br from-emerald-500 to-emerald-700",
            badge:    "bg-emerald-100 text-emerald-700",
            title:    "text-emerald-950",
            progress: "bg-emerald-500",
            ring:     "ring-emerald-300/30",
        },
        error: {
            overlay:  "bg-red-950/30",
            card:     "border-red-200/80",
            glow:     "shadow-red-500/10",
            iconBg:   "bg-gradient-to-br from-red-500 to-red-700",
            badge:    "bg-red-100 text-red-700",
            title:    "text-red-950",
            progress: "bg-red-500",
            ring:     "ring-red-300/30",
        },
        export: {
            overlay:  "bg-emerald-950/20",
            card:     "border-emerald-200/80",
            glow:     "shadow-emerald-500/10",
            iconBg:   "bg-gradient-to-br from-emerald-500 to-teal-600",
            badge:    "bg-emerald-100 text-emerald-700",
            title:    "text-[#10264A]",
            progress: "bg-emerald-500",
            ring:     "ring-emerald-300/30",
        },
    };
    const c = colorMap[notice.type] || colorMap.success;

    return (
        <div
            className={`fixed inset-0 z-[999] flex items-center justify-center px-4 py-8 ${c.overlay} backdrop-blur-sm transition-opacity duration-300 ${leaving ? "opacity-0" : "opacity-100"}`}
            onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
        >
            <div
                className={`relative w-full max-w-md overflow-hidden rounded-3xl border bg-white ${c.card} ring-1 ${c.ring} shadow-2xl ${c.glow} transform transition-all duration-300 ${leaving ? "scale-95 opacity-0" : "scale-100 opacity-100"}`}
                style={{ boxShadow: "0 25px 60px -12px rgba(0,0,0,0.18)" }}
            >
                {/* Progress bar auto-dismiss */}
                {duration > 0 && (
                    <div className="absolute top-0 left-0 right-0 h-[3px] bg-slate-100 overflow-hidden">
                        <div
                            className={`h-full ${c.progress} transition-none`}
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                )}

                {/* Close button */}
                <button
                    type="button"
                    onClick={handleClose}
                    className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-600 active:scale-95"
                    title="Tutup"
                >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <div className="p-7">
                    {/* Icon + Badge */}
                    <div className="flex items-center gap-4 mb-5">
                        <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${c.iconBg} text-white shadow-lg`}>
                            {isSuccess && (
                                <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            )}
                            {isError && (
                                <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                                </svg>
                            )}
                            {isExport && (
                                <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            )}
                        </div>
                        <div>
                            <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest ${c.badge}`}>
                                {isSuccess ? "✓ Berhasil" : isError ? "⚠ Gagal" : "⬇ Export Excel"}
                            </span>
                            {notice.time && (
                                <p className="mt-0.5 text-[11px] text-slate-400">Pukul {notice.time} WIB</p>
                            )}
                        </div>
                    </div>

                    {/* Title */}
                    <h3 className={`text-xl font-bold leading-tight ${c.title}`}>{notice.title}</h3>

                    {/* Message */}
                    <div
                        className="mt-2 text-sm leading-relaxed text-slate-600"
                        dangerouslySetInnerHTML={{ __html: notice.message }}
                    />

                    {hasImportProgress && (
                        <div className={`mt-5 rounded-2xl border p-4 ${isError ? "border-red-100 bg-red-50/60" : "border-slate-200 bg-slate-50/80"}`}>
                            <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
                                <span>{isError ? "Progres terakhir" : "Ringkasan import"}</span>
                                <span className={`font-semibold ${isError ? "text-red-700" : "text-[#10264A]"}`}>
                                    {progressPercentage}%
                                </span>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-white">
                                <div
                                    className={`h-full rounded-full transition-all ${isError ? "bg-gradient-to-r from-red-500 to-red-600" : "bg-gradient-to-r from-[#10264A] to-blue-500"}`}
                                    style={{ width: `${progressPercentage}%` }}
                                />
                            </div>
                            <p className="mt-2 text-center text-xs text-slate-600">
                                <strong className="text-slate-800">{formatCount(progressProcessed)}</strong>
                                {" dari "}
                                <strong className="text-slate-800">{formatCount(progressTotal)}</strong>
                                {" baris diproses"}
                            </p>
                            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                                {[
                                    { label: "Data baru", value: importProgress.created, color: "text-emerald-700" },
                                    { label: "Diperbarui", value: importProgress.updated, color: "text-blue-700" },
                                    { label: "Dilewati", value: importProgress.skipped, color: "text-amber-700" },
                                    {
                                        label: isSuccess ? "Data di batch" : "Total baris",
                                        value: notice.total ?? importProgress.total,
                                        color: "text-slate-700",
                                    },
                                ].filter((item) => item.value !== undefined).map((item) => (
                                    <div key={item.label} className="rounded-xl border border-white bg-white/80 px-2.5 py-2 text-center">
                                        <p className={`text-base font-bold ${item.color}`}>{formatCount(item.value)}</p>
                                        <p className="text-[10px] font-medium text-slate-500">{item.label}</p>
                                    </div>
                                ))}
                            </div>
                            {notice.batch && (
                                <p className="mt-3 truncate border-t border-slate-200 pt-2.5 text-[11px] text-slate-500">
                                    Batch: <span className="font-mono font-medium text-slate-700">{notice.batch}</span>
                                </p>
                            )}
                        </div>
                    )}

                    {/* Data chips — import success */}
                    {isSuccess && !hasImportProgress && (notice.batch || notice.created !== undefined || notice.updated !== undefined || notice.total !== undefined) && (
                        <div className="mt-4 flex flex-wrap gap-2">
                            {notice.batch && (
                                <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800">
                                    🏷️ <span className="font-mono text-slate-700 text-[11px]">{notice.batch}</span>
                                </span>
                            )}
                            {notice.created !== undefined && (
                                <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800">
                                    ➕ Baru: <strong className="text-emerald-600">{Number(notice.created).toLocaleString("id-ID")}</strong>
                                </span>
                            )}
                            {notice.updated !== undefined && notice.updated > 0 && (
                                <span className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                                    🔄 Update: <strong>{Number(notice.updated).toLocaleString("id-ID")}</strong>
                                </span>
                            )}
                            {notice.total !== undefined && (
                                <span className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700">
                                    📦 Total: <strong>{Number(notice.total).toLocaleString("id-ID")}</strong>
                                </span>
                            )}
                        </div>
                    )}

                    {/* Data chips — export */}
                    {isExport && (notice.total !== undefined || notice.status || notice.dateRange || notice.search) && (
                        <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 space-y-2.5">
                            <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">Detail Export</p>
                            <div className="flex flex-wrap gap-2 text-[11px]">
                                {notice.total !== undefined && (
                                    <span className="inline-flex items-center gap-1 rounded-lg bg-white border border-emerald-200 px-2.5 py-1 font-medium text-slate-700">
                                        📊 <strong className="text-emerald-700">{Number(notice.total).toLocaleString("id-ID")} Resi</strong>
                                    </span>
                                )}
                                {notice.status && (
                                    <span className="inline-flex items-center gap-1 rounded-lg bg-white border border-emerald-200 px-2.5 py-1 font-medium text-slate-700">
                                        🏷️ {notice.status}
                                    </span>
                                )}
                                {notice.dateRange && (
                                    <span className="inline-flex items-center gap-1 rounded-lg bg-white border border-emerald-200 px-2.5 py-1 font-medium text-slate-700">
                                        📅 {notice.dateRange}
                                    </span>
                                )}
                                {notice.search && (
                                    <span className="inline-flex items-center gap-1 rounded-lg bg-white border border-emerald-200 px-2.5 py-1 font-medium text-slate-700">
                                        🔍 &quot;{notice.search}&quot;
                                    </span>
                                )}
                                {notice.fileName && (
                                    <span className="inline-flex items-center gap-1 rounded-lg bg-white border border-emerald-200 px-2.5 py-1 font-mono text-slate-600 text-[10px]">
                                        📁 {notice.fileName}
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Error hints */}
                    {isError && showImportHints && (
                        <div className="mt-4 rounded-2xl border border-red-100 bg-red-50/60 p-4">
                            <p className="flex items-center gap-1.5 text-xs font-bold text-red-800">
                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01" />
                                </svg>
                                Panduan Penyelesaian:
                            </p>
                            <ul className="mt-2 space-y-1 list-disc list-inside text-[11px] text-slate-600">
                                <li>Pastikan file berformat <strong>.csv</strong>, <strong>.xlsx</strong>, atau <strong>.xls</strong> (maks. 100MB)</li>
                                <li>Pastikan ada kolom nomor resi: <strong>AWB</strong>, <strong>No Resi</strong>, atau <strong>CNote</strong></li>
                                <li>CSV: gunakan pemisah titik koma (<code className="bg-red-100 px-1 rounded">;</code>) atau koma (<code className="bg-red-100 px-1 rounded">,</code>)</li>
                            </ul>
                        </div>
                    )}

                    {/* Action buttons */}
                    <div className="mt-6 flex flex-wrap items-center gap-2.5">
                        {isSuccess && (
                            <>
                                <Link
                                    href={successHref}
                                    onClick={handleClose}
                                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-95"
                                >
                                    {successLabel} <span>→</span>
                                </Link>
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 active:scale-95"
                                >
                                    Import File Lain
                                </button>
                            </>
                        )}
                        {isError && (
                            <button
                                type="button"
                                onClick={handleClose}
                                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-red-700 active:scale-95"
                            >
                                🔄 Coba Lagi
                            </button>
                        )}
                        {isExport && notice.downloadUrl && (
                            <>
                                <a
                                    href={notice.downloadUrl}
                                    download={notice.fileName || true}
                                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-95"
                                >
                                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    Unduh Ulang File
                                </a>
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 active:scale-95"
                                >
                                    Tutup
                                </button>
                            </>
                        )}
                        {isExport && !notice.downloadUrl && (
                            <button
                                type="button"
                                onClick={handleClose}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-95"
                            >
                                Oke, Tutup
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
