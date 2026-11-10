import { useState } from "react";
import { Link, router, usePage } from "@inertiajs/react";

const navigationGroups = [
    {
        label: "MENU UTAMA",
        items: [
            { name: "Dashboard", href: "/dashboard", icon: "▦" },
            { name: "Monitoring Resi", href: "/resi", icon: "▤" },
        ],
    },
    {
        label: "PREFERENSI",
        items: [{ name: "Profile", href: "/profile", icon: "♙" }],
    },
];

export default function UserLayout({ header, children }) {
    const { auth } = usePage().props;
    const user = auth?.user;
    const currentPath = usePage().url.split("?")[0];
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const initials = (user?.name || "User")
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((word) => word[0])
        .join("")
        .toUpperCase();

    const isActive = (href) => href === "/dashboard"
        ? currentPath === href || currentPath === `${href}/`
        : currentPath === href || currentPath.startsWith(`${href}/`);

    return (
        <div className="min-h-screen bg-[#F5F7FB] text-slate-800">
            {sidebarOpen && (
                <button
                    type="button"
                    aria-label="Tutup menu"
                    onClick={() => setSidebarOpen(false)}
                    className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden"
                />
            )}

            <aside
                className={`fixed inset-y-0 left-0 z-50 flex w-[250px] flex-col border-r border-slate-200 bg-white transition-transform duration-200 lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
            >
                <div className="flex h-[78px] shrink-0 items-center gap-3 border-b border-slate-100 px-6">
                    <div className="flex h-12 w-[76px] shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white p-1">
                        <img src="/images/naga-cargo.jpeg" alt="Naga Cargo Logo" className="h-full w-full object-contain" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-bold text-[#10264A]">NAGA CARGO</p>
                        <p className="text-[10px] text-slate-500">Shipment Monitoring</p>
                    </div>
                </div>

                <nav className="flex-1 space-y-8 overflow-y-auto px-4 py-7" aria-label="Menu pengguna">
                    {navigationGroups.map((group) => (
                        <div key={group.label}>
                            <p className="mb-3 px-3 text-[10px] font-bold tracking-[0.16em] text-slate-400">
                                {group.label}
                            </p>
                            <div className="space-y-1">
                                {group.items.map((item) => (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setSidebarOpen(false)}
                                        className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition ${
                                            isActive(item.href)
                                                ? "bg-[#10264A] text-white shadow-md shadow-blue-950/10"
                                                : "text-slate-500 hover:bg-slate-50 hover:text-[#10264A]"
                                        }`}
                                    >
                                        <span className="flex h-5 w-5 items-center justify-center text-lg" aria-hidden="true">
                                            {item.icon}
                                        </span>
                                        {item.name}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    ))}
                </nav>

                <div className="shrink-0 border-t border-slate-100 p-4">
                    <button
                        type="button"
                        onClick={() => router.post("/logout")}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                    >
                        <span className="text-lg" aria-hidden="true">↪</span>
                        Keluar
                    </button>
                    <p className="mt-3 px-3 text-[10px] text-slate-400">Naga Cargo • v1.0</p>
                </div>
            </aside>

            <div className="min-h-screen lg:pl-[250px]">
                <header className="sticky top-0 z-30 flex h-[78px] items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-8">
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setSidebarOpen(true)}
                            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
                            aria-label="Buka menu"
                        >
                            ☰
                        </button>
                        <div>
                            <p className="text-sm font-semibold text-slate-800">{header || "Dashboard Overview"}</p>
                            <p className="hidden text-xs text-slate-400 sm:block">Naga Cargo • Project Monitoring System</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="hidden text-right sm:block">
                            <p className="text-sm font-semibold text-slate-800">{user?.name || "User"}</p>
                            <p className="text-xs text-slate-500">User</p>
                        </div>
                        <div
                            aria-hidden="true"
                            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E7EDF8] text-sm font-bold text-[#10264A]"
                        >
                            {initials}
                        </div>
                    </div>
                </header>

                <main className="mx-auto w-full max-w-[1600px] p-4 sm:p-8">{children}</main>
            </div>
        </div>
    );
}
