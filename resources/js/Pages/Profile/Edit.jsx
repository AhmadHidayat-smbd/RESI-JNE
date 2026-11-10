import RoleBasedLayout from "@/Layouts/RoleBasedLayout";
import { Head, usePage } from "@inertiajs/react";

import DeleteUserForm from "./Partials/DeleteUserForm";
import UpdatePasswordForm from "./Partials/UpdatePasswordForm";
import UpdateProfileInformationForm from "./Partials/UpdateProfileInformationForm";

export default function Edit({ mustVerifyEmail, status }) {
    const { auth } = usePage().props;
    const user = auth?.user;
    const isAdmin = user?.role === "admin";

    const initials = (user?.name || "Admin")
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((word) => word[0])
        .join("")
        .toUpperCase();

    return (
        <RoleBasedLayout header="Pengaturan Profil">
            <Head title="Pengaturan Profil" />

            <div className="mx-auto max-w-6xl space-y-7">
                {/* Page Heading */}
                <div>
                    <p className="text-sm font-semibold text-blue-800">
                        PENGATURAN AKUN
                    </p>

                    <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                        Profil Saya
                    </h1>

                    <p className="mt-2 text-sm leading-6 text-slate-600">
                        Kelola informasi pribadi dan keamanan akun Anda melalui
                        halaman ini.
                    </p>
                </div>

                {/* Profile Hero */}
                <section className="relative overflow-hidden rounded-2xl bg-[#10264A] p-6 shadow-lg shadow-blue-950/10 sm:p-8">
                    <div className="absolute -right-16 -top-24 h-64 w-64 rounded-full border-[35px] border-white/[0.06]" />
                    <div className="absolute -bottom-24 right-1/3 h-48 w-48 rounded-full bg-blue-400/10 blur-3xl" />

                    <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
                        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white text-2xl font-bold text-[#10264A] shadow-md">
                            {initials}
                        </div>

                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-blue-200">
                                Akun pengguna
                            </p>

                            <h2 className="mt-1 break-words text-2xl font-bold text-white">
                                {user?.name || "Administrator"}
                            </h2>

                            <p className="mt-2 break-all text-sm text-blue-100">
                                {user?.email || "Email belum tersedia"}
                            </p>
                        </div>

                        <div className="w-fit rounded-full border border-emerald-300/30 bg-emerald-400/10 px-4 py-2">
                            <div className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                                <span className="text-xs font-semibold text-emerald-100">
                                    Akun aktif
                                </span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Account Information */}
                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex items-start gap-4 border-b border-slate-200 px-6 py-5 sm:px-8">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-800">
                            <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                className="h-5 w-5"
                            >
                                <circle cx="12" cy="8" r="4" />
                                <path d="M5 21v-2a7 7 0 0 1 14 0v2" />
                            </svg>
                        </div>

                        <div>
                            <h2 className="text-base font-bold text-slate-900">
                                Informasi Profil
                            </h2>
                            <p className="mt-1 text-sm leading-6 text-slate-600">
                                Perbarui nama dan alamat email yang digunakan
                                untuk masuk ke sistem.
                            </p>
                        </div>
                    </div>

                    <div className="p-6 sm:p-8">
                        <UpdateProfileInformationForm
                            mustVerifyEmail={mustVerifyEmail}
                            status={status}
                            className="profile-form-enhanced max-w-3xl"
                        />
                    </div>
                </section>

                {/* Password */}
                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex items-start gap-4 border-b border-slate-200 px-6 py-5 sm:px-8">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-800">
                            <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                className="h-5 w-5"
                            >
                                <rect
                                    x="4"
                                    y="10"
                                    width="16"
                                    height="11"
                                    rx="2"
                                />
                                <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                            </svg>
                        </div>

                        <div>
                            <h2 className="text-base font-bold text-slate-900">
                                Keamanan Akun
                            </h2>
                            <p className="mt-1 text-sm leading-6 text-slate-600">
                                Ubah password secara berkala untuk menjaga
                                keamanan akun Anda.
                            </p>
                        </div>
                    </div>

                    <div className="p-6 sm:p-8">
                        <UpdatePasswordForm className="profile-form-enhanced max-w-3xl" />
                    </div>
                </section>

                {isAdmin && (
                    <section className="overflow-hidden rounded-2xl border border-red-200 bg-white shadow-sm">
                        <div className="flex items-start gap-4 border-b border-red-100 bg-red-50/70 px-6 py-5 sm:px-8">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-red-700 ring-1 ring-red-200">
                                <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.8"
                                    className="h-5 w-5"
                                >
                                    <path d="M3 6h18" />
                                    <path d="M8 6V4h8v2" />
                                    <path d="m19 6-1 14H6L5 6" />
                                    <path d="M10 11v5M14 11v5" />
                                </svg>
                            </div>

                            <div>
                                <h2 className="text-base font-bold text-red-800">
                                    Hapus Akun
                                </h2>
                                <p className="mt-1 text-sm leading-6 text-red-800">
                                    Tindakan ini bersifat permanen. Pastikan Anda
                                    memahami konsekuensinya sebelum melanjutkan.
                                </p>
                            </div>
                        </div>

                        <div className="p-6 sm:p-8">
                            <DeleteUserForm className="profile-form-enhanced max-w-3xl" />
                        </div>
                    </section>
                )}

                {status && (
                    <div
                        role="status"
                        className="rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-800"
                    >
                        {status}
                    </div>
                )}
            </div>
        </RoleBasedLayout>
    );
}
