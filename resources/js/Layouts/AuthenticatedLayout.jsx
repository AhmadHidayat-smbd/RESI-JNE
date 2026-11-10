import { useState } from "react";
import { Link, usePage, router } from "@inertiajs/react";

const menuItems = [
    {
        label: "MENU UTAMA",
        items: [
            {
                name: "Dashboard",
                href: "/dashboard",
                icon: "▦",
            },
            {
                name: "Monitoring Resi",
                href: "/resi",
                icon: "▤",
                children: [
                    { name: "Daftar Resi", href: "/resi" },
                    { name: "Import Data", href: "/resi/import" },
                ],
            },
            {
                name: "Master Daerah",
                href: "/destinations",
                icon: "◎",
            },
        ],
    },
    {
        label: "PREFERENSI",
        items: [
            {
                name: "Manajemen Pengguna",
                href: "/users",
                icon: "♟",
                adminOnly: true,
            },
            {
                name: "Profile",
                href: "/profile",
                icon: "♙",
            },
        ],
    },
];

export default function AuthenticatedLayout({ header, children }) {
    const { auth } = usePage().props;
    const user = auth?.user;
    const currentUrl = usePage().url;

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);

    // Active menu
    const isActive = (href) => {
        if (href === "/dashboard") {
            return currentUrl === "/dashboard" || currentUrl === "/dashboard/";
        }

        return currentUrl === href || currentUrl.startsWith(`${href}/`);
    };

    // User initials
    const initials = (user?.name || "Admin")
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((word) => word[0])
        .join("")
        .toUpperCase();

    // Logout
    const logout = () => {
        router.post("/logout");
    };

    return (
        <div className="min-h-screen bg-[#F5F7FB] text-slate-800">
            {/* Mobile Overlay */}
            {sidebarOpen && (
                <button
                    type="button"
                    aria-label="Tutup menu"
                    onClick={() => setSidebarOpen(false)}
                    className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden"
                />
            )}

            {/* ====================================== */}
            {/* SIDEBAR */}
            {/* ====================================== */}

            <aside
                className={`fixed inset-y-0 left-0 z-50 flex w-[250px] flex-col border-r border-slate-200 bg-white transition-transform duration-200 lg:translate-x-0 ${
                    sidebarOpen ? "translate-x-0" : "-translate-x-full"
                }`}
            >
                {/* BRANDING / LOGO */}
                <div className="flex h-[78px] shrink-0 items-center gap-3 border-b border-slate-100 px-6">
                    {/* NAGA CARGO LOGO */}
                    <div className="flex h-12 w-[76px] shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white p-1">
                        <img
                            src="/images/naga-cargo.jpeg"
                            alt="Naga Cargo Logo"
                            className="h-full w-full object-contain"
                        />
                    </div>

                    {/* APPLICATION NAME */}
                    <div className="min-w-0">
                        <p className="text-sm font-bold text-[#10264A]">
                            NAGA CARGO
                        </p>

                        <p className="text-[10px] text-slate-500">
                            Shipment Monitoring
                        </p>
                    </div>
                </div>

                {/* ====================================== */}
                {/* SIDEBAR MENU */}
                {/* ====================================== */}

                <nav className="flex-1 space-y-8 overflow-y-auto px-4 py-7">
                    {menuItems.map((group) => (
                        <div key={group.label}>
                            {/* Menu Group Title */}
                            <p className="mb-3 px-3 text-[10px] font-bold tracking-[0.16em] text-slate-400">
                                {group.label}
                            </p>

                            <div className="space-y-1">
                                {group.items
                                    .filter((item) => !item.adminOnly || user?.role === "admin")
                                    .map((item) => {
                                    const active = isActive(item.href);
                                    const hasChildren =
                                        item.children?.length > 0;

                                    const childActive =
                                        hasChildren &&
                                        item.children.some((child) =>
                                            isActive(child.href),
                                        );

                                    return (
                                        <div key={item.name}>
                                            {/* Main Menu */}
                                            <Link
                                                href={item.href}
                                                onClick={() =>
                                                    setSidebarOpen(false)
                                                }
                                                className={`group flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition ${
                                                    active || childActive
                                                        ? "bg-[#10264A] text-white shadow-md shadow-blue-950/10"
                                                        : "text-slate-500 hover:bg-slate-50 hover:text-[#10264A]"
                                                }`}
                                            >
                                                <span className="flex h-5 w-5 items-center justify-center text-lg">
                                                    {item.icon}
                                                </span>

                                                {item.name}
                                            </Link>

                                            {/* Sub Menu */}
                                            {hasChildren &&
                                                (active || childActive) && (
                                                    <div className="ml-9 mt-1 space-y-0.5 border-l border-slate-100 pl-3">
                                                        {item.children.map(
                                                            (child) => (
                                                                <Link
                                                                    key={
                                                                        child.name
                                                                    }
                                                                    href={
                                                                        child.href
                                                                    }
                                                                    onClick={() =>
                                                                        setSidebarOpen(
                                                                            false,
                                                                        )
                                                                    }
                                                                    className={`block rounded-md px-3 py-2 text-xs font-medium transition ${
                                                                        isActive(
                                                                            child.href,
                                                                        )
                                                                            ? "bg-slate-100 text-[#10264A]"
                                                                            : "text-slate-400 hover:bg-slate-50 hover:text-[#10264A]"
                                                                    }`}
                                                                >
                                                                    {child.name}
                                                                </Link>
                                                            ),
                                                        )}
                                                    </div>
                                                )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </nav>

                {/* ====================================== */}
                {/* SIDEBAR FOOTER */}
                {/* ====================================== */}

                <div className="shrink-0 border-t border-slate-100 p-4">
                    <button
                        type="button"
                        onClick={logout}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                    >
                        <span className="text-lg">↪</span>
                        Keluar
                    </button>

                    <p className="mt-3 px-3 text-[10px] text-slate-400">
                        Naga Cargo • v1.0
                    </p>
                </div>
            </aside>

            {/* ====================================== */}
            {/* MAIN CONTENT */}
            {/* ====================================== */}

            <div className="min-h-screen lg:pl-[250px]">
                {/* ====================================== */}
                {/* TOP NAVBAR */}
                {/* ====================================== */}

                <header className="sticky top-0 z-30 flex h-[78px] items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-8">
                    {/* LEFT NAVBAR */}
                    <div className="flex items-center gap-3">
                        {/* Mobile Menu Button */}
                        <button
                            type="button"
                            onClick={() => setSidebarOpen(true)}
                            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
                            aria-label="Buka menu"
                        >
                            ☰
                        </button>

                        {/* Page Title */}
                        <div>
                            <p className="text-sm font-semibold text-slate-800">
                                {header || "Dashboard Overview"}
                            </p>

                            <p className="hidden text-xs text-slate-400 sm:block">
                                Naga Cargo • Project Monitoring System
                            </p>
                        </div>
                    </div>

                    {/* RIGHT NAVBAR - PROFILE */}
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setProfileOpen(!profileOpen)}
                            className="flex items-center gap-3 rounded-xl p-1.5 transition hover:bg-slate-50"
                            aria-expanded={profileOpen}
                            aria-label="Menu profil pengguna"
                        >
                            {/* User Information */}
                            <div className="hidden text-right sm:block">
                                <p className="text-sm font-semibold text-slate-800">
                                    {user?.name || "Administrator"}
                                </p>

                                <p className="text-xs text-slate-500">
                                    Administrator
                                </p>
                            </div>

                            {/* User Avatar */}
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E7EDF8] text-sm font-bold text-[#10264A]">
                                {initials}
                            </div>
                        </button>

                        {/* PROFILE DROPDOWN */}
                        {profileOpen && (
                            <>
                                <button
                                    type="button"
                                    aria-label="Tutup menu profil"
                                    className="fixed inset-0 z-10 cursor-default"
                                    onClick={() => setProfileOpen(false)}
                                />

                                <div className="absolute right-0 z-20 mt-3 w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
                                    {/* User Detail */}
                                    <div className="border-b border-slate-100 px-3 py-3">
                                        <p className="truncate text-sm font-semibold text-slate-900">
                                            {user?.name || "Administrator"}
                                        </p>

                                        <p className="truncate text-xs text-slate-500">
                                            {user?.email}
                                        </p>
                                    </div>

                                    {/* Profile Link */}
                                    <Link
                                        href="/profile"
                                        onClick={() => setProfileOpen(false)}
                                        className="mt-1 block rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-[#10264A]"
                                    >
                                        Pengaturan Profile
                                    </Link>

                                    {/* Logout */}
                                    <button
                                        type="button"
                                        onClick={logout}
                                        className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600 transition hover:bg-red-50"
                                    >
                                        Keluar
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </header>

                {/* ====================================== */}
                {/* PAGE CONTENT */}
                {/* ====================================== */}

                <main className="mx-auto w-full max-w-[1600px] p-4 sm:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
