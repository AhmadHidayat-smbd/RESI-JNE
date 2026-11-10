import { Head, useForm } from "@inertiajs/react";

export default function Login() {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: "",
        password: "",
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();

        post("/login", {
            onFinish: () => reset("password"),
        });
    };

    return (
        <>
            <Head title="Login - Naga Cargo Monitoring" />

            {/* MAIN CONTAINER */}
            <div className="min-h-screen bg-[#F5F7FB] lg:grid lg:h-dvh lg:min-h-0 lg:grid-cols-2 lg:overflow-hidden">
                {/* ====================================== */}
                {/* LEFT PANEL - BRANDING */}
                {/* ====================================== */}

                <div className="relative hidden h-full min-h-0 overflow-hidden bg-[#10264A] p-7 text-white lg:flex lg:flex-col lg:justify-between xl:p-9">
                    {/* Background Decoration */}
                    <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full border-[60px] border-white/5" />

                    <div className="absolute -bottom-40 -left-32 h-96 w-96 rounded-full bg-[#D9B64B]/10 blur-3xl" />

                    <div className="absolute bottom-20 right-10 h-64 w-64 rounded-full bg-blue-400/10 blur-3xl" />

                    {/* LOGO */}
                    <div className="relative z-10 shrink-0">
                        <div className="flex items-center gap-4">
                            <div className="flex h-20 w-50 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white p-3 shadow-lg">
                                <img
                                    src="/images/naga-cargo.jpeg"
                                    alt="Naga Cargo Logo"
                                    className="h-full w-full object-contain"
                                />
                            </div>

                            <h1 className="text-4xl font-bold leading-tight tracking-tight xl:text-4xl">
                                Naga Cargo
                                <span className="mt-2 block text-[#D9B64B]">
                                    Project Monitoring System
                                </span>
                            </h1>
                        </div>
                    </div>

                    {/* MAIN BRANDING CONTENT */}
                    <div className="relative z-10 my-5 max-w-xl -translate-y-5">
                        {/* Label */}
                        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#D9B64B]/30 bg-[#D9B64B]/10 px-4 py-2">
                            <span className="h-2 w-2 rounded-full bg-[#D9B64B]" />

                            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#F1D98A]">
                                Logistics Intelligence
                            </span>
                        </div>

                        {/* Heading */}
                        <h1 className="text-4xl font-bold leading-tight tracking-tight xl:text-5xl">
                            Monitor Pengiriman.
                            <span className="mt-2 block text-[#D9B64B]">
                                Kendalikan Performa.
                            </span>
                        </h1>

                        {/* Description */}
                        <p className="mt-5 max-w-lg text-sm leading-7 text-blue-100/90 xl:text-base">
                            Pantau status pengiriman, analisis performa
                            distribusi, dan temukan informasi resi dalam satu
                            dashboard monitoring yang terintegrasi.
                        </p>

                        {/* FEATURES */}
                        <div className="mt-14 grid grid-cols-3 gap-4">
                            <div className="border-l-2 border-[#D9B64B] pl-3">
                                <p className="font-semibold text-white">
                                    Tracking
                                </p>

                                <p className="mt-1 text-xs leading-5 text-blue-200">
                                    Monitoring nomor resi
                                </p>
                            </div>

                            <div className="border-l-2 border-blue-400 pl-3">
                                <p className="font-semibold text-white">
                                    Analytics
                                </p>

                                <p className="mt-1 text-xs leading-5 text-blue-200">
                                    Analisis pengiriman
                                </p>
                            </div>

                            <div className="border-l-2 border-white/40 pl-3">
                                <p className="font-semibold text-white">
                                    Reporting
                                </p>

                                <p className="mt-1 text-xs leading-5 text-blue-200">
                                    Laporan operasional
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* FOOTER LEFT */}
                    <div className="relative z-10 flex shrink-0 items-center justify-between gap-3 border-t border-white/10 pt-4">
                        <p className="text-xs text-blue-200">
                            Naga Cargo • Project Monitoring System
                        </p>

                        <p className="text-xs text-blue-300">
                            Internal Dashboard
                        </p>
                    </div>
                </div>

                {/* ====================================== */}
                {/* RIGHT PANEL - LOGIN */}
                {/* ====================================== */}

                <div className="flex min-h-screen items-center justify-center px-6 py-6 sm:px-10 lg:h-full lg:min-h-0 lg:overflow-y-auto lg:px-8 lg:py-3">
                    <div className="w-full max-w-md lg:py-2">
                        {/* MOBILE BRANDING */}
                        <div className="mb-8 lg:hidden">
                            <div className="flex items-center gap-4">
                                <div className="flex h-16 w-28 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white p-1.5 shadow-sm">
                                    <img
                                        src="/images/naga-cargo.jpeg"
                                        alt="Naga Cargo Logo"
                                        className="h-full w-full object-contain"
                                    />
                                </div>

                                <div>
                                    <p className="text-lg font-bold text-[#10264A]">
                                        NAGA CARGO
                                    </p>

                                    <p className="mt-1 text-xs text-slate-500">
                                        Shipment Monitoring System
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* LOGIN HEADING */}
                        <div className="mb-5">
                            {/* ICON */}
                            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#10264A] text-[#D9B64B] shadow-lg shadow-blue-950/10">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.8"
                                    className="h-7 w-7"
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

                            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.15em] text-[#B08B29]">
                                Welcome Back
                            </p>

                            <h2 className="text-3xl font-bold tracking-tight text-[#10264A]">
                                Selamat Datang
                            </h2>

                            <p className="mt-2 text-sm leading-6 text-slate-600">
                                Silakan masuk menggunakan akun Anda untuk
                                mengakses dashboard monitoring pengiriman.
                            </p>
                        </div>

                        {/* ================================= */}
                        {/* LOGIN FORM */}
                        {/* ================================= */}

                        <form onSubmit={submit} className="space-y-4">
                            {/* EMAIL */}
                            <div>
                                <label
                                    htmlFor="email"
                                    className="mb-2 block text-sm font-semibold text-slate-800"
                                >
                                    Email
                                </label>

                                <input
                                    id="email"
                                    type="email"
                                    name="email"
                                    autoComplete="username"
                                    autoFocus
                                    required
                                    value={data.email}
                                    onChange={(e) =>
                                        setData("email", e.target.value)
                                    }
                                    placeholder="Masukkan email Anda"
                                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#244775] focus:ring-4 focus:ring-blue-900/10"
                                />

                                {errors.email && (
                                    <p className="mt-2 text-sm font-medium text-red-600">
                                        {errors.email}
                                    </p>
                                )}
                            </div>

                            {/* PASSWORD */}
                            <div>
                                <label
                                    htmlFor="password"
                                    className="mb-2 block text-sm font-semibold text-slate-800"
                                >
                                    Password
                                </label>

                                <input
                                    id="password"
                                    type="password"
                                    name="password"
                                    autoComplete="current-password"
                                    required
                                    value={data.password}
                                    onChange={(e) =>
                                        setData("password", e.target.value)
                                    }
                                    placeholder="Masukkan password Anda"
                                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#244775] focus:ring-4 focus:ring-blue-900/10"
                                />

                                {errors.password && (
                                    <p className="mt-2 text-sm font-medium text-red-600">
                                        {errors.password}
                                    </p>
                                )}
                            </div>

                            {/* REMEMBER ME */}
                            <label className="flex cursor-pointer items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={data.remember}
                                    onChange={(e) =>
                                        setData("remember", e.target.checked)
                                    }
                                    className="h-4 w-4 rounded border-slate-300 text-[#10264A] focus:ring-[#244775]"
                                />

                                <span className="text-sm font-medium text-slate-700">
                                    Ingat saya
                                </span>
                            </label>

                            {/* LOGIN BUTTON */}
                            <button
                                type="submit"
                                disabled={processing}
                                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#10264A] px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-950/10 transition duration-200 hover:bg-[#193965] focus:outline-none focus:ring-4 focus:ring-blue-900/20 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {processing ? (
                                    <>
                                        <svg
                                            className="h-5 w-5 animate-spin"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                        >
                                            <circle
                                                className="opacity-25"
                                                cx="12"
                                                cy="12"
                                                r="10"
                                                stroke="currentColor"
                                                strokeWidth="4"
                                            />

                                            <path
                                                className="opacity-75"
                                                fill="currentColor"
                                                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                                            />
                                        </svg>
                                        Memproses...
                                    </>
                                ) : (
                                    <>
                                        Masuk ke Dashboard
                                        <svg
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            className="h-4 w-4"
                                        >
                                            <path d="M5 12h14M13 6l6 6-6 6" />
                                        </svg>
                                    </>
                                )}
                            </button>
                        </form>

                        {/* ================================= */}
                        {/* FOOTER RIGHT */}
                        {/* ================================= */}

                        <div className="mt-5 border-t border-slate-200 pt-4">
                            <p className="text-center text-xs leading-5 text-slate-500">
                                Akses terbatas untuk pengguna yang memiliki
                                akun. Gunakan kredensial yang telah diberikan
                                administrator.
                            </p>

                            <p className="mt-3 text-center text-xs font-medium text-slate-400">
                                © {new Date().getFullYear()} Naga Cargo. All
                                rights reserved.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
