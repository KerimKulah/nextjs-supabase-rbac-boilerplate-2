import { redirect } from 'next/navigation';
import { createClient } from "../supabase/server";

// Layoutta kullan
export async function getServerAuth() {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();
    if (error) {
        console.error('Server-side auth error:', error);
        return null;
    }
    return data?.user ?? null;
}

// Layoutta kontrol yapıldıysa page'de kullanım için user'ı al
export async function getServerUser() {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getSession();
    if (error) {
        console.error('Server-side session error:', error);
        return null;
    }
    return data?.session?.user ?? null;
}

export async function logout() {
    'use server';

    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect('/login');
}