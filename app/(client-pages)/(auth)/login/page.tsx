import { LoginForm } from "@/components/login-form";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function Page() {

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm space-y-4">
        <Button asChild variant="ghost" className="w-full">
          <Link href="/">← Ana Sayfaya Dön</Link>
        </Button>
        <LoginForm />
      </div>
    </div>
  );
}
