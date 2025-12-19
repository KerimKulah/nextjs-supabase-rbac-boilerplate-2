"use client";

import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, usePathname } from "next/navigation";
import { getUserDetails } from "@/lib/rbac/helpers.client";
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
    const isInitialMount = useRef(true);
    const pathnameRef = useRef(pathname);

    // Pathname'i ref'te tut ki closure'da güncel değeri kullanalım
    useEffect(() => {
        pathnameRef.current = pathname;
    }, [pathname]);

    const [user, setUser] = useState<UserWithRBAC | null>(null);
    const [error, setError] = useState<Error | null>(null);
    const [loading, setLoading] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        let mounted = true;

        const initializeAuth = async () => {
            try {
                setError(null);
                const { data, error: authError } = await supabase.auth.getUser();

                if (!mounted) return;

                if (authError) {
                    setError(authError);
                    setUser(null);
                } else if (data.user) {
                    const userDetails = await getUserDetails(data.user.id, supabase);

                    if (!mounted) return;

                    if (userDetails) {
                        const { id, ...detailsWithoutId } = userDetails;
                        setUser({ ...data.user, ...detailsWithoutId });
                    } else {
                        const defaultDetails = {
                            role: 'user' as const,
                            permissions: [],
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString(),
                        };
                        setUser({ ...data.user, ...defaultDetails });
                        console.warn('User details not found, using default values for user:', data.user.id);
                    }
                } else {
                    setUser(null);
                }
            } catch (err) {
                if (!mounted) return;
                setError(err instanceof Error ? err : new Error("Failed to initialize auth"));
                setUser(null);
            } finally {
                if (mounted) {
                    setIsInitialized(true);
                    isInitialMount.current = false;
                }
            }
        };

        initializeAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (!mounted) return;

                setError(null);

                if (session?.user) {
                    const userDetails = await getUserDetails(session.user.id, supabase);
                    if (!mounted) return;

                    if (userDetails) {
                        const { id, ...detailsWithoutId } = userDetails;
                        setUser({ ...session.user, ...detailsWithoutId });
                    } else {
                        const defaultDetails = {
                            role: 'user' as const,
                            permissions: [],
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString(),
                        };
                        setUser({ ...session.user, ...defaultDetails });
                        console.warn('User details not found, using default values for user:', session.user.id);
                    }
                } else {
                    setUser(null);
                }

                if (isInitialMount.current) return;

                if (event === 'SIGNED_IN') {
                    const currentPathname = pathnameRef.current;
                    if (currentPathname?.startsWith('/login') || currentPathname?.startsWith('/sign-up')) {
                        router.replace('/');
                    }
                }

                // SIGNED_OUT için redirect yapma - logout fonksiyonu zaten yapıyor
            }
        );

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []); // Sadece mount'ta çalış - pathname değişiminde yeniden çalışma

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
            // State'i manuel güncelle - onAuthStateChange'e beklemeden
            setUser(null);
            // Loading'i hemen false yap - redirect'ten önce
            setLoading(false);
            // Redirect'i manuel yap - onAuthStateChange'e beklemeden
            router.replace('/login');
        } catch (err) {
            const error = err instanceof Error ? err : new Error("Logout failed");
            setError(error);
            setLoading(false);
            throw error;
        }
    }, [router]);

    const signup = useCallback(async (email: string, password: string) => {
        setLoading(true);
        setError(null);
        try {
            console.log('Attempting signup for:', email);
            const { data, error: authError } = await supabase.auth.signUp({
                email,
                password,
            });

            console.log('Signup response:', {
                user: data?.user?.id,
                session: data?.session ? 'present' : 'missing',
                error: authError?.message
            });

            if (authError) {
                console.error('Signup error:', authError);
                throw authError;
            }

            console.log('Signup successful, user created:', data?.user?.id);
            // Redirect onAuthStateChange'de yapılacak
        } catch (err) {
            const error = err instanceof Error ? err : new Error("Signup failed");
            console.error('Signup catch error:', error);
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