import { redirect } from 'next/navigation';
import { createClient } from "../supabase/server";
import { canAccessRoute, enrichUserWithRBAC, type UserWithRBAC } from "../rbac/helpers";

// Layoutta kullan (Güncel metadatayı da alır.)
export async function getServerAuth(): Promise<UserWithRBAC | null> {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();

    if (error || !data?.user) return null;

    return enrichUserWithRBAC(data.user);
}


// Layoutta kontrol yapıldıysa page'de kullanım için user'ı al
export async function getServerUser(): Promise<UserWithRBAC | null> {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getSession();

    if (error || !data?.session?.user) return null;

    return enrichUserWithRBAC(data.session.user);
}


// Route erişim kontrolü yapar
export async function requireRouteAccess(pathname: string): Promise<UserWithRBAC> {
    const user = await getServerAuth();

    if (!user) redirect('/login');

    const hasAccess = canAccessRoute(user, pathname);

    if (!hasAccess) redirect('/unauthorized');

    return user;
}

export async function logout() {
    'use server';

    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect('/login');
}