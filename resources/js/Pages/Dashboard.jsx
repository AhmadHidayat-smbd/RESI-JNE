import { useState } from "react";
import { Head, Link, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import {
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from "recharts";

// ─── Color Palette ────────────────────────────────────────────────────────────
const COLORS = {
    success: "#10b981",
    failed: "#ef4444",
    onDelivery: "#3b82f6",
    onProcess: "#f59e0b",
    primary: "#10264A",
    primaryL: "#244775",
    accent: "#E31E24",
};

const SERVICE_COLORS = [
    "#6366f1",
    "#8b5cf6",
    "#a855f7",
    "#d946ef",
    "#ec4899",
    "#f43f5e",
    "#f97316",
    "#eab308",
];

// ─── Status Color Helper (Memastikan Success selalu Hijau & Failed selalu Merah) ──
function getStatusColor(status) {
    const s = String(status || "")
        .toLowerCase()
        .trim();
    if (
        s.includes("success") ||
        s.includes("sukses") ||
        s.includes("berhasil") ||
        s === "pod"
    ) {
        return COLORS.success; // Hijau (#10b981)
    }
    if (
        s.includes("failed") ||
        s.includes("gagal") ||
        s.includes("retur") ||
        s.includes("cancel")
    ) {
        return COLORS.failed; // Merah (#ef4444)
    }
    if (s.includes("delivery") || s.includes("antar") || s.includes("kirim")) {
        return COLORS.onDelivery; // Biru (#3b82f6)
    }
    if (
        s.includes("process") ||
        s.includes("proces") ||
        s.includes("proses") ||
        s.includes("transit")
    ) {
        return COLORS.onProcess; // Kuning / Amber (#f59e0b)
    }
    return "#64748b";
}

// ─── Pie Chart Tooltip (Tanpa tanda titik dua :) ──────────────────────────────
function PieChartTooltip({ active, payload }) {
    if (!active || !payload?.length) return null;
    const item = payload[0];
    const color = getStatusColor(item.name);
    return (
        <div className="rounded-xl border border-slate-200 bg-white/95 px-3 py-2 shadow-xl backdrop-blur-sm">
            <div className="flex items-center gap-2 text-xs">
                <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: color }}
                />
                <span className="font-semibold text-slate-700">
                    {item.name}
                </span>
                <span className="font-bold text-[#10264A]">
                    {Number(item.value).toLocaleString("id-ID")} resi
                </span>
            </div>
        </div>
    );
}

// ─── Status Chart Tooltip (Detail Lengkap & Persentase) ────────────────────────
function StatusChartTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    const row = payload[0]?.payload || {};
    const total =
        row.total ||
        payload.reduce((acc, p) => acc + (Number(p.value) || 0), 0);

    return (
        <div className="rounded-xl border border-slate-200 bg-white/95 p-3.5 shadow-xl backdrop-blur-sm min-w-[210px]">
            <p className="text-xs font-bold text-[#10264A]">
                {row.fullDate || label}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-400 border-b border-slate-100 pb-2 mb-2">
                Total Transaksi:{" "}
                <span className="font-semibold text-slate-700">
                    {Number(total).toLocaleString("id-ID")} resi
                </span>
            </p>
            <div className="space-y-1.5">
                {payload.map((entry, i) => {
                    const val = Number(entry.value) || 0;
                    const pct =
                        total > 0 ? ((val / total) * 100).toFixed(1) : 0;
                    return (
                        <div
                            key={i}
                            className="flex items-center justify-between gap-3 text-xs"
                        >
                            <span className="flex items-center gap-1.5">
                                <span
                                    className="h-2.5 w-2.5 rounded-full"
                                    style={{ backgroundColor: entry.color }}
                                />
                                <span className="text-slate-600 font-medium">
                                    {entry.name}
                                </span>
                            </span>
                            <span className="font-bold text-slate-800">
                                {val.toLocaleString("id-ID")}{" "}
                                <span className="text-[10px] text-slate-400 font-normal">
                                    ({pct}%)
                                </span>
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({
    label,
    value,
    note,
    icon,
    bgClass,
    textClass,
    href,
    trend,
    sparkData,
}) {
    const trendIcon = trend === "up" ? "▲" : trend === "down" ? "▼" : "●";
    const trendColor =
        trend === "up"
            ? "text-emerald-500"
            : trend === "down"
              ? "text-red-500"
              : "text-slate-400";

    const content = (
        <>
            <div className="flex items-start justify-between">
                <p className="text-sm font-medium text-slate-500">{label}</p>
                <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg font-bold ${bgClass} ${textClass}`}
                >
                    {icon}
                </div>
            </div>
            <p className="mt-3 text-3xl font-bold tracking-tight text-[#10264A]">
                {Number(value || 0).toLocaleString("id-ID")}
            </p>
            {note && (
                <p className={`mt-1 text-xs ${trendColor}`}>
                    <span className="mr-1">{trendIcon}</span>
                    {note}
                </p>
            )}
            {href && (
                <p className="mt-2 text-[10px] font-medium text-slate-400 transition group-hover:text-[#10264A]">
                    Klik untuk lihat detail →
                </p>
            )}
        </>
    );

    if (href) {
        return (
            <Link
                href={href}
                className="group block rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md hover:border-[#10264A]/30 cursor-pointer"
            >
                {content}
            </Link>
        );
    }
    return (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            {content}
        </div>
    );
}

// ─── Success Rate Gauge ───────────────────────────────────────────────────────
function SuccessRateGauge({ rate }) {
    const r = 54,
        cx = 64,
        cy = 64,
        stroke = 10;
    const circ = 2 * Math.PI * r;
    const fillPct = Math.min(rate, 100);
    const dashLen = (fillPct / 100) * circ;
    const color =
        rate >= 80
            ? COLORS.success
            : rate >= 50
              ? COLORS.onProcess
              : COLORS.failed;

    return (
        <div className="flex flex-col items-center">
            <svg viewBox="0 0 128 128" className="h-32 w-32">
                <circle
                    cx={cx}
                    cy={cy}
                    r={r}
                    fill="none"
                    stroke="#f1f5f9"
                    strokeWidth={stroke}
                />
                <circle
                    cx={cx}
                    cy={cy}
                    r={r}
                    fill="none"
                    stroke={color}
                    strokeWidth={stroke}
                    strokeDasharray={`${dashLen} ${circ - dashLen}`}
                    strokeDashoffset={circ * 0.25}
                    strokeLinecap="round"
                    className="transition-all duration-1000"
                    style={{
                        transformOrigin: "center",
                        transform: "rotate(-90deg)",
                    }}
                />
                <text
                    x={cx}
                    y={cy - 4}
                    textAnchor="middle"
                    style={{ fontSize: 22, fontWeight: 800 }}
                    fill={COLORS.primary}
                >
                    {rate.toFixed(1)}%
                </text>
                <text
                    x={cx}
                    y={cy + 14}
                    textAnchor="middle"
                    fill="#94a3b8"
                    style={{ fontSize: 9 }}
                >
                    Success Rate
                </text>
            </svg>
        </div>
    );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
    const MAP = {
        Success: "bg-emerald-50 text-emerald-700",
        Failed: "bg-red-50 text-red-700",
        "On Delivery": "bg-blue-50 text-blue-700",
        "On Process": "bg-amber-50 text-amber-700",
    };
    return (
        <span
            className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${MAP[status] || "bg-slate-100 text-slate-600"}`}
        >
            {status || "—"}
        </span>
    );
}

// ─── Format Rupiah ────────────────────────────────────────────────────────────
function formatRupiah(num) {
    if (!num) return "Rp 0";
    if (num >= 1_000_000_000) return `Rp ${(num / 1_000_000_000).toFixed(1)}M`;
    if (num >= 1_000_000) return `Rp ${(num / 1_000_000).toFixed(1)}Jt`;
    if (num >= 1_000) return `Rp ${(num / 1_000).toFixed(0)}Rb`;
    return `Rp ${num.toLocaleString("id-ID")}`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Dashboard Page
// ═══════════════════════════════════════════════════════════════════════════════
export default function Dashboard({
    summary = {},
    dailyTrend = [],
    statusDist = [],
    topDestinations = [],
    recentShipments = [],
    serviceDist = [],
    topFailedDest = [],
    dailyStatusTrend = [],
    weightAmountStats = {},
    lastBatchInfo = null,
}) {
    const [chartMode, setChartMode] = useState("grouped"); // 'grouped' | 'stacked'
    const hasData = (summary.total || 0) > 0;
    const successRate =
        summary.total > 0 ? (summary.success / summary.total) * 100 : 0;

    // Format dailyStatusTrend labels & calculate daily totals
    const trendData = dailyStatusTrend.map((d) => {
        let label = d.day || "";
        let fullDate = d.day || "";
        if (d.day) {
            const m = String(d.day)
                .trim()
                .match(/^(\d{4})-(\d{2})-(\d{2})/);
            if (m) {
                const [_, y, mo, dt] = m;
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
                const MONTHS_LONG = [
                    "Januari",
                    "Februari",
                    "Maret",
                    "April",
                    "Mei",
                    "Juni",
                    "Juli",
                    "Agustus",
                    "September",
                    "Oktober",
                    "November",
                    "Desember",
                ];
                const mi = parseInt(mo, 10) - 1;
                label = `${parseInt(dt, 10)} ${MONTHS[mi] || mo}`;
                fullDate = `${parseInt(dt, 10)} ${MONTHS_LONG[mi] || mo} ${y}`;
            }
        }
        const total =
            (Number(d.success) || 0) +
            (Number(d.failed) || 0) +
            (Number(d.on_delivery) || 0) +
            (Number(d.on_process) || 0);
        return {
            ...d,
            label,
            fullDate,
            total,
        };
    });

    // Format pie data
    const pieData = statusDist.map((d) => ({
        name: d.status,
        value: Number(d.total),
    }));

    // Format service distribution data
    const serviceData = serviceDist.map((d) => ({
        name: d.service || "Lainnya",
        total: Number(d.total),
    }));

    const statCards = [
        {
            label: "Total Resi",
            value: summary.total,
            note: hasData ? `${dailyTrend.length} hari data` : "Belum ada data",
            icon: "📦",
            bgClass: "bg-blue-50",
            textClass: "text-blue-700",
            trend: "neutral",
            href: hasData ? "/resi" : null,
        },
        {
            label: "Berhasil (Success)",
            value: summary.success,
            note:
                summary.total > 0
                    ? `${successRate.toFixed(1)}% dari total`
                    : "—",
            icon: "✅",
            bgClass: "bg-emerald-50",
            textClass: "text-emerald-700",
            trend: "up",
            href: hasData ? "/resi?status=Success" : null,
        },
        {
            label: "Gagal (Failed)",
            value: summary.failed,
            note:
                summary.total > 0
                    ? `${((summary.failed / summary.total) * 100).toFixed(1)}% dari total`
                    : "—",
            icon: "❌",
            bgClass: "bg-red-50",
            textClass: "text-red-700",
            trend: "down",
            href: hasData ? "/resi?status=Failed" : null,
        },
        {
            label: "Dalam Pengiriman",
            value: summary.onDelivery,
            note: "Sedang diantarkan",
            icon: "🚚",
            bgClass: "bg-blue-50",
            textClass: "text-blue-700",
            trend: "neutral",
            href: hasData ? "/resi?status=On Delivery" : null,
        },
        {
            label: "Dalam Proses",
            value: summary.onProcess,
            note: "Sedang diproses",
            icon: "⏳",
            bgClass: "bg-amber-50",
            textClass: "text-amber-700",
            trend: "neutral",
            href: hasData ? "/resi?status=On Process" : null,
        },
    ];

    return (
        <AuthenticatedLayout header="Dashboard Overview">
            <Head title="Dashboard Monitoring Resi" />

            <div className="space-y-6">
                {/* ─── Page Header ─────────────────────────────────────────── */}
                <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <p className="text-sm text-slate-500">
                            Selamat datang kembali 👋
                        </p>
                        <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#10264A] sm:text-3xl">
                            Dashboard Monitoring
                        </h1>
                        <p className="mt-1 text-sm text-slate-400">
                            Ringkasan lengkap semua data pengiriman — real-time
                            dari database.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link
                            href="/resi/import"
                            className="inline-flex items-center gap-2 rounded-xl bg-[#10264A] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-950/10 transition hover:bg-[#193965]"
                        >
                            ⬆ Import Data
                        </Link>
                        <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500">
                            <span
                                className={`h-2 w-2 rounded-full ${hasData ? "bg-emerald-500 animate-pulse" : "bg-slate-300"}`}
                            />
                            {hasData ? "Live Data" : "No Data"}
                        </div>
                    </div>
                </section>

                {/* ─── Stat Cards Row ─────────────────────────────────────── */}
                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                    {statCards.map((s) => (
                        <StatCard key={s.label} {...s} />
                    ))}
                </section>

                {/* ─── Row 2: Status Bar Chart + Donut + Success Gauge ────── */}
                <section className="grid gap-5 xl:grid-cols-12">
                    {/* Bar Chart Tren Status — Grouped / Stacked (Mudah Dibaca) */}
                    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm xl:col-span-7">
                        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-base font-bold text-[#10264A]">
                                        Tren Status Pengiriman
                                    </h2>
                                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-[#10264A]">
                                        Bar Chart
                                    </span>
                                </div>
                                <p className="mt-0.5 text-xs text-slate-400">
                                    Perbandingan jumlah per status pengiriman
                                    per tanggal
                                </p>
                            </div>

                            {/* View Switcher: Grouped vs Stacked */}
                            <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 text-xs">
                                <button
                                    type="button"
                                    onClick={() => setChartMode("grouped")}
                                    className={`rounded-lg px-2.5 py-1 font-semibold transition ${
                                        chartMode === "grouped"
                                            ? "bg-white text-[#10264A] shadow-sm"
                                            : "text-slate-500 hover:text-slate-800"
                                    }`}
                                >
                                    📊 Berdampingan
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setChartMode("stacked")}
                                    className={`rounded-lg px-2.5 py-1 font-semibold transition ${
                                        chartMode === "stacked"
                                            ? "bg-white text-[#10264A] shadow-sm"
                                            : "text-slate-500 hover:text-slate-800"
                                    }`}
                                >
                                    🥞 Bertumpuk
                                </button>
                            </div>
                        </div>

                        {/* Status Legend Pills */}
                        <div className="mb-3 flex flex-wrap gap-2 text-xs">
                            <Link
                                href="/resi?status=Success"
                                className="group flex items-center gap-1.5 rounded-lg border border-emerald-200/60 bg-emerald-50/60 px-2.5 py-1 transition hover:bg-emerald-100"
                                title="Klik untuk filter data Berhasil"
                            >
                                <span
                                    className="h-2 w-2 rounded-full"
                                    style={{ backgroundColor: COLORS.success }}
                                />
                                <span className="font-medium text-emerald-800">
                                    Success
                                </span>
                                <span className="font-bold text-emerald-700">
                                    (
                                    {(summary.success || 0).toLocaleString(
                                        "id-ID",
                                    )}
                                    )
                                </span>
                            </Link>
                            <Link
                                href="/resi?status=Failed"
                                className="group flex items-center gap-1.5 rounded-lg border border-red-200/60 bg-red-50/60 px-2.5 py-1 transition hover:bg-red-100"
                                title="Klik untuk filter data Gagal"
                            >
                                <span
                                    className="h-2 w-2 rounded-full"
                                    style={{ backgroundColor: COLORS.failed }}
                                />
                                <span className="font-medium text-red-800">
                                    Failed
                                </span>
                                <span className="font-bold text-red-700">
                                    (
                                    {(summary.failed || 0).toLocaleString(
                                        "id-ID",
                                    )}
                                    )
                                </span>
                            </Link>
                            <Link
                                href="/resi?status=On%20Delivery"
                                className="group flex items-center gap-1.5 rounded-lg border border-blue-200/60 bg-blue-50/60 px-2.5 py-1 transition hover:bg-blue-100"
                                title="Klik untuk filter data Dalam Pengiriman"
                            >
                                <span
                                    className="h-2 w-2 rounded-full"
                                    style={{
                                        backgroundColor: COLORS.onDelivery,
                                    }}
                                />
                                <span className="font-medium text-blue-800">
                                    On Delivery
                                </span>
                                <span className="font-bold text-blue-700">
                                    (
                                    {(summary.onDelivery || 0).toLocaleString(
                                        "id-ID",
                                    )}
                                    )
                                </span>
                            </Link>
                            <Link
                                href="/resi?status=On%20Process"
                                className="group flex items-center gap-1.5 rounded-lg border border-amber-200/60 bg-amber-50/60 px-2.5 py-1 transition hover:bg-amber-100"
                                title="Klik untuk filter data Dalam Proses"
                            >
                                <span
                                    className="h-2 w-2 rounded-full"
                                    style={{
                                        backgroundColor: COLORS.onProcess,
                                    }}
                                />
                                <span className="font-medium text-amber-800">
                                    On Process
                                </span>
                                <span className="font-bold text-amber-700">
                                    (
                                    {(summary.onProcess || 0).toLocaleString(
                                        "id-ID",
                                    )}
                                    )
                                </span>
                            </Link>
                        </div>

                        {/* Chart Canvas */}
                        {trendData.length > 0 ? (
                            <div>
                                <ResponsiveContainer width="100%" height={270}>
                                    <BarChart
                                        data={trendData}
                                        margin={{
                                            top: 15,
                                            right: 10,
                                            left: -15,
                                            bottom: 5,
                                        }}
                                        barGap={chartMode === "grouped" ? 4 : 0}
                                        barCategoryGap={
                                            trendData.length === 1
                                                ? "35%"
                                                : "20%"
                                        }
                                    >
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            stroke="#f1f5f9"
                                            vertical={false}
                                        />
                                        <XAxis
                                            dataKey="label"
                                            tick={{
                                                fontSize: 11,
                                                fill: "#475569",
                                                fontWeight: 600,
                                            }}
                                            axisLine={{ stroke: "#e2e8f0" }}
                                            tickLine={false}
                                        />
                                        <YAxis
                                            tick={{
                                                fontSize: 10,
                                                fill: "#94a3b8",
                                            }}
                                            axisLine={false}
                                            tickLine={false}
                                            allowDecimals={false}
                                        />
                                        <Tooltip
                                            content={<StatusChartTooltip />}
                                            cursor={{
                                                fill: "rgba(16, 38, 74, 0.04)",
                                            }}
                                        />

                                        {chartMode === "grouped" ? (
                                            <>
                                                <Bar
                                                    dataKey="success"
                                                    name="Success"
                                                    fill={COLORS.success}
                                                    radius={[4, 4, 0, 0]}
                                                    maxBarSize={44}
                                                />
                                                <Bar
                                                    dataKey="failed"
                                                    name="Failed"
                                                    fill={COLORS.failed}
                                                    radius={[4, 4, 0, 0]}
                                                    maxBarSize={44}
                                                />
                                                <Bar
                                                    dataKey="on_delivery"
                                                    name="On Delivery"
                                                    fill={COLORS.onDelivery}
                                                    radius={[4, 4, 0, 0]}
                                                    maxBarSize={44}
                                                />
                                                <Bar
                                                    dataKey="on_process"
                                                    name="On Process"
                                                    fill={COLORS.onProcess}
                                                    radius={[4, 4, 0, 0]}
                                                    maxBarSize={44}
                                                />
                                            </>
                                        ) : (
                                            <>
                                                <Bar
                                                    dataKey="success"
                                                    name="Success"
                                                    stackId="status"
                                                    fill={COLORS.success}
                                                    maxBarSize={56}
                                                />
                                                <Bar
                                                    dataKey="failed"
                                                    name="Failed"
                                                    stackId="status"
                                                    fill={COLORS.failed}
                                                    maxBarSize={56}
                                                />
                                                <Bar
                                                    dataKey="on_delivery"
                                                    name="On Delivery"
                                                    stackId="status"
                                                    fill={COLORS.onDelivery}
                                                    maxBarSize={56}
                                                />
                                                <Bar
                                                    dataKey="on_process"
                                                    name="On Process"
                                                    stackId="status"
                                                    fill={COLORS.onProcess}
                                                    radius={[6, 6, 0, 0]}
                                                    maxBarSize={56}
                                                />
                                            </>
                                        )}
                                    </BarChart>
                                </ResponsiveContainer>

                                {/* Rincian Angka Riil Per Tanggal — Sangat Mudah Dibaca */}
                                <div className="mt-4 border-t border-slate-100 pt-3">
                                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                                        Rincian Data ({trendData.length} Tanggal
                                        Transaksi)
                                    </p>
                                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                        {trendData.map((d, idx) => (
                                            <div
                                                key={idx}
                                                className="flex flex-wrap items-center justify-between gap-2.5 rounded-xl border border-slate-100 bg-slate-50/70 p-3"
                                            >
                                                <div className="flex items-center gap-2.5">
                                                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#10264A] text-sm text-white shadow-sm">
                                                        📅
                                                    </span>
                                                    <div>
                                                        <p className="text-xs font-bold text-[#10264A]">
                                                            {d.fullDate ||
                                                                d.label}
                                                        </p>
                                                        <p className="text-[11px] text-slate-500">
                                                            Total:{" "}
                                                            <span className="font-bold text-slate-700">
                                                                {d.total} resi
                                                            </span>
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                                                    <Link
                                                        href="/resi?status=Success"
                                                        className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700 hover:bg-emerald-100"
                                                    >
                                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                                        Success:{" "}
                                                        <span className="font-bold">
                                                            {d.success}
                                                        </span>
                                                    </Link>
                                                    <Link
                                                        href="/resi?status=Failed"
                                                        className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-0.5 font-medium text-red-700 hover:bg-red-100"
                                                    >
                                                        <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                                                        Failed:{" "}
                                                        <span className="font-bold">
                                                            {d.failed}
                                                        </span>
                                                    </Link>
                                                    <Link
                                                        href="/resi?status=On%20Delivery"
                                                        className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 font-medium text-blue-700 hover:bg-blue-100"
                                                    >
                                                        <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                                                        Delivery:{" "}
                                                        <span className="font-bold">
                                                            {d.on_delivery}
                                                        </span>
                                                    </Link>
                                                    <Link
                                                        href="/resi?status=On%20Process"
                                                        className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 font-medium text-amber-700 hover:bg-amber-100"
                                                    >
                                                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                                                        Process:{" "}
                                                        <span className="font-bold">
                                                            {d.on_process}
                                                        </span>
                                                    </Link>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex h-[260px] items-center justify-center text-sm text-slate-300">
                                Belum ada data tren
                            </div>
                        )}
                    </div>

                    {/* Donut Chart + Success Gauge */}
                    <div className="space-y-5 xl:col-span-5">
                        {/* Interactive Donut */}
                        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
                            <h2 className="text-base font-bold text-[#10264A]">
                                Distribusi Status
                            </h2>
                            <p className="mt-0.5 text-xs text-slate-400">
                                Proporsi pengiriman per status
                            </p>

                            {pieData.length > 0 ? (
                                <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row">
                                    <ResponsiveContainer
                                        width={180}
                                        height={180}
                                    >
                                        <PieChart>
                                            <Pie
                                                data={pieData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={50}
                                                outerRadius={75}
                                                paddingAngle={3}
                                                dataKey="value"
                                                strokeWidth={0}
                                            >
                                                {pieData.map((d, i) => (
                                                    <Cell
                                                        key={i}
                                                        fill={getStatusColor(
                                                            d.name,
                                                        )}
                                                    />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                content={<PieChartTooltip />}
                                                separator=""
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>

                                    <div className="flex flex-col gap-2.5">
                                        {pieData.map((d) => {
                                            const pct =
                                                summary.total > 0
                                                    ? (
                                                          (d.value /
                                                              summary.total) *
                                                          100
                                                      ).toFixed(1)
                                                    : 0;
                                            return (
                                                <Link
                                                    key={d.name}
                                                    href={`/resi?status=${encodeURIComponent(d.name)}`}
                                                    className="group flex items-center gap-2 rounded-lg px-2 py-1 text-xs transition hover:bg-slate-50"
                                                >
                                                    <span
                                                        className="h-3 w-3 rounded"
                                                        style={{
                                                            backgroundColor:
                                                                getStatusColor(
                                                                    d.name,
                                                                ),
                                                        }}
                                                    />
                                                    <span className="text-slate-600 group-hover:text-[#10264A]">
                                                        {d.name}
                                                    </span>
                                                    <span className="ml-auto font-bold text-slate-800">
                                                        {d.value.toLocaleString(
                                                            "id-ID",
                                                        )}
                                                    </span>
                                                    <span className="text-slate-400">
                                                        ({pct}%)
                                                    </span>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex h-[180px] items-center justify-center text-sm text-slate-300">
                                    Belum ada data
                                </div>
                            )}
                        </div>

                        {/* Success Rate Gauge */}
                        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-base font-bold text-[#10264A]">
                                        Success Rate
                                    </h2>
                                    <p className="mt-0.5 text-xs text-slate-400">
                                        Tingkat keberhasilan pengiriman
                                    </p>
                                </div>
                                <span
                                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                                        successRate >= 80
                                            ? "bg-emerald-50 text-emerald-600"
                                            : successRate >= 50
                                              ? "bg-amber-50 text-amber-600"
                                              : "bg-red-50 text-red-600"
                                    }`}
                                >
                                    {successRate >= 80
                                        ? "Baik"
                                        : successRate >= 50
                                          ? "Cukup"
                                          : "Perlu Perhatian"}
                                </span>
                            </div>
                            <div className="mt-3">
                                <SuccessRateGauge rate={successRate} />
                            </div>
                        </div>
                    </div>
                </section>

                {/* ─── Row 3: Service Distribution + Weight/Amount Stats + Last Import ── */}
                <section className="grid gap-5 lg:grid-cols-3">
                    {/* Service Distribution Bar Chart */}
                    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
                        <h2 className="text-base font-bold text-[#10264A]">
                            Distribusi Layanan
                        </h2>
                        <p className="mt-0.5 text-xs text-slate-400">
                            Jenis layanan pengiriman yang digunakan
                        </p>

                        {serviceData.length > 0 ? (
                            <ResponsiveContainer
                                width="100%"
                                height={200}
                                className="mt-4"
                            >
                                <BarChart
                                    data={serviceData}
                                    layout="vertical"
                                    margin={{
                                        top: 0,
                                        right: 10,
                                        left: 0,
                                        bottom: 0,
                                    }}
                                >
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        stroke="#f1f5f9"
                                        horizontal={false}
                                    />
                                    <XAxis
                                        type="number"
                                        tick={{ fontSize: 10, fill: "#94a3b8" }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        type="category"
                                        dataKey="name"
                                        tick={{
                                            fontSize: 10,
                                            fill: "#64748b",
                                            fontWeight: 600,
                                        }}
                                        axisLine={false}
                                        tickLine={false}
                                        width={55}
                                    />
                                    <Tooltip
                                        formatter={(val) => [
                                            val.toLocaleString("id-ID"),
                                            "Jumlah",
                                        ]}
                                        contentStyle={{
                                            borderRadius: 12,
                                            border: "1px solid #e2e8f0",
                                            fontSize: 12,
                                        }}
                                    />
                                    <Bar
                                        dataKey="total"
                                        radius={[0, 6, 6, 0]}
                                        barSize={18}
                                    >
                                        {serviceData.map((_, i) => (
                                            <Cell
                                                key={i}
                                                fill={
                                                    SERVICE_COLORS[
                                                        i %
                                                            SERVICE_COLORS.length
                                                    ]
                                                }
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex h-[200px] items-center justify-center text-sm text-slate-300">
                                Belum ada data
                            </div>
                        )}
                    </div>

                    {/* Weight & Amount Stats */}
                    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
                        <h2 className="text-base font-bold text-[#10264A]">
                            Statistik Pengiriman
                        </h2>
                        <p className="mt-0.5 text-xs text-slate-400">
                            Ringkasan berat & nilai kiriman
                        </p>

                        <div className="mt-5 space-y-4">
                            <div className="rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 p-4">
                                <p className="text-xs font-medium text-blue-400">
                                    Total Berat Kiriman
                                </p>
                                <p className="mt-1 text-2xl font-bold text-[#10264A]">
                                    {Number(
                                        weightAmountStats.totalWeight || 0,
                                    ).toLocaleString("id-ID")}{" "}
                                    <span className="text-sm font-medium text-slate-400">
                                        kg
                                    </span>
                                </p>
                            </div>

                            {/* <div className="rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 p-4">
                                <p className="text-xs font-medium text-emerald-400">
                                    Total Nilai Kiriman
                                </p>
                                <p className="mt-1 text-2xl font-bold text-[#10264A]">
                                    {formatRupiah(
                                        weightAmountStats.totalAmount || 0,
                                    )}
                                </p>
                            </div> */}

                            <div className="rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 p-4">
                                <p className="text-xs font-medium text-amber-400">
                                    Rata-rata Berat
                                </p>
                                <p className="mt-1 text-2xl font-bold text-[#10264A]">
                                    {Number(
                                        weightAmountStats.avgWeight || 0,
                                    ).toLocaleString("id-ID")}{" "}
                                    <span className="text-sm font-medium text-slate-400">
                                        kg
                                    </span>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Last Import Info + Quick Actions */}
                    <div className="space-y-5">
                        {/* Last batch */}
                        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
                            <h2 className="text-base font-bold text-[#10264A]">
                                Import Terakhir
                            </h2>
                            <p className="mt-0.5 text-xs text-slate-400">
                                Batch data terakhir yang diimport
                            </p>

                            {lastBatchInfo ? (
                                <div className="mt-4 space-y-3">
                                    <div className="rounded-xl bg-slate-50 px-4 py-3">
                                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                            Nama Batch
                                        </p>
                                        <p className="mt-0.5 truncate text-sm font-bold text-[#10264A]">
                                            {lastBatchInfo.name}
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="rounded-xl bg-blue-50 px-3 py-2.5 text-center">
                                            <p className="text-xl font-bold text-blue-700">
                                                {Number(
                                                    lastBatchInfo.total,
                                                ).toLocaleString("id-ID")}
                                            </p>
                                            <p className="text-[10px] font-medium text-blue-400">
                                                Data Masuk
                                            </p>
                                        </div>
                                        <div className="rounded-xl bg-slate-50 px-3 py-2.5 text-center">
                                            <p className="text-xs font-bold text-slate-700">
                                                {lastBatchInfo.importedAt
                                                    ? new Date(
                                                          lastBatchInfo.importedAt,
                                                      ).toLocaleDateString(
                                                          "id-ID",
                                                          {
                                                              day: "2-digit",
                                                              month: "short",
                                                              year: "numeric",
                                                          },
                                                      )
                                                    : "—"}
                                            </p>
                                            <p className="text-[10px] font-medium text-slate-400">
                                                Tanggal
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="mt-4 rounded-xl bg-slate-50 px-4 py-6 text-center">
                                    <p className="text-3xl">📂</p>
                                    <p className="mt-2 text-sm font-medium text-slate-400">
                                        Belum ada import
                                    </p>
                                    <Link
                                        href="/resi/import"
                                        className="mt-2 inline-block text-xs font-semibold text-[#10264A] hover:underline"
                                    >
                                        Import Sekarang →
                                    </Link>
                                </div>
                            )}
                        </div>

                        {/* Quick Actions */}
                        <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-[#10264A] to-[#1a3a6e] p-5 shadow-sm text-white">
                            <h3 className="font-bold">Aksi Cepat</h3>
                            <div className="mt-3 space-y-2">
                                <Link
                                    href="/resi/import"
                                    className="flex items-center gap-2.5 rounded-xl bg-white/10 px-3 py-2.5 text-xs font-medium transition hover:bg-white/20"
                                >
                                    <span>📤</span> Import Data Baru
                                </Link>
                                <Link
                                    href="/resi"
                                    className="flex items-center gap-2.5 rounded-xl bg-white/10 px-3 py-2.5 text-xs font-medium transition hover:bg-white/20"
                                >
                                    <span>📋</span> Lihat Semua Resi
                                </Link>
                                <Link
                                    href="/resi?status=Failed"
                                    className="flex items-center gap-2.5 rounded-xl bg-white/10 px-3 py-2.5 text-xs font-medium transition hover:bg-white/20"
                                >
                                    <span>⚠️</span> Cek Pengiriman Gagal
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ─── Row 4: Top Destinations + Failed Destinations + Recent ─ */}
                <section className="grid gap-5 xl:grid-cols-12">
                    {/* Top Destinations */}
                    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm xl:col-span-4">
                        <h2 className="text-base font-bold text-[#10264A]">
                            Top 5 Destinasi
                        </h2>
                        <p className="mt-0.5 text-xs text-slate-400">
                            Tujuan pengiriman terbanyak
                        </p>

                        {topDestinations.length > 0 ? (
                            <div className="mt-5 space-y-3">
                                {topDestinations.map((dest, i) => {
                                    const dtotal = topDestinations.reduce(
                                        (s, d) => s + Number(d.total),
                                        0,
                                    );
                                    const pct =
                                        dtotal > 0
                                            ? (
                                                  (Number(dest.total) /
                                                      dtotal) *
                                                  100
                                              ).toFixed(1)
                                            : 0;
                                    const medals = ["🥇", "🥈", "🥉"];
                                    return (
                                        <div key={i}>
                                            <div className="mb-1 flex items-center justify-between text-xs">
                                                <span className="flex items-center gap-1.5 font-medium text-slate-700">
                                                    <span>
                                                        {medals[i] ||
                                                            `#${i + 1}`}
                                                    </span>
                                                    <span className="max-w-[130px] truncate">
                                                        {dest.destination}
                                                    </span>
                                                </span>
                                                <span className="font-bold text-[#10264A]">
                                                    {Number(
                                                        dest.total,
                                                    ).toLocaleString("id-ID")}
                                                </span>
                                            </div>
                                            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                                                <div
                                                    className="h-full rounded-full bg-gradient-to-r from-[#10264A] to-[#3b82f6] transition-all duration-700"
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="mt-8 text-center text-sm text-slate-300">
                                Belum ada data
                            </p>
                        )}
                    </div>

                    {/* Top Failed Destinations */}
                    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm xl:col-span-3">
                        <h2 className="text-base font-bold text-[#10264A]">
                            ⚠ Destinasi Gagal
                        </h2>
                        <p className="mt-0.5 text-xs text-slate-400">
                            Tujuan dengan kegagalan terbanyak
                        </p>

                        {topFailedDest.length > 0 ? (
                            <div className="mt-5 space-y-2.5">
                                {topFailedDest.map((dest, i) => (
                                    <div
                                        key={i}
                                        className="flex items-center justify-between rounded-xl bg-red-50/60 px-3 py-2.5"
                                    >
                                        <span className="max-w-[140px] truncate text-xs font-medium text-slate-700">
                                            {dest.destination}
                                        </span>
                                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-600">
                                            {Number(dest.total).toLocaleString(
                                                "id-ID",
                                            )}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="mt-8 text-center">
                                <p className="text-3xl">🎉</p>
                                <p className="mt-2 text-sm text-slate-400">
                                    Tidak ada kegagalan
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Recent Shipments Table */}
                    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm xl:col-span-5">
                        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                            <div>
                                <h2 className="text-base font-bold text-[#10264A]">
                                    Pengiriman Terbaru
                                </h2>
                                <p className="mt-0.5 text-xs text-slate-400">
                                    10 resi terakhir masuk
                                </p>
                            </div>
                            <Link
                                href="/resi"
                                className="text-xs font-semibold text-[#10264A] transition hover:underline"
                            >
                                Lihat Semua →
                            </Link>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[440px] text-left text-sm">
                                <thead className="bg-slate-50/80 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                    <tr>
                                        <th className="px-4 py-2.5">AWB</th>
                                        <th className="px-4 py-2.5">
                                            Penerima
                                        </th>
                                        <th className="px-4 py-2.5">Layanan</th>
                                        <th className="px-4 py-2.5">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {recentShipments.length > 0 ? (
                                        recentShipments.map((s) => (
                                            <tr
                                                key={s.id}
                                                className="transition hover:bg-slate-50/70"
                                            >
                                                <td className="whitespace-nowrap px-4 py-2.5 text-xs font-semibold text-[#244775]">
                                                    <Link
                                                        href={`/resi/show/${s.id}`}
                                                        className="hover:underline"
                                                    >
                                                        {(s.awb || "—").slice(
                                                            -10,
                                                        )}
                                                    </Link>
                                                </td>
                                                <td className="px-4 py-2.5 text-xs text-slate-600">
                                                    <span className="line-clamp-1 max-w-[120px] block">
                                                        {s.consignee_name ||
                                                            "—"}
                                                    </span>
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-2.5 text-xs text-slate-400">
                                                    {s.service || "—"}
                                                </td>
                                                <td className="px-4 py-2.5">
                                                    <StatusBadge
                                                        status={s.status}
                                                    />
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td
                                                colSpan={4}
                                                className="py-10 text-center text-sm text-slate-300"
                                            >
                                                Belum ada data
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>

                {/* ─── Footer Note ────────────────────────────────────────── */}
                <div className="rounded-xl border border-slate-100 bg-slate-50 px-5 py-3 text-center text-xs text-slate-400">
                    Data diperbarui setiap kali ada import baru • Dashboard
                    menampilkan data real dari database
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
