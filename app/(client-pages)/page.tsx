"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LogoutButton } from "@/components/logout-button";
import { useAuth } from "@/lib/context/auth-context";
import { ThemeSwitcher } from "@/components/theme-switcher";

export default function RootPage() {
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
        <main className="min-h-screen p-6 relative">
            <div className="absolute top-6 right-6">
                <ThemeSwitcher />
            </div>
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header Section */}
                <div className="text-center space-y-4 pt-8">
                    <div className="space-y-2">
                        <h1 className="text-4xl md:text-5xl font-bold">NextJS + Supabase + RBAC Boilerplate</h1>
                        <p className="text-sm md:text-base text-muted-foreground">
                            Bu sayfa herkesin erişebileceği public bir sayfadır.
                        </p>
                    </div>
                    <div className="pt-2 space-y-2">
                        <p className="text-lg md:text-xl font-semibold">Author: Kerim Külah</p>
                        <Badge variant="outline" className="text-xs">
                            Geliştirilme Aşamasında
                        </Badge>
                    </div>
                </div>

                {/* User Info Card */}
                {user && (
                    <Card className="w-full">
                        <CardHeader>
                            <CardTitle>Kullanıcı Bilgileri</CardTitle>
                            <CardDescription>
                                Bu kısım sadece giriş yapılmışsa gözükür.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium">{user.email}</span>
                                    {user.role && (
                                        <Badge variant={getRoleBadgeVariant(user.role)}>
                                            {user.role}
                                        </Badge>
                                    )}
                                </div>
                                <LogoutButton />
                            </div>
                            {user.role === 'user' && user.permissions && user.permissions.length > 0 && (
                                <div className="pt-2 border-t">
                                    <p className="text-xs font-medium mb-2 text-muted-foreground">Permissions:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {user.permissions.map((permission) => (
                                            <Badge key={permission} variant="outline">
                                                {permission}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Authentication Section */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Authentication</CardTitle>
                            <CardDescription>
                                Giriş ve kayıt sayfaları
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex flex-wrap gap-2">
                                <Button asChild variant="outline" className="flex-1 min-w-[120px]">
                                    <Link href="/login">Login</Link>
                                </Button>
                                <Button asChild variant="outline" className="flex-1 min-w-[120px]">
                                    <Link href="/sign-up">Register</Link>
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Eğer zaten giriş yaptıysanız, bu sayfalara girmeye çalıştığınızda ana sayfaya yönlendirilirsiniz.
                            </p>
                        </CardContent>
                    </Card>

                    {/* Protected Pages Section */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Protected Pages</CardTitle>
                            <CardDescription>
                                Giriş gerektiren sayfalar
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex flex-wrap gap-2">
                                <Button asChild variant="default" className="flex-1 min-w-[140px]">
                                    <Link href="/client-side-page">Client Side Page</Link>
                                </Button>
                                <Button asChild variant="default" className="flex-1 min-w-[140px]">
                                    <Link href="/server-side-page">Server Side Page</Link>
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Bu sayfalara erişmek için giriş yapmanız gerekmektedir.
                            </p>
                        </CardContent>
                    </Card>

                    {/* Permission Test Pages */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Permission Test Sayfaları</CardTitle>
                            <CardDescription>
                                Permission bazlı erişim kontrolü
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-3">
                                <div>
                                    <p className="text-xs font-medium mb-2 text-muted-foreground">İK Permission:</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Button asChild variant="default" size="sm">
                                            <Link href="/client-bordro">Client Bordro</Link>
                                        </Button>
                                        <Button asChild variant="default" size="sm">
                                            <Link href="/server-bordro">Server Bordro</Link>
                                        </Button>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs font-medium mb-2 text-muted-foreground">Muhasebe Permission:</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Button asChild variant="default" size="sm">
                                            <Link href="/client-finans">Client Finans</Link>
                                        </Button>
                                        <Button asChild variant="default" size="sm">
                                            <Link href="/server-finans">Server Finans</Link>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Bu sayfalar ilgili permission'a sahip userlar veya admin yükseğindeki roller (admin, superadmin) tarafından erişilebilir.
                            </p>
                        </CardContent>
                    </Card>

                    {/* Role Test Pages */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Role Test Sayfaları</CardTitle>
                            <CardDescription>
                                Role bazlı erişim kontrolü
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-3">
                                <div>
                                    <p className="text-xs font-medium mb-2 text-muted-foreground">Admin Role:</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Button asChild variant="default" size="sm">
                                            <Link href="/client-admin">Client Admin</Link>
                                        </Button>
                                        <Button asChild variant="default" size="sm">
                                            <Link href="/server-admin">Server Admin</Link>
                                        </Button>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs font-medium mb-2 text-muted-foreground">Superadmin Role:</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Button asChild variant="default" size="sm">
                                            <Link href="/client-superadmin">Client Superadmin</Link>
                                        </Button>
                                        <Button asChild variant="default" size="sm">
                                            <Link href="/server-superadmin">Server Superadmin</Link>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Admin sayfalarına admin veya superadmin rolüne sahip kullanıcılar erişebilir. Superadmin sayfalarına sadece superadmin rolüne sahip kullanıcılar erişebilir.
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Public Pages Section */}
                <Card>
                    <CardHeader>
                        <CardTitle>Public Pages</CardTitle>
                        <CardDescription>
                            Herkese açık sayfalar
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex flex-wrap gap-2">
                            <Button asChild variant="secondary">
                                <Link href="/about">About</Link>
                            </Button>
                            <Button asChild variant="secondary">
                                <Link href="/faq">FAQ</Link>
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Bu sayfalar herkese açıktır, giriş yapmadan erişilebilir.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}