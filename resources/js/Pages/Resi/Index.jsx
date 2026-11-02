import { useState, useEffect } from "react";
import { Head, Link, router, usePage } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import ModalNotification from "@/Components/ModalNotification";
import LoaderOverlay from "@/Components/LoaderOverlay";

const STATUS_CFG = {
    Success: {
        cls: "bg-emerald-50 text-emerald-700 border border-emerald-200",
        dot: "bg-emerald-500",
    },
    Failed: {
        cls: "bg-red-50 text-red-700 border border-red-200",
        dot: "bg-red-500",
    },
    "On Delivery": {
        cls: "bg-blue-50 text-blue-700 border border-blue-200",
        dot: "bg-blue-500",
    },
    "On Process": {
        cls: "bg-amber-50 text-amber-700 border border-amber-200",
        dot: "bg-amber-500",
    },
};

// Helper format tanggal & jam persis sesuai database tanpa pergeseran timezone
function formatDateTime(val) {
    if (!val) return "—";
    const str = String(val).trim();
    const match = str.match(
        /^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})(?::(\d{2}))?/,
    );
    if (match) {
        const [_, y, m, d, hr, mn] = match;
        return `${d}/${m}/${y} ${hr}:${mn}`;
    }
    return str;
}

function formatDate(val) {
    if (!val) return "—";
    const str = String(val).trim();
    const match = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
        const [_, y, m, d] = match;
        const MONTHS = [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "Mei",
            "Jun",
            "Jul",
            "Ags",
            "Sep",
            "Okt",
            "Nov",
            "Des",
        ];
        const mi = parseInt(m, 10) - 1;
        return `${parseInt(d, 10)} ${MONTHS[mi] || m} ${y}`;
    }
    return str;
}

function StatusBadge({ status }) {
    const cfg = STATUS_CFG[status] || {
        cls: "bg-slate-100 text-slate-600",
        dot: "bg-slate-400",
    };
    return (
        <span
            className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${cfg.cls}`}
        >
            <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
            {status || "—"}
        </span>
    );
}

function StatCard({
    label,
    value,
    percentage,
    icon,
    iconBg,
    iconColor,
    activeColor,
    onClick,
    active,
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`group relative flex flex-col justify-between rounded-2xl border bg-white p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg cursor-pointer ${
                active
                    ? `${activeColor} shadow-md ring-2 ring-offset-2 ring-offset-slate-50`
                    : "border-slate-200/80 shadow-sm hover:border-slate-300"
            }`}
        >
            {/* Header: Label & Icon */}
            <div className="flex items-start justify-between gap-2">
                <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        {label}
                    </span>
                    {percentage !== undefined && (
                        <p className="mt-0.5 text-[11px] font-medium text-slate-400">
                            {percentage}% dari total
                        </p>
                    )}
                </div>
                <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg font-bold shadow-sm transition-transform duration-200 group-hover:scale-110 ${iconBg} ${iconColor}`}
                >
                    {icon}
                </div>
            </div>

            {/* Value Counter */}
            <div className="mt-3">
                <p className="text-3xl font-extrabold tracking-tight text-[#10264A]">
                    {Number(value || 0).toLocaleString("id-ID")}
                </p>
            </div>

            {/* Footer Status Indicator */}
            <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs">
                {active ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#10264A] px-2.5 py-0.5 text-[10px] font-semibold text-white">
                        <span>✓</span> Sedang Difilter
                    </span>
                ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 transition-colors group-hover:text-[#10264A]">
                        Filter status ini{" "}
                        <span className="transition-transform group-hover:translate-x-0.5">
                            →
                        </span>
                    </span>
                )}

                {active && (
                    <span className="text-[10px] text-slate-400">
                        (klik utk reset)
                    </span>
                )}
            </div>
        </button>
    );
}

export default function ResiIndex({ shipments, filters = {}, summary = {} }) {
    const [search, setSearch] = useState(filters.search || "");
    const [statusFilter, setStatus] = useState(filters.status || "");
    const [dateFrom, setDateFrom] = useState(filters.date_from || "");
    const [dateTo, setDateTo] = useState(filters.date_to || "");
    const [exportNotice, setExportNotice] = useState(null);
    const [exportLoading, setExportLoading] = useState(false);

    const { flash: pageFlash } = usePage().props;

    // Menampilkan flash session jika diarahkan dari aksi lain
    useEffect(() => {
        if (pageFlash?.success) {
            setExportNotice({
                type: "success",
                title: "Berhasil!",
                message: pageFlash.message || "Operasi berhasil dilakukan.",
                batch: pageFlash.batch,
                created: pageFlash.created_count,
                updated: pageFlash.updated_count,
                total: pageFlash.total_count,
                time: new Date().toLocaleTimeString("id-ID", {
                    hour: "2-digit",
                    minute: "2-digit",
                }),
            });
        } else if (pageFlash?.error) {
            setExportNotice({
                type: "error",
                title: "Terjadi Kesalahan",
                message: pageFlash.error,
                time: new Date().toLocaleTimeString("id-ID", {
                    hour: "2-digit",
                    minute: "2-digit",
                }),
            });
        }
    }, [pageFlash]);

    const totalCount = Number(summary.total) || 0;
    const calcPct = (val) =>
        totalCount > 0
            ? ((Number(val || 0) / totalCount) * 100).toFixed(1)
            : "0.0";

    const applyFilters = () => {
        router.get(
            "/resi",
            {
                search: search || undefined,
                status: statusFilter || undefined,
                date_from: dateFrom || undefined,
                date_to: dateTo || undefined,
            },
            { preserveState: true, replace: true },
        );
    };

    const resetFilters = () => {
        setSearch("");
        setStatus("");
        setDateFrom("");
        setDateTo("");
        router.get("/resi");
    };

    const handleKey = (e) => {
        if (e.key === "Enter") applyFilters();
    };

    const handleExport = () => {
        const params = new URLSearchParams();
        if (statusFilter) params.append("status", statusFilter);
        if (search) params.append("search", search);
        if (dateFrom) params.append("date_from", dateFrom);
        if (dateTo) params.append("date_to", dateTo);

        const queryStr = params.toString();
        const exportUrl = queryStr
            ? `/resi/export?${queryStr}`
            : "/resi/export";

        // Susun preview nama file sesuai format backend
        const parts = ["Data_Resi"];
        if (statusFilter) parts.push(statusFilter.replace(/\s+/g, "_"));
        if (dateFrom && dateTo) {
            parts.push(`${dateFrom}_sd_${dateTo}`);
        } else if (dateFrom) {
            parts.push(`dari_${dateFrom}`);
        } else if (dateTo) {
            parts.push(`sampai_${dateTo}`);
        }
        parts.push(new Date().toISOString().slice(0, 10).replace(/-/g, ""));
        const fileNamePreview = parts.join("_") + ".xlsx";

        const now = new Date();
        const timeStr = now.toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
        });

        // Tampilkan loader sebentar, lalu tampilkan modal notifikasi
        setExportLoading(true);
        setTimeout(() => {
            window.location.href = exportUrl;
        }, 300);

        setTimeout(() => {
            setExportLoading(false);
            setExportNotice({
                type: "export",
                title: "File Excel Berhasil Diunduh",
                message: `Browser Anda sedang mengunduh file <strong>${fileNamePreview}</strong>. Jika tidak otomatis, klik tombol di bawah.`,
                status: statusFilter || "Semua Status",
                total: shipments.total || 0,
                search: search || null,
                dateRange:
                    dateFrom && dateTo
                        ? `${dateFrom} s/d ${dateTo}`
                        : dateFrom
                          ? `Dari ${dateFrom}`
                          : dateTo
                            ? `Sampai ${dateTo}`
                            : null,
                fileName: fileNamePreview,
                downloadUrl: exportUrl,
                time: timeStr,
            });
        }, 1800);
    };

    // Klik stat card → langsung filter berdasarkan status
    const filterByStatus = (status) => {
        // Jika sudah aktif, klik lagi = reset filter
        const newStatus = statusFilter === status ? "" : status;
        setStatus(newStatus);
        router.get(
            "/resi",
            {
                search: search || undefined,
                status: newStatus || undefined,
                date_from: dateFrom || undefined,
                date_to: dateTo || undefined,
            },
            { preserveState: true, replace: true },
        );
    };

    const { data: rows, links, meta } = shipments;

    return (
        <AuthenticatedLayout header="Monitoring Resi">
            <Head title="Monitoring Resi" />

            {/* Export Loader */}
            <LoaderOverlay
                show={exportLoading}
                type="export"
                message="Menyiapkan File Excel..."
                subMessage="Mohon tunggu, data sedang diproses dan disiapkan untuk diunduh."
            />

            {/* Modal Notifikasi Export */}
            <ModalNotification
                notice={exportNotice}
                onClose={() => setExportNotice(null)}
                duration={12000}
            />

            <div className="space-y-6">
                {/* Page Header */}
                <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-[#10264A] sm:text-3xl">
                            Monitoring Resi
                        </h1>
                        <p className="mt-1 text-sm text-slate-500">
                            Pantau status pengiriman secara detail
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2.5">
                        <button
                            type="button"
                            onClick={handleExport}
                            className="inline-flex items-center gap-2 rounded-xl border border-emerald-600 bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-95 cursor-pointer"
                            title="Export data saat ini (sesuai filter) ke format Excel"
                        >
                            <svg
                                className="h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2.2}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                            </svg>
                            <span>Export Excel</span>
                            {statusFilter && (
                                <span className="rounded-full bg-emerald-800/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                                    {statusFilter}
                                </span>
                            )}
                        </button>
                        <Link
                            href="/resi/import"
                            className="inline-flex items-center gap-2 rounded-xl bg-[#10264A] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-950/10 transition hover:bg-[#193965]"
                        >
                            <span>⬆</span> Import Data
                        </Link>
                    </div>
                </section>

                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                    <StatCard
                        label="Total Resi"
                        value={summary.total}
                        icon="📦"
                        iconBg="bg-blue-50"
                        iconColor="text-blue-700"
                        activeColor="border-[#10264A] ring-[#10264A]"
                        onClick={() => {
                            setStatus("");
                            router.get(
                                "/resi",
                                {
                                    search: search || undefined,
                                    date_from: dateFrom || undefined,
                                    date_to: dateTo || undefined,
                                },
                                { preserveState: true, replace: true },
                            );
                        }}
                        active={!statusFilter}
                    />
                    <StatCard
                        label="Berhasil"
                        value={summary.success}
                        percentage={calcPct(summary.success)}
                        icon="✅"
                        iconBg="bg-emerald-50"
                        iconColor="text-emerald-700"
                        activeColor="border-emerald-500 ring-emerald-500"
                        onClick={() => filterByStatus("Success")}
                        active={statusFilter === "Success"}
                    />
                    <StatCard
                        label="Gagal"
                        value={summary.failed}
                        percentage={calcPct(summary.failed)}
                        icon="❌"
                        iconBg="bg-red-50"
                        iconColor="text-red-700"
                        activeColor="border-red-500 ring-red-500"
                        onClick={() => filterByStatus("Failed")}
                        active={statusFilter === "Failed"}
                    />
                    <StatCard
                        label="On Delivery"
                        value={summary.onDelivery}
                        percentage={calcPct(summary.onDelivery)}
                        icon="🚚"
                        iconBg="bg-blue-50"
                        iconColor="text-blue-700"
                        activeColor="border-blue-500 ring-blue-500"
                        onClick={() => filterByStatus("On Delivery")}
                        active={statusFilter === "On Delivery"}
                    />
                    <StatCard
                        label="On Process"
                        value={summary.onProcess}
                        percentage={calcPct(summary.onProcess)}
                        icon="⏳"
                        iconBg="bg-amber-50"
                        iconColor="text-amber-700"
                        activeColor="border-amber-500 ring-amber-500"
                        onClick={() => filterByStatus("On Process")}
                        active={statusFilter === "On Process"}
                    />
                </section>

                {/* Filters */}
                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
                        {/* Search */}
                        <div className="relative xl:col-span-2">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                🔍
                            </span>
                            <input
                                type="text"
                                placeholder="Cari AWB, penerima, runsheet..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={handleKey}
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-4 text-sm outline-none transition focus:border-blue-800 focus:bg-white focus:ring-2 focus:ring-blue-900/10"
                            />
                        </div>

                        {/* Status */}
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatus(e.target.value)}
                            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-blue-800 focus:bg-white"
                        >
                            <option value="">Semua Status</option>
                            <option value="Success">Success</option>
                            <option value="Failed">Failed</option>
                            <option value="On Delivery">On Delivery</option>
                            <option value="On Process">On Process</option>
                        </select>

                        {/* Date range */}
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-blue-800 focus:bg-white"
                            title="Dari tanggal"
                        />
                        <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-blue-800 focus:bg-white"
                            title="Sampai tanggal"
                        />
                    </div>

                    <div className="mt-3 flex gap-2">
                        <button
                            onClick={applyFilters}
                            className="rounded-xl bg-[#10264A] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#193965]"
                        >
                            Terapkan Filter
                        </button>
                        {(search || statusFilter || dateFrom || dateTo) && (
                            <button
                                onClick={resetFilters}
                                className="rounded-xl border border-slate-200 px-5 py-2 text-sm font-medium text-slate-500 transition hover:bg-slate-50"
                            >
                                Reset
                            </button>
                        )}
                    </div>
                </section>

                {/* Table */}
                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                        <div>
                            <h2 className="font-bold text-[#10264A]">
                                Daftar Resi
                            </h2>
                            <p className="mt-0.5 text-xs text-slate-400">
                                {shipments.total?.toLocaleString("id-ID") || 0}{" "}
                                data ditemukan
                                {(statusFilter ||
                                    search ||
                                    dateFrom ||
                                    dateTo) &&
                                    " (difilter)"}
                            </p>
                        </div>
                        {shipments.total > 0 && (
                            <button
                                type="button"
                                onClick={handleExport}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 active:scale-95 cursor-pointer"
                                title="Download seluruh data hasil filter ini ke file Excel"
                            >
                                <svg
                                    className="h-3.5 w-3.5"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                    />
                                </svg>
                                <span>
                                    Download Excel (
                                    {shipments.total?.toLocaleString("id-ID")})
                                </span>
                            </button>
                        )}
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[900px] text-left text-sm">
                            <thead className="bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-400">
                                <tr>
                                    <th className="px-5 py-3.5">AWB / Resi</th>
                                    <th className="px-5 py-3.5">Penerima</th>
                                    <th className="px-5 py-3.5">
                                        Tgl & Jam Entry
                                    </th>
                                    {/* <th className="px-5 py-3.5">Tujuan</th> */}
                                    <th className="px-5 py-3.5">Layanan</th>
                                    <th className="px-5 py-3.5">
                                        Tgl Received
                                    </th>
                                    {/* <th className="px-5 py-3.5">Keterangan</th> */}
                                    <th className="px-5 py-3.5">Status</th>
                                    <th className="px-5 py-3.5">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {rows && rows.length > 0 ? (
                                    rows.map((row) => (
                                        <tr
                                            key={row.id}
                                            className="transition hover:bg-slate-50/70"
                                        >
                                            <td className="whitespace-nowrap px-5 py-3.5 font-semibold text-[#244775]">
                                                {row.awb || "—"}
                                            </td>
                                            <td className="whitespace-nowrap px-5 py-3.5 text-slate-700">
                                                {row.consignee_name || "—"}
                                            </td>
                                            <td className="whitespace-nowrap px-5 py-3.5 text-xs font-semibold text-[#10264A]">
                                                {formatDateTime(
                                                    row.tgl_jam_entry,
                                                )}
                                            </td>
                                            {/* <td className="px-5 py-3.5 text-slate-500">
                                                <span className="line-clamp-1 max-w-[180px]">
                                                    {row.destination_name ||
                                                        "—"}
                                                </span>
                                            </td> */}
                                            <td className="whitespace-nowrap px-5 py-3.5 text-slate-500">
                                                {row.service || "—"}
                                            </td>
                                            <td className="whitespace-nowrap px-5 py-3.5 text-xs text-slate-500">
                                                {formatDate(row.tgl_received)}
                                            </td>
                                            {/* <td className="whitespace-nowrap px-5 py-3.5 text-slate-500">
                                                {row.receiver_reason || "—"}
                                            </td> */}
                                            <td className="px-5 py-3.5">
                                                <StatusBadge
                                                    status={row.status}
                                                />
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <Link
                                                    href={`/resi/show/${row.id}`}
                                                    className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-[#10264A] hover:text-white"
                                                >
                                                    Detail
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={9}
                                            className="py-20 text-center text-slate-400"
                                        >
                                            <p className="text-4xl">📭</p>
                                            <p className="mt-3 font-medium">
                                                Tidak ada data ditemukan
                                            </p>
                                            <p className="mt-1 text-xs">
                                                Coba reset filter atau{" "}
                                                <Link
                                                    href="/resi/import"
                                                    className="text-[#10264A] underline"
                                                >
                                                    import data baru
                                                </Link>
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
                                Halaman {shipments.current_page} dari{" "}
                                {shipments.last_page}
                            </p>
                            <div className="flex gap-1">
                                {links.map((link, i) => (
                                    <button
                                        key={i}
                                        disabled={!link.url}
                                        onClick={() =>
                                            link.url && router.get(link.url)
                                        }
                                        className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                                            link.active
                                                ? "bg-[#10264A] text-white"
                                                : link.url
                                                  ? "border border-slate-200 text-slate-600 hover:bg-slate-50"
                                                  : "cursor-not-allowed text-slate-300"
                                        }`}
                                        dangerouslySetInnerHTML={{
                                            __html: link.label,
                                        }}
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
