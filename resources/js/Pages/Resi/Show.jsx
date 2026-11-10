import { useState, useEffect } from "react";
import { Head, Link, router, usePage } from "@inertiajs/react";
import RoleBasedLayout from "@/Layouts/RoleBasedLayout";

// ─── Konfigurasi Status Badge ─────────────────────────────────────────────────
const STATUS_CFG = {
    Success:      { cls: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
    Failed:       { cls: "bg-red-50 text-red-700 border-red-200",             dot: "bg-red-500" },
    "On Delivery":{ cls: "bg-blue-50 text-blue-700 border-blue-200",          dot: "bg-blue-500" },
    "On Process": { cls: "bg-amber-50 text-amber-700 border-amber-200",       dot: "bg-amber-500" },
};

// ─── Konfigurasi Aksi Hold / Cancel ──────────────────────────────────────────
const ACTION_CFG = {
    hold: {
        label:       "Hold",
        desc:        "Resi ditahan sementara, status asli tidak berubah.",
        badgeCls:    "bg-orange-50 text-orange-700 border border-orange-200",
        activeCls:   "border-orange-400 ring-2 ring-orange-300 bg-orange-50",
        btnCls:      "bg-orange-500 hover:bg-orange-600",
        placeholder: "Alasan hold (wajib diisi)...",
    },
    cancel: {
        label:       "Cancel",
        desc:        "Resi dibatalkan, status asli tidak berubah.",
        badgeCls:    "bg-red-50 text-red-700 border border-red-200",
        activeCls:   "border-red-400 ring-2 ring-red-300 bg-red-50",
        btnCls:      "bg-red-500 hover:bg-red-600",
        placeholder: "Alasan cancel (wajib diisi)...",
    },
};

// ─── Helper: Format tanggal & jam tanpa pergeseran timezone ──────────────────
function formatDateTime(val) {
    if (!val) return null;
    const m = String(val).trim().match(/^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})/);
    if (!m) return String(val);
    const MONTHS = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
    return `${parseInt(m[3], 10)} ${MONTHS[parseInt(m[2], 10) - 1]} ${m[1]}, pukul ${m[4]}:${m[5]} WIB`;
}

function formatDate(val) {
    if (!val) return null;
    const m = String(val).trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!m) return String(val);
    const MONTHS = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
    return `${parseInt(m[3], 10)} ${MONTHS[parseInt(m[2], 10) - 1]} ${m[1]}`;
}

// ─── Komponen Field (label + value) ──────────────────────────────────────────
function Field({ label, value }) {
    return (
        <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
            <p className="mt-1 text-sm text-slate-700">
                {value ?? <span className="italic text-slate-300">—</span>}
            </p>
        </div>
    );
}

function SlaEvaluationCard({ evaluation }) {
    const styles = {
        on_time: "border-emerald-200 bg-emerald-50 text-emerald-800",
        early: "border-blue-200 bg-blue-50 text-blue-800",
        late: "border-red-200 bg-red-50 text-red-800",
    };
    const titles = {
        on_time: "Tepat waktu",
        early: `Lebih cepat ${evaluation.difference_days} hari`,
        late: `Terlambat ${evaluation.difference_days} hari`,
    };
    const stateStyle = styles[evaluation?.state] ?? "border-slate-200 bg-slate-50 text-slate-600";

    return (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h2 className="font-bold text-[#10264A]">Evaluasi SLA Pengiriman</h2>
                    <p className="mt-1 text-xs text-slate-500">Mengacu pada SLA di data destination resi.</p>
                </div>
                {titles[evaluation?.state] && (
                    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${stateStyle}`}>
                        {titles[evaluation.state]}
                    </span>
                )}
            </div>

            {evaluation?.sla_days && (
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-xl bg-slate-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">SLA JNE</p>
                        <p className="mt-1 text-lg font-bold text-[#10264A]">{evaluation.sla_days} hari</p>
                    </div>
                    {evaluation.delivery_days && (
                        <div className="rounded-xl bg-slate-50 p-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Lama Pengiriman</p>
                            <p className="mt-1 text-lg font-bold text-[#10264A]">{evaluation.delivery_days} hari</p>
                        </div>
                    )}
                </div>
            )}

            <p className={`mt-4 rounded-xl border p-3 text-sm ${stateStyle}`}>
                {evaluation?.message ?? (evaluation?.state === "on_time"
                    ? "Pengiriman tiba sesuai batas SLA."
                    : evaluation?.state === "early"
                        ? "Pengiriman tiba sebelum batas SLA."
                        : "Pengiriman tiba setelah batas SLA.")}
            </p>
            <p className="mt-3 text-[11px] text-slate-400">
                Perhitungan memakai hari kalender dan menghitung tanggal entry sebagai hari pertama.
            </p>
        </section>
    );
}

// ─── Komponen Panel Aksi Hold / Cancel ───────────────────────────────────────
function ActionPanel({ shipment }) {
    const [selected, setSelected]     = useState(shipment.action ?? "");
    const [note, setNote]             = useState(shipment.action_note ?? "");
    const [submitting, setSubmitting] = useState(false);

    const handleSelect = (key) => {
        setSelected((prev) => (prev === key ? "" : key));
        setNote("");
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!note.trim()) return;
        setSubmitting(true);
        router.patch(
            `/resi/${shipment.id}/action`,
            { action: selected, note },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setSelected("");
                    setNote("");
                },
                onFinish: () => setSubmitting(false),
            }
        );
    };

    const handleClear = () => {
        if (!confirm("Hapus aksi yang tersimpan untuk resi ini?")) return;
        setSubmitting(true);
        router.patch(
            `/resi/${shipment.id}/action`,
            { action: null, note: null },
            {
                preserveScroll: true,
                onSuccess: () => { setSelected(""); setNote(""); },
                onFinish:  () => setSubmitting(false),
            }
        );
    };

    const activeCfg = ACTION_CFG[selected];

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-1 font-bold text-[#10264A]">Aksi Resi</h2>
            <p className="mb-4 text-xs text-slate-400">
                Aksi tidak mengubah status pengiriman asli.
            </p>

            {/* Pilihan tombol aksi */}
            <div className="mb-4 flex gap-3">
                {Object.entries(ACTION_CFG).map(([key, cfg]) => (
                    <button
                        key={key}
                        type="button"
                        onClick={() => handleSelect(key)}
                        className={`flex-1 rounded-xl border p-3 text-left text-sm transition ${
                            selected === key ? cfg.activeCls : "border-slate-200 hover:border-slate-300"
                        }`}
                    >
                        <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${cfg.badgeCls}`}>
                            {cfg.label}
                        </span>
                        <p className="mt-1.5 text-[11px] font-normal text-slate-500">{cfg.desc}</p>
                    </button>
                ))}
            </div>

            {/* Form catatan — hanya tampil saat aksi dipilih */}
            {selected && activeCfg && (
                <form onSubmit={handleSubmit} className="space-y-3">
                    <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder={activeCfg.placeholder}
                        required
                        rows={3}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition focus:border-blue-800 focus:bg-white focus:ring-2 focus:ring-blue-900/10"
                    />
                    <div className="flex gap-2">
                        <button
                            type="submit"
                            disabled={submitting || !note.trim()}
                            className={`flex-1 rounded-xl px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-50 ${activeCfg.btnCls}`}
                        >
                            {submitting ? "Menyimpan..." : `Simpan ${activeCfg.label}`}
                        </button>
                        <button
                            type="button"
                            onClick={() => { setSelected(""); setNote(""); }}
                            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-500 transition hover:bg-slate-50"
                        >
                            Batal
                        </button>
                    </div>
                </form>
            )}

            {/* Info aksi yang sudah tersimpan */}
            {!selected && shipment.action && ACTION_CFG[shipment.action] && (
                <div className={`flex items-start justify-between rounded-xl border p-3 ${ACTION_CFG[shipment.action].badgeCls}`}>
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wide">
                            {ACTION_CFG[shipment.action].label} aktif
                        </p>
                        {shipment.action_note && (
                            <p className="mt-1 text-xs">{shipment.action_note}</p>
                        )}
                        {shipment.actioned_at && (
                            <p className="mt-1 text-[10px] opacity-60">{formatDateTime(shipment.actioned_at)}</p>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={handleClear}
                        disabled={submitting}
                        className="ml-3 shrink-0 rounded-lg border border-current/20 px-2.5 py-1 text-xs font-medium opacity-70 transition hover:opacity-100 disabled:opacity-40"
                    >
                        Hapus
                    </button>
                </div>
            )}

            {/* Belum ada aksi */}
            {!selected && !shipment.action && (
                <p className="text-xs italic text-slate-400">Belum ada aksi untuk resi ini.</p>
            )}
        </div>
    );
}

// ─── Komponen Notifikasi Berhasil / Gagal ────────────────────────────────────
function FlashAlert({ flash }) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (flash?.success || flash?.error) {
            setVisible(true);
            const timer = setTimeout(() => setVisible(false), 5000);
            return () => clearTimeout(timer);
        }
    }, [flash]);

    if (!visible || (!flash?.success && !flash?.error)) return null;

    const isSuccess = Boolean(flash?.success);

    return (
        <div
            className={`flex items-center justify-between gap-3 rounded-2xl border p-4 shadow-sm transition-all duration-300 animate-fade-in ${
                isSuccess
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border-red-200 bg-red-50 text-red-800"
            }`}
        >
            <div className="flex items-center gap-3">
                <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-base font-bold ${
                        isSuccess ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"
                    }`}
                >
                    {isSuccess ? "✓" : "✕"}
                </span>
                <div>
                    <p className="text-sm font-bold">{isSuccess ? "Berhasil Diperbarui!" : "Terjadi Kesalahan"}</p>
                    <p className="text-xs opacity-90">{flash.success || flash.error}</p>
                </div>
            </div>
            <button
                type="button"
                onClick={() => setVisible(false)}
                className="rounded-lg p-1 text-slate-400 transition hover:text-slate-600"
                title="Tutup notifikasi"
            >
                ✕
            </button>
        </div>
    );
}

// ─── Halaman Detail Resi ──────────────────────────────────────────────────────
export default function ResiShow({ shipment, slaEvaluation }) {
    const { flash, auth } = usePage().props;
    const isAdmin = auth?.user?.role === "admin";
    const [previewPhoto, setPreviewPhoto] = useState(null);
    const returnUrl = typeof window === "undefined"
        ? null
        : new URLSearchParams(window.location.search).get("return_url");
    const backUrl = returnUrl && /^\/resi(?:\?|$)/.test(returnUrl)
        ? returnUrl
        : "/resi";

    useEffect(() => {
        if (!previewPhoto) return;

        const closeOnEscape = (event) => {
            if (event.key === "Escape") setPreviewPhoto(null);
        };

        document.addEventListener("keydown", closeOnEscape);

        return () => document.removeEventListener("keydown", closeOnEscape);
    }, [previewPhoto]);

    const cfg = STATUS_CFG[shipment.status] ?? {
        cls: "bg-slate-100 text-slate-600 border-slate-200",
        dot: "bg-slate-400",
    };

    const photos = [
        shipment.pod_picture,
        shipment.foto_pod_1,
        shipment.foto_pod_2,
        shipment.foto_pod_3,
        shipment.foto_pod_4,
        shipment.foto_pod_5,
        shipment.foto_pod_6,
        shipment.foto_pod_7,
    ].filter(Boolean);

    return (
        <RoleBasedLayout header="Detail Resi">
            <Head title={`Detail Resi ${shipment.awb}`} />

            <div className="space-y-6">
                {/* Notifikasi Flash */}
                <FlashAlert flash={flash} />

                {/* Back + Header */}
                <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <Link
                            href={backUrl}
                            className="inline-flex items-center gap-1 text-xs text-slate-400 transition hover:text-[#10264A]"
                        >
                            ← Kembali ke Monitoring Resi
                        </Link>
                        <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#10264A]">
                            {shipment.awb || "—"}
                        </h1>
                        <p className="mt-1 text-sm text-slate-500">
                            {shipment.consignee_name || "—"}
                        </p>
                    </div>

                    <span className={`inline-flex w-fit items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold ${cfg.cls}`}>
                        <span className={`h-2 w-2 rounded-full ${cfg.dot}`} />
                        {shipment.status || "—"}
                    </span>
                </section>

                <SlaEvaluationCard evaluation={slaEvaluation} />

                {/* Info Grid */}
                <div className="grid gap-5 lg:grid-cols-3">
                    {/* Informasi Pengiriman */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
                        <h2 className="mb-5 font-bold text-[#10264A]">Informasi Pengiriman</h2>
                        <div className="grid gap-5 sm:grid-cols-2">
                            <Field label="No AWB / Resi"      value={shipment.awb} />
                            <Field label="Runsheet No"         value={shipment.runsheet_no} />
                            <Field label="Tanggal & Jam Entry" value={formatDateTime(shipment.tgl_jam_entry)} />
                            <Field label="Tanggal Received"    value={formatDate(shipment.tgl_received)} />
                            <Field label="Kode Asal"           value={shipment.origin_code} />
                            <Field label="Kode Tujuan"         value={shipment.destination_code} />
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">3LC</p>
                                <p className="mt-1 text-sm text-slate-700">
                                    {shipment.destination_code ? (
                                        <span className="inline-flex items-center rounded-md bg-indigo-50 px-2.5 py-1 text-sm font-bold tracking-widest text-indigo-700 ring-1 ring-inset ring-indigo-200">
                                            {shipment.destination_code.substring(0, 3).toUpperCase()}
                                        </span>
                                    ) : (
                                        <span className="italic text-slate-300">—</span>
                                    )}
                                </p>
                            </div>
                            <Field label="Tujuan"       value={shipment.destination_name} />
                            {shipment.destination && (
                                <>
                                    <Field label="Kabupaten/Kota" value={shipment.destination.kabupaten} />
                                    <Field label="Kecamatan"      value={shipment.destination.kecamatan} />
                                </>
                            )}
                            <Field label="Layanan"       value={shipment.service} />
                            <Field label="Berat"         value={shipment.weight ? `${shipment.weight} kg` : null} />
                            <Field label="Nilai Kiriman" value={shipment.amount ? `Rp ${Number(shipment.amount).toLocaleString("id-ID")}` : null} />
                            <Field label="Coding"        value={shipment.coding} />
                            <Field label="Reciver Reasons" value={shipment.receiver_reason} />
                        </div>
                    </div>

                    {/* Kolom kanan: Penerima, Aksi, GPS, Batch */}
                    <div className="space-y-5">
                        {/* Data Penerima */}
                        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                            <h2 className="mb-4 font-bold text-[#10264A]">Data Penerima</h2>
                            <div className="space-y-4">
                                <Field label="Nama Penerima" value={shipment.consignee_name} />
                                <Field label="Alamat 1"      value={shipment.adr1} />
                                <Field label="Alamat 2"      value={shipment.adr2} />
                                <Field label="Alamat 3"      value={shipment.adr3} />
                            </div>
                        </div>

                        {/* Panel Aksi Hold / Cancel */}
                        {isAdmin && <ActionPanel shipment={shipment} />}

                        {/* Lokasi GPS */}
                        {shipment.latlong && shipment.latlong !== "," && (
                            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                                <h2 className="mb-3 font-bold text-[#10264A]">Lokasi GPS</h2>
                                <p className="font-mono text-xs text-slate-500">{shipment.latlong}</p>
                                {(() => {
                                    const [lat, lng] = (shipment.latlong || "").split(",").map(Number);
                                    if (!isNaN(lat) && !isNaN(lng)) {
                                        return (
                                            <a
                                                href={`https://maps.google.com/?q=${lat},${lng}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-[#10264A] px-3 py-2 text-xs font-medium text-white transition hover:bg-[#193965]"
                                            >
                                                📍 Lihat di Maps
                                            </a>
                                        );
                                    }
                                    return null;
                                })()}
                            </div>
                        )}

                        {/* Import Batch */}
                        {isAdmin && shipment.import_batch && (
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
                                <p className="text-xs font-semibold text-slate-400">Import Batch</p>
                                <p className="mt-1 break-all font-mono text-xs text-slate-600">
                                    {shipment.import_batch}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Foto POD */}
                {photos.length > 0 && (
                    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h2 className="mb-5 font-bold text-[#10264A]">Foto POD ({photos.length} foto)</h2>
                        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                            {photos.map((url, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    onClick={() => setPreviewPhoto({ url, number: i + 1 })}
                                    aria-label={`Preview Foto POD ${i + 1}`}
                                    className="group relative aspect-square overflow-hidden rounded-xl border border-slate-200 bg-slate-100"
                                >
                                    <img
                                        src={url}
                                        alt={`Foto ${i + 1}`}
                                        className="h-full w-full object-cover transition group-hover:scale-105"
                                        onError={(e) => { e.target.style.display = "none"; }}
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center bg-slate-950/0 text-white opacity-0 transition group-hover:bg-slate-950/30 group-hover:opacity-100">
                                        <span className="text-sm font-medium">🔍 Buka</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </section>
                )}
            </div>

            {previewPhoto && (
                <div
                    role="presentation"
                    onClick={() => setPreviewPhoto(null)}
                    className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
                >
                    <section
                        role="dialog"
                        aria-modal="true"
                        aria-label={`Preview Foto POD ${previewPhoto.number}`}
                        onClick={(event) => event.stopPropagation()}
                        className="relative flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-white shadow-2xl"
                    >
                        <header className="flex items-center justify-between border-b border-slate-100 px-4 py-3 sm:px-5">
                            <h2 className="text-sm font-semibold text-[#10264A]">
                                Foto POD {previewPhoto.number} dari {photos.length}
                            </h2>
                            <button
                                type="button"
                                onClick={() => setPreviewPhoto(null)}
                                aria-label="Tutup preview"
                                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-800"
                            >
                                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
                                </svg>
                            </button>
                        </header>
                        <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto bg-slate-950 p-3 sm:p-6">
                            <img
                                src={previewPhoto.url}
                                alt={`Foto POD ${previewPhoto.number}`}
                                className="max-h-[70vh] max-w-full object-contain"
                            />
                        </div>
                        <footer className="flex justify-end border-t border-slate-100 px-4 py-3 sm:px-5">
                            <a
                                href={previewPhoto.url}
                                download
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 rounded-xl bg-[#10264A] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#193965]"
                            >
                                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v12m0 0l-4-4m4 4l4-4M5 17v3h14v-3" />
                                </svg>
                                Unduh Gambar
                            </a>
                        </footer>
                    </section>
                </div>
            )}
        </RoleBasedLayout>
    );
}
