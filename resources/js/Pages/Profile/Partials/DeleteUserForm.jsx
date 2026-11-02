import { useState } from "react";
import { useForm } from "@inertiajs/react";
import Modal from "@/Components/Modal";
import DangerButton from "@/Components/DangerButton";
import SecondaryButton from "@/Components/SecondaryButton";
import InputError from "@/Components/InputError";
import InputLabel from "@/Components/InputLabel";
import TextInput from "@/Components/TextInput";

export default function DeleteUserForm({ className = "" }) {
    const [confirmingUserDeletion, setConfirmingUserDeletion] = useState(false);

    const {
        data,
        setData,
        delete: destroy,
        processing,
        reset,
        errors,
        clearErrors,
    } = useForm({
        password: "",
    });

    const confirmUserDeletion = () => {
        clearErrors();
        setData("password", "");
        setConfirmingUserDeletion(true);
    };

    const closeModal = () => {
        setConfirmingUserDeletion(false);
        clearErrors();
        reset();
    };

    const deleteUser = (e) => {
        e.preventDefault();

        destroy(route("profile.destroy"), {
            preserveScroll: true,
            onSuccess: () => closeModal(),
            onError: () => {
                document.getElementById("delete_password")?.focus();
            },
            onFinish: () => reset(),
        });
    };

    return (
        <section className={className}>
            <div>
                <h3 className="text-base font-bold text-red-800">
                    Hapus Account
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-700">
                    Setelah akun dihapus, seluruh data yang terkait dengan akun
                    tersebut dapat terhapus secara permanen. Pastikan Anda
                    benar-benar ingin melanjutkan tindakan ini.
                </p>
            </div>

            <div className="mt-5">
                <button
                    type="button"
                    onClick={confirmUserDeletion}
                    className="inline-flex items-center justify-center rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-600/20"
                >
                    Hapus Akun
                </button>
            </div>

            <Modal show={confirmingUserDeletion} onClose={closeModal}>
                <form onSubmit={deleteUser} className="p-6">
                    <h2 className="text-lg font-bold text-slate-900">
                        Konfirmasi Penghapusan Akun
                    </h2>

                    <p className="mt-3 text-sm leading-6 text-slate-600">
                        Masukkan password akun Anda untuk mengonfirmasi
                        penghapusan. Tindakan ini tidak dapat dibatalkan.
                    </p>

                    <div className="mt-6">
                        <InputLabel
                            htmlFor="delete_password"
                            value="Password"
                            className="!text-slate-800"
                        />

                        <TextInput
                            id="delete_password"
                            type="password"
                            name="password"
                            value={data.password}
                            onChange={(e) =>
                                setData("password", e.target.value)
                            }
                            className="mt-2 block w-full !border-slate-300 !text-slate-900"
                            isFocused
                            autoComplete="current-password"
                        />

                        <InputError
                            message={errors.password}
                            className="mt-2"
                        />
                    </div>

                    <div className="mt-6 flex flex-wrap justify-end gap-3">
                        <SecondaryButton
                            type="button"
                            onClick={closeModal}
                            className="!border-slate-300 !bg-white !text-slate-700 hover:!bg-slate-100"
                        >
                            Batal
                        </SecondaryButton>

                        <DangerButton
                            type="submit"
                            disabled={processing}
                            className="!bg-red-600 !text-white hover:!bg-red-700"
                        >
                            {processing ? "Menghapus..." : "Hapus Akun"}
                        </DangerButton>
                    </div>
                </form>
            </Modal>
        </section>
    );
}
