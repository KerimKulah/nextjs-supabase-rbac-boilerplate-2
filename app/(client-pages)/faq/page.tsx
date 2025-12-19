'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function FAQPage() {
    return (
        <main className="min-h-screen flex items-center justify-center p-4">
            <div className="flex flex-col items-center gap-4 max-w-2xl w-full">
                <Button asChild variant="ghost" className="self-start">
                    <Link href="/">← Ana Sayfaya Dön</Link>
                </Button>
                <div className="text-center space-y-2">
                    <h1 className="text-4xl font-bold">FAQ</h1>
                    <p className="text-sm text-muted-foreground">
                        This is client side FAQ page.
                    </p>
                </div>
            </div>
        </main>
    );
}