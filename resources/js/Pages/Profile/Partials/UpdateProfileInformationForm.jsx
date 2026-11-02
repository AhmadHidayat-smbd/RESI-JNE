import { useForm, usePage } from "@inertiajs/react";
import { useEffect } from "react";

export default function UpdateProfileInformationForm({
    mustVerifyEmail,
    status,
    className = "",
}) {
    const user = usePage().props.auth.user;

    const { data, setData, patch, errors, processing, recentlySuccessful } =
        useForm({
            name: user.name || "",
            email: user.email || "",
        });

    useEffect(() => {
        setData({
            name: user.name || "",
            email: user.email || "",
        });
    }, [user.name, user.email]);

    const submit = (e) => {
        e.preventDefault();
        patch(route("profile.update"));
    };

    return (
        <section className={className}>
            <form onSubmit={submit} className="space-y-6">
                {/* Nama */}
                <div>
                    <label
                        htmlFor="name"
                        className="mb-2 block text-sm font-semibold text-slate-800"
                    >
                        Nama Lengkap
                    </label>

                    <input
                        id="name"
                        type="text"
                        name="name"
                        value={data.name}
                        onChange={(e) => setData("name", e.target.value)}
                        autoComplete="name"
                        required
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#244775] focus:outline-none focus:ring-4 focus:ring-blue-900/10"
                        placeholder="Masukkan nama lengkap"
                    />

                    {errors.name && (
                        <p className="mt-2 text-sm font-medium text-red-600">
                            {errors.name}
                        </p>
                    )}
                </div>

                {/* Email */}
                <div>
                    <label
                        htmlFor="email"
                        className="mb-2 block text-sm font-semibold text-slate-800"
                    >
                        Alamat Email
                    </label>

                    <input
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        onChange={(e) => setData("email", e.target.value)}
                        autoComplete="username"
                        required
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#244775] focus:outline-none focus:ring-4 focus:ring-blue-900/10"
                        placeholder="nama@perusahaan.com"
                    />

                    {errors.email && (
                        <p className="mt-2 text-sm font-medium text-red-600">
                            {errors.email}
                        </p>
                    )}
                </div>

                {/* Verifikasi email */}
                {mustVerifyEmail && user.email_verified_at === null && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                        <p className="text-sm leading-6 text-amber-900">
                            Alamat email kamu belum diverifikasi.
                        </p>

                        <a
                            href={route("verification.send")}
                            method="post"
                            as="button"
                            className="mt-2 text-sm font-semibold text-amber-800 underline underline-offset-4 hover:text-amber-950"
                        >
                            Kirim ulang email verifikasi
                        </a>

                        {status === "verification-link-sent" && (
                            <p className="mt-2 text-sm font-medium text-emerald-700">
                                Link verifikasi baru telah dikirim.
                            </p>
                        )}
                    </div>
                )}

                {/* Tombol simpan */}
                <div className="flex flex-wrap items-center gap-4 border-t border-slate-100 pt-5">
                    <button
                        type="submit"
                        disabled={processing}
                        className="inline-flex items-center justify-center rounded-xl bg-[#10264A] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#193965] focus:outline-none focus:ring-4 focus:ring-blue-900/20 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {processing ? "Menyimpan..." : "Simpan Perubahan"}
                    </button>

                    {recentlySuccessful && (
                        <p
                            role="status"
                            className="text-sm font-semibold text-emerald-700"
                        >
                            Perubahan berhasil disimpan.
                        </p>
                    )}
                </div>
            </form>
        </section>
    );
}
