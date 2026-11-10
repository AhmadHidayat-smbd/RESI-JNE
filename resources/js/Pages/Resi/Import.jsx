import { useState, useRef, useEffect } from "react";
import { Head, useForm, router, Link, usePage } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import ModalNotification from "@/Components/ModalNotification";
import LoaderOverlay from "@/Components/LoaderOverlay";

const STATUS_COLORS = {
    Success:      "bg-emerald-100 text-emerald-700 border-emerald-200",
    Failed:       "bg-red-100 text-red-700 border-red-200",
    "On Delivery":"bg-blue-100 text-blue-700 border-blue-200",
    "On Process": "bg-amber-100 text-amber-700 border-amber-200",
};

function BatchCard({ batch, onDelete }) {
    const total = Number(batch.total) || 0;
    const success = Number(batch.success) || 0;
    const failed = Number(batch.failed) || 0;
    const onDelivery = Number(batch.on_delivery) || 0;
    const onProcess = Number(batch.on_process) || 0;

    const successPct = total > 0 ? ((success / total) * 100).toFixed(1) : 0;

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-[#10264A]">
                        {batch.import_batch}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">
                        {batch.imported_at
                            ? new Date(batch.imported_at).toLocaleString("id-ID")
                            : "—"}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => onDelete(batch.import_batch)}
                    className="shrink-0 rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                    title="Hapus batch ini"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none"
                        viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4h6v3M4 7h16" />
                    </svg>
                </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                    { label: "Success",      value: success,    cls: "bg-emerald-50 text-emerald-700" },
                    { label: "Failed",       value: failed,     cls: "bg-red-50 text-red-700" },
                    { label: "On Delivery",  value: onDelivery, cls: "bg-blue-50 text-blue-700" },
                    { label: "On Process",   value: onProcess,  cls: "bg-amber-50 text-amber-700" },
                ].map((s) => (
                    <div key={s.label} className={`rounded-xl px-3 py-2 text-center ${s.cls}`}>
                        <p className="text-lg font-bold">{s.value}</p>
                        <p className="text-[10px] font-medium">{s.label}</p>
                    </div>
                ))}
            </div>

            <div className="mt-4">
                <div className="mb-1 flex justify-between text-xs text-slate-400">
                    <span>Total: <strong className="text-slate-600">{total}</strong> data</span>
                    <span>Success rate: <strong className="text-emerald-600">{successPct}%</strong></span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                        className="h-full rounded-full bg-emerald-500 transition-all duration-700"
                        style={{ width: `${successPct}%` }}
                    />
                </div>
            </div>
        </div>
    );
}

export default function Import({ batches = [], flash: initialFlash }) {
    const [dragOver, setDragOver] = useState(false);
    const [preview, setPreview] = useState(null);
    const fileInputRef = useRef(null);
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [notice, setNotice] = useState(null);

    const { data, setData, reset } = useForm({ file: null });
    const { flash: pageFlash } = usePage().props;
    const [importing, setImporting] = useState(false);
    const [importProgress, setImportProgress] = useState(null);

    // Sinkronisasi flash message dari session backend (saat redirect/render)
    useEffect(() => {
        const activeFlash = pageFlash || initialFlash;
        if (activeFlash?.success) {
            setNotice({
                type: "success",
                title: "Import Data Berhasil!",
                message: activeFlash.message || "File berhasil diproses dan disimpan ke database.",
                batch: activeFlash.batch,
                created: activeFlash.created_count,
                updated: activeFlash.updated_count,
                total: activeFlash.total_count,
                progress: activeFlash.total_count !== undefined ? {
                    total: activeFlash.total_count,
                    processed: activeFlash.total_count,
                    created: activeFlash.created_count,
                    updated: activeFlash.updated_count,
                } : undefined,
                time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
            });
        } else if (activeFlash?.error) {
            setNotice({
                type: "error",
                title: "Import Data Gagal",
                message: activeFlash.error,
                time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
            });
        }
    }, [pageFlash, initialFlash]);

    const handleFile = (file) => {
        if (!file) return;
        const allowed = ["text/csv", "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "text/plain"];
        const ext = file.name.split(".").pop().toLowerCase();
        if (!["csv", "xlsx", "xls", "txt"].includes(ext)) {
            setNotice({
                type: "error",
                title: "Format File Tidak Didukung",
                message: "Format file tidak valid. Gunakan format file CSV (.csv) atau Excel (.xlsx/.xls).",
                time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
            });
            return;
        }
        const maxSizeMB = 100;
        if (file.size > maxSizeMB * 1024 * 1024) {
            setNotice({
                type: "error",
                title: "Ukuran File Terlalu Besar",
                message: `Ukuran file melebihi batas maksimal (${maxSizeMB}MB). Silakan perkecil atau bagi file Anda.`,
                time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
            });
            return;
        }
        setData("file", file);
        const sizeMB = file.size / (1024 * 1024);
        const sizeLabel = sizeMB >= 1
            ? sizeMB.toFixed(1) + " MB"
            : (file.size / 1024).toFixed(1) + " KB";
        setPreview({ name: file.name, size: sizeLabel });
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        handleFile(e.dataTransfer.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!data.file || importing) return;

        setNotice(null);
        setImporting(true);
        setImportProgress({ total: 0, processed: 0, created: 0, updated: 0, status: "starting" });

        const csrfToken = decodeURIComponent(document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] || "");
        const headers = {
            Accept: "application/json",
            "X-Requested-With": "XMLHttpRequest",
            "X-XSRF-TOKEN": csrfToken,
        };
        let token = null;
        let latestProgress = null;

        try {
            const formData = new FormData();
            formData.append("file", data.file);

            const startResponse = await fetch("/resi/import", {
                method: "POST",
                headers,
                credentials: "same-origin",
                body: formData,
            });
            const startResult = await startResponse.json().catch(() => ({}));
            if (!startResponse.ok || !startResult.success) {
                throw new Error(startResult.message || "File gagal disiapkan untuk import.");
            }

            token = startResult.token;
            latestProgress = startResult.progress;
            setImportProgress(startResult.progress);

            while (true) {
                const chunkResponse = await fetch(`/resi/import/${token}/chunk`, {
                    method: "POST",
                    headers,
                    credentials: "same-origin",
                });
                const chunkResult = await chunkResponse.json().catch(() => ({}));

                if (chunkResult.progress) {
                    latestProgress = chunkResult.progress;
                    setImportProgress(chunkResult.progress);
                }
                if (!chunkResponse.ok || !chunkResult.success) {
                    throw new Error(chunkResult.message || "Sebagian data gagal diproses.");
                }

                if (!chunkResult.done) continue;

                const result = chunkResult.result;
                setImporting(false);
                setImportProgress(null);
                setNotice({
                    type: "success",
                    title: "Import Data Berhasil!",
                    message: "File berhasil diproses dan disimpan ke database.",
                    batch: result.batch,
                    created: result.created_count,
                    updated: result.updated_count,
                    total: result.total_count,
                    progress: {
                        ...latestProgress,
                        skipped: result.skipped_count,
                    },
                    time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
                });
                reset("file");
                setPreview(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
                router.reload({ preserveScroll: true });
                return;
            }
        } catch (error) {
            if (token) {
                await fetch(`/resi/import/${token}`, {
                    method: "DELETE",
                    headers,
                    credentials: "same-origin",
                }).catch(() => {});
            }

            const safeMessage = String(error.message || "Gagal mengimpor file. Silakan coba kembali.")
                .replace(/[&<>"']/g, (character) => ({
                    "&": "&amp;",
                    "<": "&lt;",
                    ">": "&gt;",
                    '"': "&quot;",
                    "'": "&#039;",
                })[character]);
            setImporting(false);
            setImportProgress(null);
            setNotice({
                type: "error",
                title: "Import Data Gagal",
                message: safeMessage,
                progress: latestProgress || undefined,
                time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
            });
        }
    };
    const handleDelete = (batch) => {
        router.delete("/resi/batch", {
            data: { batch },
            onSuccess: () => {
                setConfirmDelete(null);
                setNotice({
                    type: "success",
                    title: "Batch Berhasil Dihapus",
                    message: `Seluruh data pada batch <strong>${batch}</strong> berhasil dihapus.`,
                    time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
                });
            },
        });
    };

    return (
        <AuthenticatedLayout header="Import Data Resi">
            <Head title="Import Data Resi" />

            {/* Loader Overlay */}
            <LoaderOverlay
                show={importing}
                type="import"
                message="Sedang Mengimpor Data..."
                subMessage="Data diproses bertahap. Mohon jangan tutup halaman ini."
                progress={importProgress}
            />

            <div className="space-y-7">
                {/* Header */}
                <section>
                    <h1 className="text-2xl font-bold tracking-tight text-[#10264A] sm:text-3xl">
                        Import Data Resi
                    </h1>
                    <p className="mt-2 text-sm text-slate-500">
                        Unggah file CSV atau Excel dari sistem JNE untuk diproses ke database.
                    </p>
                </section>

                {/* Modal Notifikasi Tengah Layar */}
                <ModalNotification
                    notice={notice}
                    onClose={() => setNotice(null)}
                    duration={10000}
                />

                {/* Upload Area */}
                <section className="grid gap-6 lg:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h2 className="font-bold text-[#10264A]">Unggah File</h2>
                        <p className="mt-1 text-xs text-slate-400">
                            Format yang didukung: CSV (.csv) dan Excel (.xlsx, .xls) • Maks. 100MB
                        </p>

                        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                            {/* Drop Zone */}
                            <div
                                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                                onDragLeave={() => setDragOver(false)}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                                className={`relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-10 text-center transition ${
                                    dragOver
                                        ? "border-[#10264A] bg-blue-50"
                                        : preview
                                        ? "border-emerald-400 bg-emerald-50"
                                        : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white"
                                }`}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".csv,.xlsx,.xls"
                                    className="hidden"
                                    onChange={(e) => handleFile(e.target.files[0])}
                                />

                                {preview ? (
                                    <>
                                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-3xl">
                                            📄
                                        </div>
                                        <p className="mt-3 font-semibold text-emerald-700">
                                            {preview.name}
                                        </p>
                                        <p className="mt-1 text-xs text-emerald-500">
                                            {preview.size} • Klik untuk ganti file
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-3xl">
                                            📂
                                        </div>
                                        <p className="mt-3 font-semibold text-slate-600">
                                            Drag & drop file di sini
                                        </p>
                                        <p className="mt-1 text-xs text-slate-400">
                                            atau klik untuk memilih file
                                        </p>
                                    </>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={!preview || importing}
                                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#10264A] px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-950/10 transition hover:bg-[#193965] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {importing ? (
                                    <>
                                        <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10"
                                                stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor"
                                                d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z" />
                                        </svg>
                                        Sedang Mengimpor...
                                    </>
                                ) : (
                                    <>
                                        <span>⬆</span> Mulai Import
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Panduan */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h2 className="font-bold text-[#10264A]">Panduan Format File</h2>
                        <p className="mt-1 text-xs text-slate-400">
                            Pastikan file Anda memiliki kolom-kolom berikut
                        </p>

                        <div className="mt-5 space-y-2">
                            {[
                                { col: "POD", desc: "URL link detail pengiriman" },
                                { col: "Awb", desc: "Nomor AWB / Resi" },
                                { col: "Tgl Jam Entry", desc: "Tanggal & waktu entry" },
                                { col: "Consignee Name", desc: "Nama penerima" },
                                { col: "Origin Code", desc: "Kode kota asal" },
                                { col: "Destination Code", desc: "Kode kota tujuan" },
                                { col: "Detination Name", desc: "Nama kota tujuan" },
                                { col: "Weight / Amount", desc: "Berat & nilai paket" },
                                { col: "Status", desc: "Success / Failed / On Delivery / On Process" },
                                { col: "Tgl Received", desc: "Tanggal diterima" },
                                { col: "Receiver Reason", desc: "Alasan / keterangan" },
                                { col: "Runsheet No", desc: "Nomor runsheet" },
                            ].map((item) => (
                                <div key={item.col} className="flex items-start gap-3 text-xs">
                                    <span className="mt-0.5 shrink-0 rounded bg-[#10264A]/10 px-1.5 py-0.5 font-mono text-[10px] font-bold text-[#10264A]">
                                        {item.col}
                                    </span>
                                    <span className="text-slate-500">{item.desc}</span>
                                </div>
                            ))}
                        </div>

                        <div className="mt-5 rounded-xl bg-amber-50 px-4 py-3 text-xs text-amber-700">
                            <strong>⚠ Penting:</strong> Separator kolom CSV harus menggunakan
                            tanda <code className="rounded bg-amber-100 px-1">titik koma (;)</code>,
                            sesuai format export dari sistem JNE.
                        </div>
                    </div>
                </section>

                {/* Riwayat Import */}
                {batches.length > 0 && (
                    <section>
                        <div className="mb-4 flex items-center justify-between">
                            <div>
                                <h2 className="font-bold text-[#10264A]">Riwayat Import</h2>
                                <p className="mt-0.5 text-xs text-slate-400">
                                    {batches.length} batch terakhir
                                </p>
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                            {batches.map((batch) => (
                                <BatchCard
                                    key={batch.import_batch}
                                    batch={batch}
                                    onDelete={setConfirmDelete}
                                />
                            ))}
                        </div>
                    </section>
                )}

                {batches.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center">
                        <p className="text-4xl">📦</p>
                        <p className="mt-3 font-semibold text-slate-500">Belum ada data yang diimport</p>
                        <p className="mt-1 text-xs text-slate-400">Upload file CSV atau Excel di atas untuk mulai</p>
                    </div>
                )}
            </div>

            {/* Confirm Delete Modal */}
            {confirmDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-2xl">
                            🗑
                        </div>
                        <h3 className="mt-4 text-lg font-bold text-slate-800">Hapus Batch?</h3>
                        <p className="mt-2 text-sm text-slate-500">
                            Semua data dari batch <strong>{confirmDelete}</strong> akan dihapus permanen.
                            Tindakan ini tidak bisa dibatalkan.
                        </p>
                        <div className="mt-6 flex gap-3">
                            <button
                                onClick={() => setConfirmDelete(null)}
                                className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                            >
                                Batal
                            </button>
                            <button
                                onClick={() => handleDelete(confirmDelete)}
                                disabled={deleting}
                                className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
                            >
                                {deleting ? "Menghapus..." : "Ya, Hapus"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
