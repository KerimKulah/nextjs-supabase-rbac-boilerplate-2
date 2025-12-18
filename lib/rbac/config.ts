

export const RBAC_CONFIG = {
    routes: {
        '/finans': { permission: 'muhasebe' },
        '/vardiya': { permission: 'ik' },

        '/adminpanel': { role: 'admin' },
        '/superadminpanel': { role: 'superadmin' },

    } as const,
} as const;



export type Roles = 'user' | 'admin' | 'superadmin';

export type Routes = keyof typeof RBAC_CONFIG.routes;