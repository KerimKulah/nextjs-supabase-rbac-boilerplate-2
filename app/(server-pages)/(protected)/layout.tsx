import { getServerAuth } from "@/lib/helpers/server-side-auth";
import { canAccessRoute } from "@/lib/rbac/helpers";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Auth ve RBAC kontrolü yapar
 */
export default async function ServerPagesProtectedLayout({ children }: { children: React.ReactNode }) {
    const user = await getServerAuth();

    if (!user) redirect('/login');

    const headersList = await headers();
    const pathname = headersList.get('x-pathname') || '';

    if (pathname && !canAccessRoute(user, pathname)) {
        redirect('/unauthorized');
    }


    return <>{children}</>;
}