import { getServerAuth } from '@/lib/helpers/server-side-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ServerLogoutButton } from '@/components/server-side-logout-button';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function ServerAdminPage() {
    const user = await getServerAuth();

    const getRoleBadgeVariant = (role: string) => {
        switch (role) {
            case 'superadmin':
                return 'destructive';
            case 'admin':
                return 'default';
            case 'user':
                return 'secondary';
            default:
                return 'outline';
        }
    };

    return (
        <main className="min-h-screen flex items-center justify-center p-4">
            <div className="flex flex-col items-center gap-4 w-full max-w-2xl">
                <Button asChild variant="ghost" className="self-start">
                    <Link href="/">← Ana Sayfaya Dön</Link>
                </Button>
                <p className="text-sm text-muted-foreground">
                    SERVER-ADMIN SAYFASI - Admin rolü gereklidir (Server-Side)
                </p>

                <Card className="w-full">
                    <CardHeader>
                        <CardTitle>Server Admin Paneli</CardTitle>
                        <CardDescription>Bu sayfaya admin veya superadmin rolüne sahip kullanıcılar erişebilir (Server-Side Rendering)</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-3">
                            <div>
                                <p className="text-sm font-medium">Email:</p>
                                <p className="text-sm text-muted-foreground">{user?.email}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium">User ID:</p>
                                <p className="text-sm text-muted-foreground font-mono text-xs break-all">{user?.id}</p>
                            </div>

                            {user?.role && (
                                <div>
                                    <p className="text-sm font-medium mb-2">Role:</p>
                                    <Badge variant={getRoleBadgeVariant(user.role)}>
                                        {user.role}
                                    </Badge>
                                </div>
                            )}

                            {user?.permissions && user.permissions.length > 0 && (
                                <div>
                                    <p className="text-sm font-medium mb-2">Permissions:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {user.permissions.map((permission) => (
                                            <Badge key={permission} variant="outline">
                                                {permission}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="pt-4">
                            <ServerLogoutButton />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}

