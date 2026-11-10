import { useEffect, useState } from "react";
import { Head, Link, router, useForm, usePage } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";

const EMPTY_FORM = {
    name: "",
    email: "",
    role: "user",
    password: "",
    password_confirmation: "",
};

function UserForm({ editing, onClose }) {
    const form = useForm({
        ...EMPTY_FORM,
        name: editing?.name || "",
        email: editing?.email || "",
        role: editing?.role || "user",
    });

    const submit = (event) => {
        event.preventDefault();
        const options = {
            preserveScroll: true,
            onSuccess: onClose,
        };

        if (editing) {
            form.put(`/users/${editing.id}`, options);
            return;
        }

        form.post("/users", options);
    };

    const fields = [
        { key: "name", label: "Nama", type: "text", autoComplete: "name" },
        { key: "email", label: "Email", type: "email", autoComplete: "email" },
    ];

    return (
        <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                    <h2 className="text-base font-bold text-[#10264A]">
                        {editing ? "Edit Pengguna" : "Tambah Pengguna"}
                    </h2>
                    <p className="mt-1 text-xs text-slate-500">
                        {editing
                            ? "Kosongkan password jika tidak ingin mengubahnya."
                            : "Akun baru dapat diberi akses Admin atau User."}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Tutup formulir"
                    className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                >
                    ✕
                </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                {fields.map(({ key, label, type, autoComplete }) => (
                    <label key={key} className="block">
                        <span className="mb-1.5 block text-xs font-semibold text-slate-600">{label}</span>
                        <input
                            type={type}
                            autoComplete={autoComplete}
                            value={form.data[key]}
                            onChange={(event) => form.setData(key, event.target.value)}
                            required
                            maxLength={255}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-800 focus:bg-white focus:ring-2 focus:ring-blue-900/10"
                        />
                        {form.errors[key] && <span className="mt-1 block text-xs text-red-600">{form.errors[key]}</span>}
                    </label>
                ))}

                <label className="block">
                    <span className="mb-1.5 block text-xs font-semibold text-slate-600">Role</span>
                    <select
                        value={form.data.role}
                        onChange={(event) => form.setData("role", event.target.value)}
                        required
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-800 focus:bg-white focus:ring-2 focus:ring-blue-900/10"
                    >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                    </select>
                    {form.errors.role && <span className="mt-1 block text-xs text-red-600">{form.errors.role}</span>}
                </label>

                <div className="hidden sm:block" />

                <label className="block">
                    <span className="mb-1.5 block text-xs font-semibold text-slate-600">
                        Password{editing ? " (opsional)" : ""}
                    </span>
                    <input
                        type="password"
                        autoComplete="new-password"
                        value={form.data.password}
                        onChange={(event) => form.setData("password", event.target.value)}
                        required={!editing}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-800 focus:bg-white focus:ring-2 focus:ring-blue-900/10"
                    />
                    {form.errors.password && <span className="mt-1 block text-xs text-red-600">{form.errors.password}</span>}
                </label>

                <label className="block">
                    <span className="mb-1.5 block text-xs font-semibold text-slate-600">Konfirmasi Password</span>
                    <input
                        type="password"
                        autoComplete="new-password"
                        value={form.data.password_confirmation}
                        onChange={(event) => form.setData("password_confirmation", event.target.value)}
                        required={!editing || Boolean(form.data.password)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-800 focus:bg-white focus:ring-2 focus:ring-blue-900/10"
                    />
                </label>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
                <button
                    type="submit"
                    disabled={form.processing}
                    className="rounded-xl bg-[#10264A] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#193965] disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {form.processing ? "Menyimpan..." : editing ? "Simpan Perubahan" : "Buat Akun"}
                </button>
                <button
                    type="button"
                    onClick={onClose}
                    className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                >
                    Batal
                </button>
            </div>
        </form>
    );
}

function RoleBadge({ role }) {
    const isAdmin = role === "admin";

    return (
        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${isAdmin ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-600"}`}>
            {isAdmin ? "Admin" : "User"}
        </span>
    );
}

export default function UserIndex({ users, filters = {}, roleCounts = {} }) {
    const { flash, errors = {} } = usePage().props;
    const [search, setSearch] = useState(filters.search || "");
    const [role, setRole] = useState(filters.role || "");
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState(null);

    useEffect(() => {
        setSearch(filters.search || "");
        setRole(filters.role || "");
    }, [filters.search, filters.role]);

    const closeForm = () => {
        setFormOpen(false);
        setEditing(null);
    };

    const openCreateForm = () => {
        setEditing(null);
        setFormOpen(true);
    };

    const openEditForm = (user) => {
        setEditing(user);
        setFormOpen(true);
    };

    const applyFilters = (event) => {
        event?.preventDefault();
        router.get("/users", { search: search || undefined, role: role || undefined }, {
            preserveState: true,
            replace: true,
        });
    };

    const deleteUser = (user) => {
        if (!window.confirm(`Hapus akun ${user.name}? Tindakan ini tidak dapat dibatalkan.`)) return;

        router.delete(`/users/${user.id}`, { preserveScroll: true });
    };

    return (
        <AuthenticatedLayout header="Manajemen Pengguna">
            <Head title="Manajemen Pengguna" />

            <div className="space-y-6">
                <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-sm text-slate-500">Kelola akun dan hak akses sistem.</p>
                        <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#10264A] sm:text-3xl">
                            Manajemen Pengguna
                        </h1>
                    </div>
                    <button
                        type="button"
                        onClick={openCreateForm}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#10264A] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#193965]"
                    >
                        <span aria-hidden="true">＋</span> Tambah Pengguna
                    </button>
                </section>

                {flash?.success && (
                    <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
                        {flash.success}
                    </div>
                )}
                {errors.user && (
                    <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                        {errors.user}
                    </div>
                )}

                <section className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Admin</p>
                        <p className="mt-2 text-3xl font-extrabold text-[#10264A]">{Number(roleCounts.admin || 0).toLocaleString("id-ID")}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">User</p>
                        <p className="mt-2 text-3xl font-extrabold text-[#10264A]">{Number(roleCounts.user || 0).toLocaleString("id-ID")}</p>
                    </div>
                </section>

                {formOpen && <UserForm key={editing?.id ?? "new-user"} editing={editing} onClose={closeForm} />}

                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <form onSubmit={applyFilters} className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row">
                        <input
                            type="search"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Cari nama atau email..."
                            aria-label="Cari nama atau email"
                            className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-800 focus:bg-white focus:ring-2 focus:ring-blue-900/10"
                        />
                        <select
                            value={role}
                            onChange={(event) => setRole(event.target.value)}
                            aria-label="Filter berdasarkan role"
                            className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-800 focus:bg-white"
                        >
                            <option value="">Semua Role</option>
                            <option value="admin">Admin</option>
                            <option value="user">User</option>
                        </select>
                        <button type="submit" className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                            Cari
                        </button>
                    </form>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[720px] text-left text-sm">
                            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                                <tr>
                                    <th className="px-5 py-3 font-semibold">Nama</th>
                                    <th className="px-5 py-3 font-semibold">Email</th>
                                    <th className="px-5 py-3 font-semibold">Role</th>
                                    <th className="px-5 py-3 font-semibold">Dibuat</th>
                                    <th className="px-5 py-3 text-right font-semibold">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {users.data.map((user) => (
                                    <tr key={user.id} className="transition hover:bg-slate-50/70">
                                        <td className="px-5 py-4 font-semibold text-slate-800">{user.name}</td>
                                        <td className="px-5 py-4 text-slate-600">{user.email}</td>
                                        <td className="px-5 py-4"><RoleBadge role={user.role} /></td>
                                        <td className="px-5 py-4 text-slate-500">
                                            {user.created_at ? new Date(user.created_at).toLocaleDateString("id-ID") : "—"}
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => openEditForm(user)}
                                                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => deleteUser(user)}
                                                    className="rounded-lg border border-red-100 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                                                >
                                                    Hapus
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {users.data.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="px-5 py-12 text-center text-sm text-slate-400">
                                            Tidak ada pengguna yang sesuai dengan pencarian.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
                        <p>
                            Menampilkan {users.from || 0}–{users.to || 0} dari {users.total.toLocaleString("id-ID")} pengguna
                        </p>
                        <div className="flex items-center gap-2">
                            {users.prev_page_url && (
                                <Link href={users.prev_page_url} preserveScroll className="rounded-lg border border-slate-200 px-3 py-2 font-semibold text-slate-600 hover:bg-slate-50">
                                    Sebelumnya
                                </Link>
                            )}
                            <span className="px-2">Halaman {users.current_page} dari {users.last_page}</span>
                            {users.next_page_url && (
                                <Link href={users.next_page_url} preserveScroll className="rounded-lg border border-slate-200 px-3 py-2 font-semibold text-slate-600 hover:bg-slate-50">
                                    Berikutnya
                                </Link>
                            )}
                        </div>
                    </div>
                </section>
            </div>
        </AuthenticatedLayout>
    );
}
