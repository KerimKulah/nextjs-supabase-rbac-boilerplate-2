

export const RBAC_CONFIG = {
    routes: {
        // Server-side routes
        '/server-finans': { permission: 'muhasebe' },
        '/server-bordro': { permission: 'ik' },
        '/server-admin': { role: 'admin' },
        '/server-superadmin': { role: 'superadmin' },

        // Client-side routes
        '/client-finans': { permission: 'muhasebe' },
        '/client-bordro': { permission: 'ik' },
        '/client-admin': { role: 'admin' },
        '/client-superadmin': { role: 'superadmin' },

    } as const,
} as const;



export type Roles = 'user' | 'admin' | 'superadmin';

export type Routes = keyof typeof RBAC_CONFIG.routes;