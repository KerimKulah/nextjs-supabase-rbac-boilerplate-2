// lib/rbac/helpers.server.ts
import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { UserDetails } from "./shared";

/**
 * user_details tablosundan tüm detayları çeker (Server-only)
 * İleride tabloya yeni kolonlar eklendiğinde otomatik olarak döner
 */
export async function getUserDetails(
    userId: string,
    supabaseClient: SupabaseClient
): Promise<UserDetails | null> {
    // user_details tablosundan tüm kolonları çek
    const { data: userDetails, error } = await supabaseClient
        .from('user_details')
        .select('*')
        .eq('id', userId)
        .single();

    if (error || !userDetails) {
        return null;
    }

    return userDetails as UserDetails;
}

