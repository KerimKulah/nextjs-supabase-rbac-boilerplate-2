"use client";

import {
    createContext,
    useContext,
    useEffect,
    useState,
    useCallback,
    useRef,
} from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, usePathname } from "next/navigation";
import { getUserDetails } from "@/lib/rbac/helpers.client";
import type { User } from "@supabase/supabase-js";
import type { UserWithRBAC } from "@/lib/rbac/shared";

interface AuthContextType {
    user: UserWithRBAC | null;
    error: Error | null;
    loading: boolean;
    isInitialized: boolean;
    clearError: () => void;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    signup: (email: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const supabase = createClient();

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();

    const pathnameRef = useRef(pathname);
    const requestIdRef = useRef(0);
    const isInitialMount = useRef(true);

    const [user, setUser] = useState<UserWithRBAC | null>(null);
    const [error, setError] = useState<Error | null>(null);
    const [loading, setLoading] = useState(true);
    const [isInitialized, setIsInitialized] = useState(false);

    // pathname'i güncel tut
    useEffect(() => {
        pathnameRef.current = pathname;
    }, [pathname]);

    /**
     * Merkezi ve race-safe user yükleyici
     */
    const fetchAndSetUser = useCallback(
        async (authUser: User | null) => {
            const requestId = ++requestIdRef.current;

            if (!authUser) {
                setUser(null);
                return;
            }

            const details = await getUserDetails(authUser.id, supabase);

            // Eğer bu istek artık güncel değilse ignore et
            if (requestId !== requestIdRef.current) return;

            if (!details) {
                // Güvenlik: default role atama YOK
                await supabase.auth.signOut();
                setUser(null);
                setError(new Error("User details not found"));
                return;
            }

            const { id, ...detailsWithoutId } = details;
            setUser({ ...authUser, ...detailsWithoutId });
        },
        []
    );

    /**
     * Initial auth load + auth listener
     */
    useEffect(() => {
        let mounted = true;

        const initializeAuth = async () => {
            try {
                setError(null);
                const { data, error: authError } = await supabase.auth.getUser();

                if (!mounted) return;

                if (authError) {
                    setUser(null);
                    setError(authError);
                } else {
                    await fetchAndSetUser(data.user ?? null);
                }
            } catch (err) {
                if (!mounted) return;
                setUser(null);
                setError(err instanceof Error ? err : new Error("Auth init failed"));
            } finally {
                if (mounted) {
                    setIsInitialized(true);
                    setLoading(false);
                    isInitialMount.current = false;
                }
            }
        };

        initializeAuth();

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (!mounted) return;

            setError(null);
            await fetchAndSetUser(session?.user ?? null);

            if (isInitialMount.current) return;

            if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
                const currentPath = pathnameRef.current;
                if (
                    currentPath?.startsWith("/login") ||
                    currentPath?.startsWith("/sign-up")
                ) {
                    router.replace("/");
                }
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, [fetchAndSetUser, router]);

    /**
     * Actions
     */
    const clearError = useCallback(() => {
        setError(null);
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        setLoading(true);
        setError(null);
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error) throw error;
        } catch (err) {
            const e = err instanceof Error ? err : new Error("Login failed");
            setError(e);
            throw e;
        } finally {
            setLoading(false);
        }
    }, []);

    const logout = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            router.replace("/login");
        } catch (err) {
            const e = err instanceof Error ? err : new Error("Logout failed");
            setError(e);
            throw e;
        } finally {
            setLoading(false);
        }
    }, [router]);

    const signup = useCallback(async (email: string, password: string) => {
        setLoading(true);
        setError(null);
        try {
            const { error } = await supabase.auth.signUp({
                email,
                password,
            });
            if (error) throw error;
        } catch (err) {
            const e = err instanceof Error ? err : new Error("Signup failed");
            setError(e);
            throw e;
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
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error("useAuth must be used within AuthProvider");
    }
    return ctx;
}
