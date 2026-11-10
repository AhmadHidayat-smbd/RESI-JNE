import { useState, useEffect, useRef, useCallback } from "react";
import { Head, router, usePage } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import LoaderOverlay from "@/Components/LoaderOverlay";
import ModalNotification from "@/Components/ModalNotification";

// ─── Komponen Notifikasi Flash ───────────────────────────────────────────────
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
            className={`flex items-center justify-between gap-3 rounded-2xl border p-4 shadow-sm transition-all duration-300 ${
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
                    <p className="text-sm font-bold">{isSuccess ? "Berhasil!" : "Gagal"}</p>
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

// ─── Form Data Daerah ────────────────────────────────────────────────────────
function DestinationForm({ editing, onCancel }) {
    const [form, setForm] = useState({
        syscode: editing?.syscode ?? "",
        code: editing?.code ?? "",
        regional: editing?.regional ?? "",
        kabupaten: editing?.kabupaten ?? "",
        kecamatan: editing?.kecamatan ?? "",
        branch: editing?.branch ?? "",
        zone_delivery: editing?.zone_delivery ?? "",
        sla_days: editing?.sla_days ?? "",
    });
    const [submitting, setSubmitting] = useState(false);
    const { errors } = usePage().props;

    const handleChange = (field, value) => {
        const next = { ...form, [field]: value };

        if (field === "syscode" && value.length >= 3) {
            next.code = value.substring(0, 3).toUpperCase();
        } else if (field === "syscode" && value.length < 3) {
            next.code = value.toUpperCase();
        }

        setForm(next);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setSubmitting(true);

        const method = editing ? "put" : "post";
        const url = editing ? `/destinations/${editing.id}` : "/destinations";

        router[method](url, form, {
            preserveScroll: true,
            onSuccess: () => {
                if (!editing) {
                    setForm({
                        syscode: "", code: "", regional: "",
                        kabupaten: "", kecamatan: "", branch: "", zone_delivery: "", sla_days: "",
                    });
                }
                if (onCancel) onCancel();
            },
            onFinish: () => setSubmitting(false),
        });
    };

    const fields = [
        { key: "syscode",       label: "SYSCODE",        placeholder: "Cth: PKY20308",  required: true },
        { key: "code",          label: "3LC (Kode)",     placeholder: "Otomatis dari SYSCODE", required: true },
        { key: "regional",      label: "Regional",       placeholder: "Cth: JTBNN",     required: false },
        { key: "kabupaten",     label: "Kabupaten/Kota", placeholder: "Cth: Kota Mataram", required: true },
        { key: "kecamatan",     label: "Kecamatan",      placeholder: "Cth: Mataram",    required: false },
        { key: "branch",        label: "Branch",         placeholder: "Cth: CABANG UTAMA MATARAM", required: false },
        { key: "zone_delivery", label: "Zone Delivery",  placeholder: "A / B / C",       required: false },
        { key: "sla_days",      label: "SLA JNE (Hari)", placeholder: "Cth: 13", required: false, type: "number", min: 1, max: 365 },
    ];

    return (
        <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-1 text-base font-bold text-[#10264A]">
                {editing ? "✏️ Edit Data Daerah" : "➕ Tambah Data Daerah"}
            </h2>
            <p className="mb-5 text-xs text-slate-400">
                {editing
                    ? "Perbarui informasi daerah yang dipilih."
                    : "Isi SYSCODE dan kode 3LC akan otomatis terisi dari 3 karakter awal."}
            </p>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {fields.map(({ key, label, placeholder, required, type = "text", min, max }) => (
                    <div key={key}>
                        <label className="mb-1.5 block text-xs font-semibold text-slate-500">
                            {label}
                            {required && <span className="ml-0.5 text-red-400">*</span>}
                        </label>
                        <input
                            type={type}
                            value={form[key]}
                            onChange={(e) => handleChange(key, e.target.value)}
                            placeholder={placeholder}
                            required={required}
                            min={min}
                            max={max}
                            step={type === "number" ? 1 : undefined}
                            readOnly={key === "code"}
                            className={`w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-800 focus:bg-white focus:ring-2 focus:ring-blue-900/10 ${
                                key === "code" ? "cursor-not-allowed bg-slate-100 text-slate-500" : ""
                            }`}
                        />
                        {errors[key] && (
                            <p className="mt-1 text-xs text-red-500">{errors[key]}</p>
                        )}
                    </div>
                ))}
            </div>

            <div className="mt-5 flex gap-2">
                <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-xl bg-[#10264A] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#193965] disabled:opacity-50"
                >
                    {submitting ? "Menyimpan..." : editing ? "Perbarui" : "Simpan"}
                </button>
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-500 transition hover:bg-slate-50"
                    >
                        Batal
                    </button>
                )}
            </div>
        </form>
    );
}

// ─── Overlay Progress Import ─────────────────────────────────────────────────
function ImportProgressOverlay({ progress }) {
    if (!progress || progress.status === "done" || progress.status === "error") return null;

    return (
        <LoaderOverlay
            show
            type="import"
            message="Sedang Mengimpor Data Daerah..."
            subMessage="Mohon tunggu, proses import sedang berjalan. Jangan tutup halaman ini."
            progress={progress}
        />
    );
}
function ImportPanel({ onImportStart, importing }) {
    const fileRef = useRef(null);
    const [selectedFile, setSelectedFile] = useState(null);

    const handleFileChange = (e) => {
        const file = e.target.files?.[0] || null;
        setSelectedFile(file);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!selectedFile || importing) return;
        onImportStart(selectedFile);
        setSelectedFile(null);
        if (fileRef.current) fileRef.current.value = "";
    };

    return (
        <form onSubmit={handleSubmit} className="rounded-2xl border border-dashed border-blue-300 bg-blue-50/50 p-6">
            <h2 className="mb-1 text-base font-bold text-[#10264A]">📥 Import Data Daerah</h2>
            <p className="mb-4 text-xs text-slate-500">
                Upload file Excel (.xlsx) atau CSV (.csv) dengan kolom: <strong>SYSCODE</strong>, CODE, REGIONAL,{" "}
                <strong>KABUPATEN</strong>, KECAMATAN, dan <strong>SLA JNE</strong>. BRANCH dan ZONE CODE bersifat opsional.
                Data yang SYSCODE-nya sudah ada akan otomatis diperbarui.
            </p>

            <div className="flex flex-wrap items-end gap-3">
                <div className="flex-1">
                    <label className="mb-1.5 block text-xs font-semibold text-slate-500">
                        Pilih File <span className="text-red-400">*</span>
                    </label>
                    <input
                        ref={fileRef}
                        type="file"
                        accept=".csv,.xlsx,.xls,.txt"
                        onChange={handleFileChange}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-[#10264A] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white"
                    />
                </div>
                <button
                    type="submit"
                    disabled={!selectedFile || importing}
                    className="rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
                >
                    {importing ? "Mengimpor..." : "Mulai Import"}
                </button>
            </div>

            {selectedFile && (
                <p className="mt-3 text-xs text-slate-500">
                    📎 <strong>{selectedFile.name}</strong>{" "}
                    ({(selectedFile.size / 1024).toFixed(1)} KB)
                </p>
            )}
        </form>
    );
}

// ─── Halaman Master Daerah / SLA ─────────────────────────────────────────────
export default function DestinationIndex({ destinations, filters = {} }) {
    const { flash } = usePage().props;

    const [search, setSearch]         = useState(filters.search || "");
    const [showForm, setShowForm]     = useState(false);
    const [showImport, setShowImport] = useState(false);
    const [editing, setEditing]       = useState(null);
    const [deleting, setDeleting]     = useState(null);
    const [notice, setNotice] = useState(null);

    // Import state
    const [importing, setImporting]         = useState(false);
    const [importProgress, setImportProgress] = useState(null);

    const getCsrfToken = useCallback(() => {
        const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
        return match ? decodeURIComponent(match[1]) : "";
    }, []);

    const finishImport = useCallback((result) => {
        setImportProgress(result);
        setImporting(false);

        if (result.status === "done") {
            setShowImport(false);
            setNotice({
                type: "success",
                title: "Import Data Daerah Berhasil!",
                message: "Data daerah berhasil diproses dan disimpan.",
                created: Number(result.created) || 0,
                updated: Number(result.updated) || 0,
                total: Number(result.total) || 0,
                progress: result,
                time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
            });
            router.reload({ preserveScroll: true });
            return;
        }

        const errorMessage = String(result.error || "Import gagal diproses. Silakan periksa file dan coba kembali.")
            .replace(/[&<>"']/g, (character) => ({
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#039;",
            })[character]);

        setNotice({
            type: "error",
            title: "Import Data Daerah Gagal",
            message: errorMessage,
            progress: result,
            time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
        });
    }, []);

    const handleImportStart = useCallback(async (file) => {
        setNotice(null);
        setImporting(true);
        setImportProgress({ total: 0, processed: 0, created: 0, updated: 0, status: "starting" });

        const formData = new FormData();
        formData.append("file", file);

        try {
            const response = await fetch("/destinations/import", {
                method: "POST",
                headers: {
                    "X-XSRF-TOKEN": getCsrfToken(),
                    Accept: "application/x-ndjson, application/json",
                    "X-Requested-With": "XMLHttpRequest",
                },
                credentials: "same-origin",
                body: formData,
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                throw new Error(error.message || "Import gagal dimulai.");
            }
            if (!response.body) throw new Error("Browser tidak mendukung pembacaan progres import.");

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";
            let completed = false;

            const readProgressLine = (line) => {
                if (!line.trim()) return;

                const progress = JSON.parse(line);

                if (progress.status === "done" || progress.status === "error") {
                    completed = true;
                    finishImport(progress);
                } else {
                    setImportProgress(progress);
                }
            };

            while (!completed) {
                const { value, done } = await reader.read();
                buffer += decoder.decode(value || new Uint8Array(), { stream: !done });

                const lines = buffer.split(/\r?\n/);
                buffer = lines.pop() || "";
                for (const line of lines) {
                    readProgressLine(line);
                    if (completed) break;
                }

                if (done) {
                    readProgressLine(buffer);
                    break;
                }
            }

            if (!completed) throw new Error("Koneksi terputus sebelum import selesai.");
        } catch (error) {
            finishImport({
                total: 0,
                processed: 0,
                created: 0,
                updated: 0,
                status: "error",
                error: error.message || "Koneksi gagal. Pastikan server berjalan.",
            });
        }
    }, [finishImport, getCsrfToken]);
    const applySearch = () => {
        router.get(
            "/destinations",
            { search: search || undefined },
            { preserveState: true, replace: true },
        );
    };

    const handleKey = (e) => {
        if (e.key === "Enter") applySearch();
    };

    const handleEdit = (item) => {
        setEditing(item);
        setShowForm(true);
        setShowImport(false);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleDelete = (item) => {
        if (!confirm(`Hapus data daerah "${item.syscode} — ${item.kabupaten}"?`)) return;
        setDeleting(item.id);
        router.delete(`/destinations/${item.id}`, {
            preserveScroll: true,
            onFinish: () => setDeleting(null),
        });
    };

    const cancelForm = () => {
        setEditing(null);
        setShowForm(false);
    };

    const handleCloseOverlay = useCallback(() => {
        setImporting(false);
        setImportProgress(null);
        setNotice(null);
        setShowImport(false);
    }, []);

    const { data: rows, links } = destinations;

    return (
        <AuthenticatedLayout header="Master Daerah / SLA">
            <Head title="Master Daerah" />

            {/* Import Progress Overlay */}
            <ImportProgressOverlay progress={importProgress} />
            <ModalNotification
                notice={notice}
                onClose={handleCloseOverlay}
                duration={10000}
                showImportHints={false}
                successHref="/destinations"
                successLabel="Lihat Data Daerah"
            />

            <div className="space-y-6">
                {/* Flash Notification */}
                <FlashAlert flash={flash} />

                {/* Page Header */}
                <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-[#10264A] sm:text-3xl">
                            Master Daerah / SLA
                        </h1>
                        <p className="mt-1 text-sm text-slate-500">
                            Kelola SYSCODE, kabupaten, kecamatan, SLA JNE, branch, dan zona pengiriman
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2.5">
                        <button
                            type="button"
                            onClick={() => {
                                setShowImport(!showImport);
                                setShowForm(false);
                                setEditing(null);
                            }}
                            className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold shadow-sm transition active:scale-95 ${
                                showImport
                                    ? "border-emerald-600 bg-emerald-600 text-white"
                                    : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                            }`}
                        >
                            <span>{showImport ? "✕" : "📥"}</span>
                            {showImport ? "Tutup Import" : "Import File"}
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setEditing(null);
                                setShowForm(!showForm);
                                setShowImport(false);
                            }}
                            className="inline-flex items-center gap-2 rounded-xl bg-[#10264A] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-950/10 transition hover:bg-[#193965] active:scale-95"
                        >
                            <span>{showForm ? "✕" : "+"}</span>
                            {showForm ? "Tutup Form" : "Tambah Daerah"}
                        </button>
                    </div>
                </section>

                {/* Panel Import */}
                {showImport && (
                    <ImportPanel onImportStart={handleImportStart} importing={importing} />
                )}

                {/* Form Tambah / Edit */}
                {showForm && (
                    <DestinationForm editing={editing} onCancel={cancelForm} />
                )}

                {/* Info Card — Total Data */}
                <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-xl">
                        ◎
                    </div>
                    <div>
                        <p className="text-2xl font-extrabold tracking-tight text-[#10264A]">
                            {destinations.total?.toLocaleString("id-ID") || 0}
                        </p>
                        <p className="text-xs text-slate-400">Total data daerah terdaftar</p>
                    </div>
                </div>

                {/* Search */}
                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex gap-3">
                        <div className="relative flex-1">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                🔍
                            </span>
                            <input
                                type="text"
                                placeholder="Cari SYSCODE, kabupaten, kecamatan, branch..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={handleKey}
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-4 text-sm outline-none transition focus:border-blue-800 focus:bg-white focus:ring-2 focus:ring-blue-900/10"
                            />
                        </div>
                        <button
                            onClick={applySearch}
                            className="rounded-xl bg-[#10264A] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#193965]"
                        >
                            Cari
                        </button>
                        {search && (
                            <button
                                onClick={() => {
                                    setSearch("");
                                    router.get("/destinations");
                                }}
                                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-500 transition hover:bg-slate-50"
                            >
                                Reset
                            </button>
                        )}
                    </div>
                </section>

                {/* Table */}
                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 px-6 py-4">
                        <h2 className="font-bold text-[#10264A]">Daftar Daerah</h2>
                        <p className="mt-0.5 text-xs text-slate-400">
                            {destinations.total?.toLocaleString("id-ID") || 0} data ditemukan
                            {search && " (difilter)"}
                        </p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[900px] text-left text-sm">
                            <thead className="bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-400">
                                <tr>
                                    <th className="px-5 py-3.5 text-center w-12">No</th>
                                    <th className="px-5 py-3.5">SYSCODE</th>
                                    <th className="px-5 py-3.5">3LC</th>
                                    <th className="px-5 py-3.5">Regional</th>
                                    <th className="px-5 py-3.5">Kabupaten/Kota</th>
                                    <th className="px-5 py-3.5">Kecamatan</th>
                                    <th className="px-5 py-3.5 text-center">SLA JNE</th>
                                    <th className="px-5 py-3.5">Branch</th>
                                    <th className="px-5 py-3.5 text-center">Zone</th>
                                    <th className="px-5 py-3.5 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {rows && rows.length > 0 ? (
                                    rows.map((row, idx) => (
                                        <tr key={row.id} className="transition hover:bg-slate-50/70">
                                            <td className="px-5 py-3.5 text-center text-xs text-slate-400">
                                                {(destinations.current_page - 1) * destinations.per_page + idx + 1}
                                            </td>
                                            <td className="whitespace-nowrap px-5 py-3.5 font-semibold text-[#244775]">
                                                {row.syscode}
                                            </td>
                                            <td className="whitespace-nowrap px-5 py-3.5">
                                                <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-1 text-xs font-bold tracking-widest text-indigo-700 ring-1 ring-inset ring-indigo-200">
                                                    {row.code}
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap px-5 py-3.5 text-slate-500">
                                                {row.regional || "—"}
                                            </td>
                                            <td className="whitespace-nowrap px-5 py-3.5 font-medium text-slate-700">
                                                {row.kabupaten}
                                            </td>
                                            <td className="whitespace-nowrap px-5 py-3.5 text-slate-500">
                                                {row.kecamatan || "—"}
                                            </td>
                                            <td className="whitespace-nowrap px-5 py-3.5 text-center">
                                                {row.sla_days ? (
                                                    <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-200">
                                                        {row.sla_days} hari
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-300">—</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3.5 text-xs text-slate-500">
                                                <span className="line-clamp-1 max-w-[200px]">
                                                    {row.branch || "—"}
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap px-5 py-3.5 text-center">
                                                {row.zone_delivery ? (
                                                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-xs font-bold text-blue-700 ring-1 ring-blue-200">
                                                        {row.zone_delivery}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-300">—</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3.5 text-center">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleEdit(row)}
                                                        className="rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs font-medium text-amber-700 transition hover:bg-amber-100"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDelete(row)}
                                                        disabled={deleting === row.id}
                                                        className="rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                                                    >
                                                        {deleting === row.id ? "..." : "Hapus"}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={10} className="py-20 text-center text-slate-400">
                                            <p className="text-4xl">📭</p>
                                            <p className="mt-3 font-medium">
                                                Belum ada data daerah
                                            </p>
                                            <p className="mt-1 text-xs">
                                                Klik tombol "Tambah Daerah" atau "Import File" untuk menambahkan data.
                                            </p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {links && links.length > 3 && (
                        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-6 py-4">
                            <p className="text-xs text-slate-400">
                                Halaman {destinations.current_page} dari {destinations.last_page}
                            </p>
                            <div className="flex gap-1">
                                {links.map((link, i) => (
                                    <button
                                        key={i}
                                        disabled={!link.url}
                                        onClick={() => link.url && router.get(link.url)}
                                        className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                                            link.active
                                                ? "bg-[#10264A] text-white"
                                                : link.url
                                                  ? "border border-slate-200 text-slate-600 hover:bg-slate-50"
                                                  : "cursor-not-allowed text-slate-300"
                                        }`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </section>
            </div>
        </AuthenticatedLayout>
    );
}
