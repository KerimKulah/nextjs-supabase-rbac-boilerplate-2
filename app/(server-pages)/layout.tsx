import { Suspense } from "react";

export default function ServerPagesLayout({ children }: { children: React.ReactNode }) {

    return (
        <Suspense fallback={<div className="flex min-h-screen items-center justify-center">
            <div className="text-sm text-muted-foreground">Loading...</div>
        </div>}>
            {children}
        </Suspense>
    );
}
