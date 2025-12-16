"use client";

import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { useRouter, usePathname } from "next/navigation";

interface AuthContextType {
    user: User | null;
    error: Error | null;
    loading: boolean;
    isInitialized: boolean;
    clearError: () => void;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    signup: (email: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Client'ı component dışında oluştur - her render'da yeni client oluşturulmasın
const supabase = createClient();

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const isInitialMount = useRef(true);

    const [user, setUser] = useState<User | null>(null);
    const [error, setError] = useState<Error | null>(null);
    const [loading, setLoading] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        const initializeAuth = async () => {
            try {
                setError(null);
                const { data, error: authError } = await supabase.auth.getUser();

                if (authError) {
                    setError(authError);
                    setUser(null);
                } else {
                    setUser(data.user);
                }
            } catch (err) {
                setError(err instanceof Error ? err : new Error("Failed to initialize auth"));
                setUser(null);
            } finally {
                setIsInitialized(true);
                isInitialMount.current = false; // İlk mount tamamlandı
            }
        };

        initializeAuth();

        // Redirect'leri auth event'lerine bağla - router.push ile yarışmayı önle
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (event, session) => {
                setError(null);
                setUser(session?.user ?? null);

                // İlk mount'ta redirect yapma, sadece gerçek auth event'lerinde
                if (isInitialMount.current) {
                    return;
                }

                // Auth event'lerine göre redirect yap - sadece gerekli sayfalarda
                if (event === 'SIGNED_IN') {
                    // Sadece auth sayfalarındaysa redirect yap
                    if (pathname?.startsWith('/login') || pathname?.startsWith('/sign-up')) {
                        router.push('/');
                    }
                }

                if (event === 'SIGNED_OUT') {
                    router.push('/login');
                }
            }
        );

        return () => {
            subscription.unsubscribe();
        };
    }, [router, pathname]);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        setLoading(true);
        setError(null);
        try {
            const { error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (authError) {
                throw authError;
            }
            // Redirect onAuthStateChange'de yapılacak
        } catch (err) {
            const error = err instanceof Error ? err : new Error("Login failed");
            setError(error);
            throw error;
        } finally {
            setLoading(false);
        }
    }, []);

    const logout = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const { error: authError } = await supabase.auth.signOut();
            if (authError) {
                throw authError;
            }
            // Redirect onAuthStateChange'de yapılacak
        } catch (err) {
            const error = err instanceof Error ? err : new Error("Logout failed");
            setError(error);
            throw error;
        } finally {
            setLoading(false);
        }
    }, []);

    const signup = useCallback(async (email: string, password: string) => {
        setLoading(true);
        setError(null);
        try {
            const { error: authError } = await supabase.auth.signUp({
                email,
                password,
            });
            if (authError) {
                throw authError;
            }
            // Redirect onAuthStateChange'de yapılacak
        } catch (err) {
            const error = err instanceof Error ? err : new Error("Signup failed");
            setError(error);
            throw error;
        } finally {
            setLoading(false);
        }
    }, []);

    return (
        <AuthContext.Provider
            value={{
                user,
                error,
                loading,
                isInitialized,
                clearError,
                login,
                logout,
                signup,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within a AuthProvider");
    }
    return context;
}