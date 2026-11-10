import { usePage } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import UserLayout from "@/Layouts/User/UserLayout";

export default function RoleBasedLayout({ header, children }) {
    const { auth } = usePage().props;
    const Layout = auth?.user?.role === "user" ? UserLayout : AuthenticatedLayout;

    return <Layout header={header}>{children}</Layout>;
}
