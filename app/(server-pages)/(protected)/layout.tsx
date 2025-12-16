import { getServerAuth } from "@/lib/helpers/server-side-auth";
import { redirect } from "next/navigation";

export default async function ServerPagesProtectedLayout({ children }: { children: React.ReactNode }) {
    const user = await getServerAuth();

    if (!user) {
        redirect('/login');
    }

    return (
        <>{children}</>
    );
}