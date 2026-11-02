import { Head, Link } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";

const STATUS_CFG = {
    Success: {
        cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
        dot: "bg-emerald-500",
    },
    Failed: { cls: "bg-red-50 text-red-700 border-red-200", dot: "bg-red-500" },
    "On Delivery": {
        cls: "bg-blue-50 text-blue-700 border-blue-200",
        dot: "bg-blue-500",
    },
    "On Process": {
        cls: "bg-amber-50 text-amber-700 border-amber-200",
        dot: "bg-amber-500",
    },
};

// Helper format tanggal & jam persis sesuai database tanpa pergeseran timezone
function formatDateTime(val) {
    if (!val) return null;
    const str = String(val).trim();
    const match = str.match(
        /^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})(?::(\d{2}))?/,
    );
    if (match) {
        const [_, y, m, d, hr, mn] = match;
        const MONTHS = [
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
        const mi = parseInt(m, 10) - 1;
        return `${parseInt(d, 10)} ${MONTHS[mi] || m} ${y}, pukul ${hr}:${mn} WIB`;
    }
    return str;
}

function formatDate(val) {
    if (!val) return null;
    const str = String(val).trim();
    const match = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
        const [_, y, m, d] = match;
        const MONTHS = [
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
        const mi = parseInt(m, 10) - 1;
        return `${parseInt(d, 10)} ${MONTHS[mi] || m} ${y}`;
    }
    return str;
}

function Field({ label, value }) {
    return (
        <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                {label}
            </p>
            <p className="mt-1 text-sm text-slate-700">
                {value || <span className="italic text-slate-300">—</span>}
            </p>
        </div>
    );
}

export default function ResiShow({ shipment }) {
    const cfg = STATUS_CFG[shipment.status] || {
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
        <AuthenticatedLayout header="Detail Resi">
            <Head title={`Detail Resi ${shipment.awb}`} />

            <div className="space-y-6">
                {/* Back + Header */}
                <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <Link
                            href="/resi"
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

                    <span
                        className={`inline-flex w-fit items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold ${cfg.cls}`}
                    >
                        <span className={`h-2 w-2 rounded-full ${cfg.dot}`} />
                        {shipment.status || "—"}
                    </span>
                </section>

                {/* Info Grid */}
                <div className="grid gap-5 lg:grid-cols-3">
                    {/* Informasi Pengiriman */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
                        <h2 className="mb-5 font-bold text-[#10264A]">
                            Informasi Pengiriman
                        </h2>
                        <div className="grid gap-5 sm:grid-cols-2">
                            <Field label="No AWB / Resi" value={shipment.awb} />
                            <Field
                                label="Runsheet No"
                                value={shipment.runsheet_no}
                            />
                            <Field
                                label="Tanggal & Jam Entry"
                                value={formatDateTime(shipment.tgl_jam_entry)}
                            />
                            <Field
                                label="Tanggal Received"
                                value={formatDate(shipment.tgl_received)}
                            />
                            <Field
                                label="Kode Asal"
                                value={shipment.origin_code}
                            />
                            <Field
                                label="Kode Tujuan"
                                value={shipment.destination_code}
                            />
                            <Field
                                label="Tujuan"
                                value={shipment.destination_name}
                            />
                            <Field label="Layanan" value={shipment.service} />
                            <Field
                                label="Berat"
                                value={
                                    shipment.weight
                                        ? `${shipment.weight} kg`
                                        : null
                                }
                            />
                            <Field
                                label="Nilai Kiriman"
                                value={
                                    shipment.amount
                                        ? `Rp ${Number(shipment.amount).toLocaleString("id-ID")}`
                                        : null
                                }
                            />
                            <Field label="Coding" value={shipment.coding} />
                            <Field
                                label="Reciver Reasons"
                                value={shipment.receiver_reason}
                            />
                        </div>
                    </div>

                    {/* Penerima & Lokasi */}
                    <div className="space-y-5">
                        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                            <h2 className="mb-4 font-bold text-[#10264A]">
                                Data Penerima
                            </h2>
                            <div className="space-y-4">
                                <Field
                                    label="Nama Penerima"
                                    value={shipment.consignee_name}
                                />
                                <Field label="Alamat 1" value={shipment.adr1} />
                                <Field label="Alamat 2" value={shipment.adr2} />
                                <Field label="Alamat 3" value={shipment.adr3} />
                            </div>
                        </div>

                        {shipment.latlong && shipment.latlong !== "," && (
                            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                                <h2 className="mb-3 font-bold text-[#10264A]">
                                    Lokasi GPS
                                </h2>
                                <p className="font-mono text-xs text-slate-500">
                                    {shipment.latlong}
                                </p>
                                {(() => {
                                    const [lat, lng] = (shipment.latlong || "")
                                        .split(",")
                                        .map(Number);
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
                        {shipment.import_batch && (
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
                                <p className="text-xs font-semibold text-slate-400">
                                    Import Batch
                                </p>
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
                        <h2 className="mb-5 font-bold text-[#10264A]">
                            Foto POD ({photos.length} foto)
                        </h2>
                        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                            {photos.map((url, i) => (
                                <a
                                    key={i}
                                    href={url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="group relative aspect-square overflow-hidden rounded-xl border border-slate-200 bg-slate-100"
                                >
                                    <img
                                        src={url}
                                        alt={`Foto ${i + 1}`}
                                        className="h-full w-full object-cover transition group-hover:scale-105"
                                        onError={(e) => {
                                            e.target.style.display = "none";
                                        }}
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center bg-slate-950/0 text-white opacity-0 transition group-hover:bg-slate-950/30 group-hover:opacity-100">
                                        <span className="text-sm font-medium">
                                            🔍 Buka
                                        </span>
                                    </div>
                                </a>
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
