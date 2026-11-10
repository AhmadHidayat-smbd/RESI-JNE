import { useState, useEffect, useMemo, useRef } from "react";
import { Head, Link, router, usePage } from "@inertiajs/react";
import RoleBasedLayout from "@/Layouts/RoleBasedLayout";
import ModalNotification from "@/Components/ModalNotification";
import LoaderOverlay from "@/Components/LoaderOverlay";
import useShipmentExport from "@/Pages/Resi/useShipmentExport";

function FilterDropdown({
    id,
    label,
    value,
    onChange,
    placeholder,
    options,
    searchable = false,
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const containerRef = useRef(null);
    const triggerRef = useRef(null);
    const normalizedSearch = search.trim().toLocaleLowerCase("id-ID");
    const filteredOptions = searchable
        ? options.filter((option) =>
              option.label.toLocaleLowerCase("id-ID").includes(normalizedSearch),
          )
        : options;
    const selectedLabel = options.find((option) => option.value === value)?.label;

    useEffect(() => {
        if (!isOpen) return;

        const closeWhenOutside = (event) => {
            if (!containerRef.current?.contains(event.target)) {
                setIsOpen(false);
                setSearch("");
            }
        };
        const closeOnEscape = (event) => {
            if (event.key === "Escape") {
                setIsOpen(false);
                setSearch("");
                triggerRef.current?.focus();
            }
        };

        document.addEventListener("mousedown", closeWhenOutside);
        document.addEventListener("keydown", closeOnEscape);

        return () => {
            document.removeEventListener("mousedown", closeWhenOutside);
            document.removeEventListener("keydown", closeOnEscape);
        };
    }, [isOpen]);

    const selectOption = (option) => {
        onChange(option);
        setIsOpen(false);
        setSearch("");
        triggerRef.current?.focus();
    };

    return (
        <div className="min-w-0">
            <span className="mb-1.5 block text-xs font-semibold text-slate-500">{label}</span>
            <div ref={containerRef} className="relative">
                <button
                    ref={triggerRef}
                    type="button"
                    aria-haspopup="listbox"
                    aria-expanded={isOpen}
                    aria-label={`${label}: ${value || placeholder}`}
                    aria-controls={`${id}-options`}
                    onClick={() => setIsOpen((open) => !open)}
                    className={`flex h-11 w-full items-center justify-between gap-2 rounded-xl border bg-slate-50 px-3 text-left text-sm outline-none transition hover:border-slate-300 focus:border-blue-800 focus:bg-white focus:ring-2 focus:ring-blue-900/10 ${value ? "border-blue-200 text-slate-800" : "border-slate-200 text-slate-500"}`}
                >
                    <span className="truncate">{selectedLabel || placeholder}</span>
                    <svg aria-hidden="true" className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.22 7.22a.75.75 0 011.06 0L10 10.94l3.72-3.72a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.22 8.28a.75.75 0 010-1.06z" clipRule="evenodd" />
                    </svg>
                </button>

                {isOpen && (
                    <div className="absolute left-0 top-[calc(100%+0.5rem)] z-50 w-full rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-900/10">
                        {searchable && (
                            <div className="relative">
                                <svg
                                    aria-hidden="true"
                                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                >
                                    <path fillRule="evenodd" d="M8.5 3.5a5 5 0 103.16 8.87l3.73 3.72a.75.75 0 101.06-1.06l-3.72-3.73A5 5 0 008.5 3.5zm-3.5 5a3.5 3.5 0 117 0 3.5 3.5 0 01-7 0z" clipRule="evenodd" />
                                </svg>
                                <input
                                    autoFocus
                                    type="search"
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    placeholder={`Cari ${label}...`}
                                    aria-label={`Cari ${label}`}
                                    className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none placeholder:text-slate-400 focus:border-blue-700 focus:bg-white focus:ring-2 focus:ring-blue-900/10"
                                />
                            </div>
                        )}
                        <div id={`${id}-options`} role="listbox" aria-label={`Pilihan ${label}`} className={`${searchable ? "mt-2" : ""} max-h-56 overflow-y-auto`}>
                            <button
                                type="button"
                                role="option"
                                aria-selected={!value}
                                onClick={() => selectOption("")}
                                className={`w-full rounded-lg px-3 py-2 text-left text-sm transition hover:bg-slate-50 ${!value ? "font-semibold text-[#10264A]" : "text-slate-600"}`}
                            >
                                {placeholder}
                            </button>
                            {filteredOptions.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    role="option"
                                    aria-selected={value === option.value}
                                    onClick={() => selectOption(option.value)}
                                    className={`w-full rounded-lg px-3 py-2 text-left text-sm transition hover:bg-blue-50 hover:text-blue-800 ${value === option.value ? "bg-blue-50 font-semibold text-blue-800" : "text-slate-600"}`}
                                >
                                    {option.label}
                                </button>
                            ))}
                            {searchable && filteredOptions.length === 0 && (
                                <p className="px-3 py-3 text-center text-xs text-slate-400">Pilihan tidak ditemukan.</p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

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

const STATUS_FILTER_OPTIONS = [
    { value: "Success", label: "Success" },
    { value: "Failed", label: "Failed" },
    { value: "On Delivery", label: "On Delivery" },
    { value: "On Process", label: "On Process" },
];

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

export default function ResiIndex({ shipments, filters = {}, summary = {}, destinationOptions = [] }) {
    const [search, setSearch] = useState(filters.search || "");
    const [statusFilter, setStatus] = useState(filters.status || "");
    const [actionFilter, setAction] = useState(filters.action || "");
    const [dateFrom, setDateFrom] = useState(filters.date_from || "");
    const [dateTo, setDateTo] = useState(filters.date_to || "");
    const [threeLcFilter, setThreeLc] = useState(filters.three_lc || "");
    const [kabupatenFilter, setKabupaten] = useState(filters.kabupaten || "");
    const {
        isExporting: exportLoading,
        progress: exportProgress,
        notice: exportNotice,
        setNotice: setExportNotice,
        startExport,
    } = useShipmentExport();

    const { flash: pageFlash, auth } = usePage().props;
    const isAdmin = auth?.user?.role === "admin";
    const threeLcOptions = useMemo(
        () => [...new Set(destinationOptions.map((option) => option.code).filter(Boolean))]
            .map((code) => ({ value: code, label: code })),
        [destinationOptions],
    );
    const kabupatenOptions = useMemo(() => {
        const availableDestinations = threeLcFilter
            ? destinationOptions.filter((option) => option.code === threeLcFilter)
            : destinationOptions;

        return [...new Set(availableDestinations.map((option) => option.kabupaten).filter(Boolean))];
    }, [destinationOptions, threeLcFilter]);
    const hasActiveFilters = Boolean(
        search || statusFilter || actionFilter || dateFrom || dateTo || threeLcFilter || kabupatenFilter,
    );
    const returnToUrl = typeof window === "undefined"
        ? "/resi"
        : `${window.location.pathname}${window.location.search}`;

    useEffect(() => {
        setSearch(filters.search || "");
        setStatus(filters.status || "");
        setAction(filters.action || "");
        setDateFrom(filters.date_from || "");
        setDateTo(filters.date_to || "");
        setThreeLc(filters.three_lc || "");
        setKabupaten(filters.kabupaten || "");
    }, [
        filters.search,
        filters.status,
        filters.action,
        filters.date_from,
        filters.date_to,
        filters.three_lc,
        filters.kabupaten,
    ]);

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
                action: actionFilter || undefined,
                date_from: dateFrom || undefined,
                date_to: dateTo || undefined,
                three_lc: threeLcFilter || undefined,
                kabupaten: kabupatenFilter || undefined,
            },
            { preserveState: true, replace: true },
        );
    };

    const resetFilters = () => {
        setSearch("");
        setStatus("");
        setAction("");
        setDateFrom("");
        setDateTo("");
        setThreeLc("");
        setKabupaten("");
        router.get("/resi");
    };

    const handleKey = (e) => {
        if (e.key === "Enter") applyFilters();
    };

    const handleExport = () => startExport({
        filters: {
            status: statusFilter,
            action: actionFilter,
            search,
            date_from: dateFrom,
            date_to: dateTo,
            three_lc: threeLcFilter,
            kabupaten: kabupatenFilter,
        },
        summaryTotal: summary.total || shipments.total || 0,
        filteredTotal: shipments.total || 0,
    });

    // Klik stat card → langsung filter berdasarkan status
    const filterByStatus = (status) => {
        const newStatus = statusFilter === status ? "" : status;
        setStatus(newStatus);
        setAction(""); // reset action filter saat filter status
        router.get(
            "/resi",
            {
                search: search || undefined,
                status: newStatus || undefined,
                date_from: dateFrom || undefined,
                date_to: dateTo || undefined,
                three_lc: threeLcFilter || undefined,
                kabupaten: kabupatenFilter || undefined,
            },
            { preserveState: true, replace: true },
        );
    };

    // Klik stat card Hold/Cancel → filter berdasarkan aksi
    const filterByAction = (action) => {
        const newAction = actionFilter === action ? "" : action;
        setAction(newAction);
        setStatus(""); // reset status filter saat filter action
        router.get(
            "/resi",
            {
                search: search || undefined,
                action: newAction || undefined,
                date_from: dateFrom || undefined,
                date_to: dateTo || undefined,
                three_lc: threeLcFilter || undefined,
                kabupaten: kabupatenFilter || undefined,
            },
            { preserveState: true, replace: true },
        );
    };

    const { data: rows, links } = shipments;

    return (
        <RoleBasedLayout header="Monitoring Resi">
            <Head title="Monitoring Resi" />

            {/* Export Loader */}
            <LoaderOverlay
                show={exportLoading}
                type="export"
                message="Menyiapkan File Excel..."
                subMessage={exportProgress
                    ? "Menerima file Excel dari server..."
                    : "Server sedang menyiapkan file Excel. Mohon tunggu."}
                progress={exportProgress}
            />

            {/* Modal Notifikasi Export */}
            <ModalNotification
                notice={exportNotice}
                onClose={() => setExportNotice(null)}
                duration={12000}
                showImportHints={false}
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
                            disabled={exportLoading}
                            className="inline-flex items-center gap-2 rounded-xl border border-emerald-600 bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-95 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                            title={
                                hasActiveFilters
                                    ? "Export data hasil filter ke format Excel"
                                    : "Export seluruh data resi ke format Excel"
                            }
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
                            {hasActiveFilters ? (
                                <>
                                    <span>Export Excel</span>
                                    {statusFilter && (
                                        <span className="rounded-full bg-emerald-800/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                                            {statusFilter}
                                        </span>
                                    )}
                                    {actionFilter && (
                                        <span className="rounded-full bg-orange-700/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                                            {actionFilter}
                                        </span>
                                    )}
                                </>
                            ) : (
                                <span>Export Semua Resi ({summary.total?.toLocaleString("id-ID") || 0})</span>
                            )}
                        </button>
                        {isAdmin && (
                        <Link
                            href="/resi/import"
                            className="inline-flex items-center gap-2 rounded-xl bg-[#10264A] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-950/10 transition hover:bg-[#193965]"
                        >
                            <span>⬆</span> Import Data
                        </Link>
                        )}
                    </div>
                </section>

                <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
                    <StatCard
                        label="Total Resi"
                        value={summary.total}
                        icon="📦"
                        iconBg="bg-blue-50"
                        iconColor="text-blue-700"
                        activeColor="border-[#10264A] ring-[#10264A]"
                        onClick={() => {
                            setStatus("");
                            setAction("");
                            router.get(
                                "/resi",
                                {
                                    search: search || undefined,
                                    date_from: dateFrom || undefined,
                                    date_to: dateTo || undefined,
                                    three_lc: threeLcFilter || undefined,
                                    kabupaten: kabupatenFilter || undefined,
                                },
                                { preserveState: true, replace: true },
                            );
                        }}
                        active={!statusFilter && !actionFilter && !threeLcFilter && !kabupatenFilter}
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
                    <StatCard
                        label="Hold"
                        value={summary.hold}
                        icon="✋"
                        iconBg="bg-orange-50"
                        iconColor="text-orange-700"
                        activeColor="border-orange-500 ring-orange-500"
                        onClick={() => filterByAction("hold")}
                        active={actionFilter === "hold"}
                    />
                    <StatCard
                        label="Cancel"
                        value={summary.cancel}
                        icon="🚫"
                        iconBg="bg-red-50"
                        iconColor="text-red-700"
                        activeColor="border-red-500 ring-red-500"
                        onClick={() => filterByAction("cancel")}
                        active={actionFilter === "cancel"}
                    />
                </section>

                {/* Filters */}
                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7">
                        {/* Search */}
                        <div className="min-w-0 xl:col-span-2">
                            <label className="mb-1.5 block text-xs font-semibold text-slate-500">Cari resi</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                🔍
                                </span>
                                <input
                                    type="text"
                                    aria-label="Cari AWB, penerima, atau runsheet"
                                    placeholder="Cari AWB, penerima, runsheet..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyDown={handleKey}
                                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-800 focus:bg-white focus:ring-2 focus:ring-blue-900/10"
                                />
                            </div>
                        </div>

                        <FilterDropdown
                            id="three-lc"
                            label="3LC"
                            value={threeLcFilter}
                            onChange={(value) => {
                                setThreeLc(value);
                                setKabupaten("");
                            }}
                            placeholder="Semua 3LC"
                            options={threeLcOptions}
                            searchable
                        />

                        <FilterDropdown
                            id="kabupaten"
                            label="Kabupaten"
                            value={kabupatenFilter}
                            onChange={setKabupaten}
                            placeholder="Semua Kabupaten"
                            options={kabupatenOptions.map((kabupaten) => ({ value: kabupaten, label: kabupaten }))}
                            searchable={false}
                        />

                        <FilterDropdown
                            id="status"
                            label="Status"
                            value={statusFilter}
                            onChange={setStatus}
                            placeholder="Semua Status"
                            options={STATUS_FILTER_OPTIONS}
                            searchable={false}
                        />

                        {/* Date range */}
                        <label className="block min-w-0">
                            <span className="mb-1.5 block text-xs font-semibold text-slate-500">Dari tanggal</span>
                            <input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none transition hover:border-slate-300 focus:border-blue-800 focus:bg-white focus:ring-2 focus:ring-blue-900/10"
                            />
                        </label>
                        <label className="block min-w-0">
                            <span className="mb-1.5 block text-xs font-semibold text-slate-500">Sampai tanggal</span>
                            <input
                                type="date"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none transition hover:border-slate-300 focus:border-blue-800 focus:bg-white focus:ring-2 focus:ring-blue-900/10"
                            />
                        </label>
                    </div>

                    <div className="mt-3 flex gap-2">
                        <button
                            onClick={applyFilters}
                            className="rounded-xl bg-[#10264A] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#193965]"
                        >
                            Terapkan Filter
                        </button>
                        {hasActiveFilters && (
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
                                    actionFilter ||
                                    search ||
                                    dateFrom ||
                                    dateTo ||
                                    threeLcFilter ||
                                    kabupatenFilter) &&
                                    " (difilter)"}
                            </p>
                        </div>
                        {shipments.total > 0 && (
                            <button
                                type="button"
                                onClick={handleExport}
                                disabled={exportLoading}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 active:scale-95 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                                title="Download data hasil filter ini ke file Excel"
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
                                    <th className="w-14 px-5 py-3.5 text-center">No.</th>
                                    <th className="px-5 py-3.5">AWB / Resi</th>
                                    <th className="px-5 py-3.5">Penerima</th>
                                    <th className="px-5 py-3.5">
                                        Tgl & Jam Entry
                                    </th>
                                    {/* <th className="px-5 py-3.5">Tujuan</th> */}
                                    <th className="px-5 py-3.5">3LC</th>
                                    <th className="px-5 py-3.5">Kabupaten</th>
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
                                    rows.map((row, index) => (
                                        <tr
                                            key={row.id}
                                            className="transition hover:bg-slate-50/70"
                                        >
                                            <td className="whitespace-nowrap px-5 py-3.5 text-center text-xs font-medium text-slate-400">
                                                {((shipments.from ?? 1) + index).toLocaleString("id-ID")}
                                            </td>
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
                                            <td className="whitespace-nowrap px-5 py-3.5">
                                                {row.destination_code ? (
                                                    <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-1 text-xs font-bold tracking-widest text-indigo-700 ring-1 ring-inset ring-indigo-200">
                                                        {row.destination_code.substring(0, 3).toUpperCase()}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-300">—</span>
                                                )}
                                            </td>
                                            <td className="whitespace-nowrap px-5 py-3.5 text-xs text-slate-600">
                                                {row.destination?.kabupaten || (
                                                    <span className="text-slate-300">—</span>
                                                )}
                                            </td>
                                            <td className="whitespace-nowrap px-5 py-3.5 text-xs text-slate-500">
                                                {formatDate(row.tgl_received)}
                                            </td>
                                            {/* <td className="whitespace-nowrap px-5 py-3.5 text-slate-500">
                                                {row.receiver_reason || "—"}
                                            </td> */}
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-1.5">
                                                    <StatusBadge status={row.status} />
                                                    {row.action && (
                                                        <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                                                            row.action === "hold"
                                                                ? "bg-orange-50 text-orange-600 ring-1 ring-orange-200"
                                                                : "bg-red-50 text-red-600 ring-1 ring-red-200"
                                                        }`}>
                                                            {row.action === "hold" ? "✋" : "🚫"} {row.action}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <Link
                                                    href={`/resi/show/${row.id}?return_url=${encodeURIComponent(returnToUrl)}`}
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
                                                {isAdmin ? (
                                                    <>
                                                        Coba reset filter atau{" "}
                                                        <Link href="/resi/import" className="text-[#10264A] underline">
                                                            import data baru
                                                        </Link>
                                                    </>
                                                ) : "Coba reset filter untuk menampilkan data lainnya."}
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
        </RoleBasedLayout>
    );
}
