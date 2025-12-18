// lib/rbac/helpers.ts
import type { User } from "@supabase/supabase-js";
import { RBAC_CONFIG, type Roles } from "./config";

export interface UserMetadata {
    role: Roles;
    permissions?: string[];
}

export type UserWithRBAC = User & {
    metadata: UserMetadata;
};

export function enrichUserWithRBAC(user: User): UserWithRBAC {
    const metadata: UserMetadata = {
        role: (user.app_metadata?.role as Roles) || 'user',
        permissions: Array.isArray(user.app_metadata?.permissions)
            ? user.app_metadata.permissions
            : [],
    };

    return { ...user, metadata };
}

/**
 * User'ın superadmin olup olmadığını kontrol eder
 */
export function isSuperAdmin(user: UserWithRBAC): boolean {
    return user.metadata.role === 'superadmin';
}

/**
 * User'ın admin veya superadmin olup olmadığını kontrol eder
 */
export function isAdmin(user: UserWithRBAC): boolean {
    return user.metadata.role === 'admin' || user.metadata.role === 'superadmin';
}

/**
 * User'ın belirli bir permission'a sahip olup olmadığını kontrol eder
 */
export function hasPermission(user: UserWithRBAC, permission: string): boolean {
    return user.metadata.permissions?.includes(permission) || false;
}

/**
 * User'ın belirli bir role'e sahip olup olmadığını kontrol eder
 */
export function hasRole(user: UserWithRBAC, role: Roles): boolean {
    return user.metadata.role === role;
}

/**
 * Pathname'in route ile eşleşip eşleşmediğini kontrol eder
 * - Exact match: /admin === /admin ✅
 * - Segment bazlı prefix: /admin/panel → /admin ✅
 * - Yanlış eşleşme: /adminpanel → /admin ❌
 */
function isRouteMatch(pathname: string, route: string): boolean {
    // Exact match
    if (pathname === route) return true;
    // Segment bazlı prefix match (route + '/' ile başlamalı)
    return pathname.startsWith(route + '/');
}

/**
 * Pathname'in config'deki route'lardan birinin eşleşip eşleşmediğini bulur
 * En uzun eşleşmeyi tercih eder (daha spesifik route'lar için)
 */
function findMatchingRoute(pathname: string): { route: string; config: typeof RBAC_CONFIG.routes[keyof typeof RBAC_CONFIG.routes] } | null {
    let longestMatch: { route: string; config: typeof RBAC_CONFIG.routes[keyof typeof RBAC_CONFIG.routes] } | null = null;

    for (const [route, config] of Object.entries(RBAC_CONFIG.routes)) {
        if (isRouteMatch(pathname, route)) {
            // En uzun eşleşmeyi tercih et (daha spesifik route'lar için)
            if (!longestMatch || route.length > longestMatch.route.length) {
                longestMatch = { route, config };
            }
        }
    }

    return longestMatch;
}

/**
 * User'ın belirli bir route'a erişip erişemediğini kontrol eder.
 * Prefix match destekler: /admin tanımlıysa /admin/panel da erişilebilir.
 */
export function canAccessRoute(user: UserWithRBAC, pathname: string): boolean {
    // 1. Superadmin her zaman erişebilir
    if (isSuperAdmin(user)) return true;

    // 2. Route config'e göre kontrol eder (exact veya prefix match)
    const match = findMatchingRoute(pathname);

    // Config'de yoksa = public route veya sadece auth gerekli
    if (!match) return true;

    const routeConfig = match.config;

    // 3. Permission kontrolü 
    if ('permission' in routeConfig) {
        // Admin ve superadmin tüm permissions'a erişebilir
        if (isAdmin(user)) return true;
        // User için permission kontrolü
        return hasPermission(user, routeConfig.permission);
    }

    // 4. Role kontrolü 
    if ('role' in routeConfig) {
        if (routeConfig.role === 'superadmin') {
            // Sadece superadmin girebilir (zaten yukarıda kontrol edildi, buraya gelirse false)
            return false;
        }
        if (routeConfig.role === 'admin') {
            // Admin ve superadmin girebilir
            return isAdmin(user);
        }
    }

    return false;
}