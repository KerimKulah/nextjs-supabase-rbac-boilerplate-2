"use client";

import { useAuth } from "@/lib/context/auth-context";
import { LogoutButton } from "@/components/logout-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

/* 
This is projects root page. 
*/

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
    <main className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <p className="text-sm text-muted-foreground">
          PROTECTED ROOT PAGE - SUCCESSFULLY LOGGED IN
        </p>

        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>User Information</CardTitle>
            <CardDescription>Currently authenticated user details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {user && (
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium">Email:</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">User ID:</p>
                  <p className="text-sm text-muted-foreground font-mono text-xs break-all">{user.id}</p>
                </div>
                
                {/* Role Bilgisi */}
                <div>
                  <p className="text-sm font-medium mb-2">Role:</p>
                  <Badge variant={getRoleBadgeVariant(user.metadata.role)}>
                    {user.metadata.role}
                  </Badge>
                </div>

                {/* Permissions Bilgisi */}
                {user.metadata.permissions && user.metadata.permissions.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Permissions:</p>
                    <div className="flex flex-wrap gap-2">
                      {user.metadata.permissions.map((permission) => (
                        <Badge key={permission} variant="outline">
                          {permission}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {user.created_at && (
                  <div>
                    <p className="text-sm font-medium">Account Created:</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(user.created_at).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            )}
            <div className="pt-4">
              <LogoutButton />
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
