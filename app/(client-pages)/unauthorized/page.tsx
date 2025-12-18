"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/context/auth-context';

export default function UnauthorizedPage() {
    const { user } = useAuth();

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
        <main className="min-h-screen flex items-center justify-center">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Erişim Reddedildi</CardTitle>
                    <CardDescription>
                        Bu sayfaya erişim yetkiniz bulunmamaktadır.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Bu sayfaya erişmek için gerekli role veya permission'a sahip değilsiniz.
                    </p>

                    {/* Mevcut Rol ve Permission Bilgisi (Test için) */}
                    {user && (
                        <div className="space-y-2 p-3 bg-muted rounded-md">
                            <p className="text-xs font-medium text-muted-foreground">Mevcut Yetkileriniz:</p>
                            <div className="space-y-2">
                                <div>
                                    <p className="text-xs text-muted-foreground mb-1">Role:</p>
                                    <Badge variant={getRoleBadgeVariant(user.metadata.role)}>
                                        {user.metadata.role}
                                    </Badge>
                                </div>
                                {user.metadata.permissions && user.metadata.permissions.length > 0 && (
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-1">Permissions:</p>
                                        <div className="flex flex-wrap gap-1">
                                            {user.metadata.permissions.map((permission) => (
                                                <Badge key={permission} variant="outline" className="text-xs">
                                                    {permission}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="flex gap-2">
                        <Button asChild variant="default">
                            <Link href="/">Anasayfaya Dön</Link>
                        </Button>
                        <Button asChild variant="outline">
                            <Link href="/login">Giriş Yap</Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </main>
    );
}