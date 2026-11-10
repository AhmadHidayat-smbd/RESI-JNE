import { Head, Link } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";

const STATUS_COLORS = {
    Success:       "#10b981",
    Failed:        "#ef4444",
    "On Delivery": "#3b82f6",
    "On Process":  "#f59e0b",
};

function SummaryCard({ label, value, total, color, icon, href }) {
    const pct = total > 0 ? ((value / total) * 100).toFixed(1) : 0;

    const content = (
        <>
            <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">{label}</p>
                <span className="text-2xl">{icon}</span>
            </div>
            <p className="mt-4 text-3xl font-bold tracking-tight text-[#10264A]">
                {Number(value || 0).toLocaleString("id-ID")}
            </p>
            <div className="mt-3">
                <div className="mb-1.5 flex justify-between text-xs text-slate-400">
                    <span>{pct}% dari total</span>
                    <span>{Number(total || 0).toLocaleString("id-ID")} total</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, backgroundColor: color }} />
                </div>
            </div>
            {href && (
                <p className="mt-2 text-[10px] font-medium text-slate-400 transition group-hover:text-[#10264A]">
                    Klik untuk lihat data →
                </p>
            )}
        </>
    );

    if (href) {
        return (
            <Link href={href} className="group block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md hover:border-[#10264A]/30 cursor-pointer">
                {content}
            </Link>
        );
    }

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            {content}
        </div>
    );
}

function BarChart({ data = [], label = "Tren 30 Hari" }) {
    const max = Math.max(...data.map((d) => d.total), 1);
    if (!data.length) {
        return <div className="flex h-40 items-center justify-center text-slate-300 text-sm">Belum ada data</div>;
    }
    return (
        <div className="mt-4 flex h-40 items-end justify-between gap-1 border-b border-slate-100">
            {data.map((item, i) => {
                const pct = Math.max((item.total / max) * 100, 3);
                const d   = item.day ? new Date(item.day + "T00:00:00") : null;
                const lbl = d ? d.toLocaleDateString("id-ID", { day: "numeric", month: "short" }) : `D${i + 1}`;
                return (
                    <div key={i} className="group flex h-full flex-1 flex-col items-center justify-end gap-0.5" title={`${lbl}: ${item.total}`}>
                        <div className="w-full max-w-8 rounded-t bg-[#244775] transition hover:bg-[#E31E24]"
                            style={{ height: `${pct}%` }} />
                        {data.length <= 14 && (
                            <span className="pb-1 text-[9px] text-slate-400 leading-tight">{lbl}</span>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

export default function Laporan({ summary = {}, statusDist = [], topDestinations = [], dailyTrend = [] }) {
    const total = summary.total || 0;

    const cards = [
        { label: "Success",     value: summary.success,    color: "#10b981", icon: "✅", href: "/resi?status=Success" },
        { label: "Failed",      value: summary.failed,     color: "#ef4444", icon: "❌", href: "/resi?status=Failed" },
        { label: "On Delivery", value: summary.onDelivery, color: "#3b82f6", icon: "🚚", href: "/resi?status=On Delivery" },
        { label: "On Process",  value: summary.onProcess,  color: "#f59e0b", icon: "⏳", href: "/resi?status=On Process" },
    ];

    return (
        <AuthenticatedLayout header="Laporan">
            <Head title="Laporan Pengiriman" />

            <div className="space-y-7">
                {/* Header */}
                <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-[#10264A] sm:text-3xl">
                            Laporan Pengiriman
                        </h1>
                        <p className="mt-1 text-sm text-slate-500">
                            Rekap keseluruhan data pengiriman dari semua import
                        </p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-[#10264A]">
                        Total: {total.toLocaleString("id-ID")} Resi
                    </div>
                </section>

                {/* Summary Cards */}
                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {cards.map((c) => (
                        <SummaryCard key={c.label} {...c} total={total} />
                    ))}
                </section>

                {/* Status Distribution Table + Bar */}
                <section className="grid gap-5 lg:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h2 className="mb-5 font-bold text-[#10264A]">Rekap per Status</h2>
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-100 text-xs font-semibold uppercase text-slate-400">
                                    <th className="pb-3 text-left">Status</th>
                                    <th className="pb-3 text-right">Jumlah</th>
                                    <th className="pb-3 text-right">Persentase</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {statusDist.length > 0 ? statusDist.map((s) => {
                                    const pct = total > 0 ? ((s.total / total) * 100).toFixed(2) : 0;
                                    const color = STATUS_COLORS[s.status] || "#94a3b8";
                                    return (
                                        <tr key={s.status}>
                                            <td className="py-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: color }} />
                                                    <span className="font-medium text-slate-700">{s.status}</span>
                                                </div>
                                            </td>
                                            <td className="py-3 text-right font-bold text-slate-800">
                                                {Number(s.total).toLocaleString("id-ID")}
                                            </td>
                                            <td className="py-3 text-right text-slate-500">{pct}%</td>
                                        </tr>
                                    );
                                }) : (
                                    <tr>
                                        <td colSpan={3} className="py-8 text-center text-slate-300 text-sm">
                                            Belum ada data
                                        </td>
                                    </tr>
                                )}
                                {statusDist.length > 0 && (
                                    <tr className="border-t-2 border-slate-200 font-bold">
                                        <td className="pt-3 text-slate-700">Total</td>
                                        <td className="pt-3 text-right text-[#10264A]">{total.toLocaleString("id-ID")}</td>
                                        <td className="pt-3 text-right text-slate-500">100%</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Top Destinations */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h2 className="mb-5 font-bold text-[#10264A]">Top 10 Destinasi</h2>
                        {topDestinations.length > 0 ? (
                            <div className="space-y-3">
                                {topDestinations.map((dest, i) => {
                                    const destTotal = topDestinations.reduce((s, d) => s + Number(d.total), 0);
                                    const pct = destTotal > 0 ? ((Number(dest.total) / destTotal) * 100).toFixed(1) : 0;
                                    return (
                                        <div key={i}>
                                            <div className="mb-1 flex justify-between text-xs">
                                                <span className="flex items-center gap-2">
                                                    <span className="flex h-4 w-4 items-center justify-center rounded bg-[#10264A] text-[9px] font-bold text-white">
                                                        {i + 1}
                                                    </span>
                                                    <span className="font-medium text-slate-700 max-w-[180px] truncate">
                                                        {dest.destination}
                                                    </span>
                                                </span>
                                                <span className="font-bold text-slate-600">
                                                    {Number(dest.total).toLocaleString("id-ID")}
                                                </span>
                                            </div>
                                            <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                                                <div
                                                    className="h-full rounded-full bg-[#244775] transition-all duration-700"
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="mt-6 text-center text-sm text-slate-300">Belum ada data</p>
                        )}
                    </div>
                </section>

                {/* Trend Chart 30 hari */}
                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-start justify-between">
                        <div>
                            <h2 className="font-bold text-[#10264A]">Tren Pengiriman 30 Hari</h2>
                            <p className="mt-1 text-xs text-slate-400">Jumlah resi masuk per hari</p>
                        </div>
                        <span className="rounded-lg bg-slate-50 px-3 py-2 text-xs font-medium text-slate-500">
                            30 hari terakhir
                        </span>
                    </div>
                    <BarChart data={dailyTrend} />
                    <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                        <span className="h-2.5 w-2.5 rounded-sm bg-[#244775]" />
                        Jumlah resi per hari berdasarkan tanggal entry
                    </div>
                </section>
            </div>
        </AuthenticatedLayout>
    );
}
