"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/context/auth-context";

export function LogoutButton() {
  const { logout, loading } = useAuth();

  return (
    <Button onClick={logout} disabled={loading}>
      {loading ? "Logging out..." : "Logout"}
    </Button>
  );
}
