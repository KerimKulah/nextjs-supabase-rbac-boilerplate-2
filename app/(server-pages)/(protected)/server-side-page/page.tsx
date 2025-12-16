import { getServerUser } from '@/lib/helpers/server-side-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ServerLogoutButton } from '@/components/server-side-logout-button';

export default async function TestServerPage() {
    const user = await getServerUser();

    return (
        <main className="min-h-screen flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <p className="text-sm text-muted-foreground">
                    SERVER-SIDE PROTECTED PAGE
                </p>

                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle>Server-Side User Information</CardTitle>
                        <CardDescription>User data fetched on the server</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <div>
                                <p className="text-sm font-medium">Email:</p>
                                <p className="text-sm text-muted-foreground">{user?.email}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium">User ID:</p>
                                <p className="text-sm text-muted-foreground font-mono text-xs break-all">{user?.id}</p>
                            </div>
                            {user?.created_at && (
                                <div>
                                    <p className="text-sm font-medium">Account Created:</p>
                                    <p className="text-sm text-muted-foreground">
                                        {new Date(user.created_at).toLocaleString()}
                                    </p>
                                </div>
                            )}
                            {user?.last_sign_in_at && (
                                <div>
                                    <p className="text-sm font-medium">Last Sign In:</p>
                                    <p className="text-sm text-muted-foreground">
                                        {new Date(user.last_sign_in_at).toLocaleString()}
                                    </p>
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

