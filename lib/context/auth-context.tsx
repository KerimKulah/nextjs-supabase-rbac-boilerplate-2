"use client";

import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, usePathname } from "next/navigation";
import { enrichUserWithRBAC, type UserWithRBAC } from "@/lib/rbac/helpers";

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

    const [user, setUser] = useState<UserWithRBAC | null>(null);
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
                    setUser(enrichUserWithRBAC(data.user));
                }
            } catch (err) {
                setError(err instanceof Error ? err : new Error("Failed to initialize auth"));
                setUser(null);
            } finally {
                setIsInitialized(true);
                isInitialMount.current = false;
            }
        };

        initializeAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                setError(null);

                if (session?.user) setUser(enrichUserWithRBAC(session.user));
                else setUser(null);

                if (isInitialMount.current) return;

                if (event === 'SIGNED_IN') {
                    if (pathname?.startsWith('/login') || pathname?.startsWith('/sign-up')) {
                        router.push('/');
                    }
                }

                if (event === 'SIGNED_OUT') router.push('/login');

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