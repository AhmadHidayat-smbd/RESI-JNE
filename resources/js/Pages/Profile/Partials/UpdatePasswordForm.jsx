import { useForm } from "@inertiajs/react";

export default function UpdatePasswordForm({ className = "" }) {
    const {
        data,
        setData,
        put,
        errors,
        processing,
        recentlySuccessful,
        reset,
    } = useForm({
        current_password: "",
        password: "",
        password_confirmation: "",
    });

    const submit = (e) => {
        e.preventDefault();

        put(route("password.update"), {
            preserveScroll: true,
            onSuccess: () => reset(),
        });
    };

    return (
        <section className={className}>
            <form onSubmit={submit} className="space-y-6">
                {/* Password saat ini */}
                <div>
                    <label
                        htmlFor="current_password"
                        className="mb-2 block text-sm font-semibold text-slate-800"
                    >
                        Password Saat Ini
                    </label>

                    <input
                        id="current_password"
                        type="password"
                        name="current_password"
                        value={data.current_password}
                        onChange={(e) =>
                            setData("current_password", e.target.value)
                        }
                        autoComplete="current-password"
                        required
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#244775] focus:outline-none focus:ring-4 focus:ring-blue-900/10"
                        placeholder="Masukkan password saat ini"
                    />

                    {errors.current_password && (
                        <p className="mt-2 text-sm font-medium text-red-600">
                            {errors.current_password}
                        </p>
                    )}
                </div>

                {/* Password baru */}
                <div>
                    <label
                        htmlFor="password"
                        className="mb-2 block text-sm font-semibold text-slate-800"
                    >
                        Password Baru
                    </label>

                    <input
                        id="password"
                        type="password"
                        name="password"
                        value={data.password}
                        onChange={(e) => setData("password", e.target.value)}
                        autoComplete="new-password"
                        required
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#244775] focus:outline-none focus:ring-4 focus:ring-blue-900/10"
                        placeholder="Masukkan password baru"
                    />

                    {errors.password && (
                        <p className="mt-2 text-sm font-medium text-red-600">
                            {errors.password}
                        </p>
                    )}
                </div>

                {/* Konfirmasi password */}
                <div>
                    <label
                        htmlFor="password_confirmation"
                        className="mb-2 block text-sm font-semibold text-slate-800"
                    >
                        Konfirmasi Password Baru
                    </label>

                    <input
                        id="password_confirmation"
                        type="password"
                        name="password_confirmation"
                        value={data.password_confirmation}
                        onChange={(e) =>
                            setData("password_confirmation", e.target.value)
                        }
                        autoComplete="new-password"
                        required
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#244775] focus:outline-none focus:ring-4 focus:ring-blue-900/10"
                        placeholder="Ulangi password baru"
                    />

                    {errors.password_confirmation && (
                        <p className="mt-2 text-sm font-medium text-red-600">
                            {errors.password_confirmation}
                        </p>
                    )}
                </div>

                {/* Informasi keamanan */}
                <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4">
                    <span className="mt-0.5 font-bold text-blue-800">i</span>

                    <p className="text-sm leading-6 text-blue-950">
                        Gunakan password yang kuat dan berbeda dari password
                        akun lainnya. Password baru harus memenuhi aturan
                        validasi yang diterapkan server.
                    </p>
                </div>

                {/* Tombol simpan */}
                <div className="flex flex-wrap items-center gap-4 border-t border-slate-100 pt-5">
                    <button
                        type="submit"
                        disabled={processing}
                        className="inline-flex items-center justify-center rounded-xl bg-[#10264A] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#193965] focus:outline-none focus:ring-4 focus:ring-blue-900/20 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {processing ? "Memperbarui..." : "Perbarui Password"}
                    </button>

                    {recentlySuccessful && (
                        <p
                            role="status"
                            className="text-sm font-semibold text-emerald-700"
                        >
                            Password berhasil diperbarui.
                        </p>
                    )}
                </div>
            </form>
        </section>
    );
}
