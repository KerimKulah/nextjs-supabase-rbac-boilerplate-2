"use client";

import { useAuth } from "@/lib/context/auth-context";
import { LogoutButton } from "@/components/logout-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/* 
This is projects root page. 
*/

export default function RootPage() {
  const { user } = useAuth();

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
              <div className="space-y-2">
                <div>
                  <p className="text-sm font-medium">Email:</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">User ID:</p>
                  <p className="text-sm text-muted-foreground font-mono text-xs break-all">{user.id}</p>
                </div>
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
