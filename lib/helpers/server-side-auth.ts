import { redirect } from 'next/navigation';
import { createClient } from "../supabase/server";
import { getUserDetails } from "../rbac/helpers.server";
import { type UserWithRBAC } from "../rbac/shared";
import { cache } from 'react';

export const getServerAuth = (async (): Promise<UserWithRBAC | null> => {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.getUser();

    if (error || !data?.user) return null;

    const userDetails = await getUserDetails(data.user.id, supabase);

    if (!userDetails) return null;

    const { id, ...detailsWithoutId } = userDetails;
    return { ...data.user, ...detailsWithoutId };
});

export async function logout() {
    'use server';

    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect('/login');
}