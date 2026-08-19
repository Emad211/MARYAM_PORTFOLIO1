'use client';

import React, {
    createContext,
    useContext,
    useEffect,
    useState,
    ReactNode,
    useMemo,
} from 'react';
import type { ContactContent } from '@/lib/types';
import { createClient } from '@/lib/supabase/browser';

interface AuthUser {
    email: string;
    name: string;
}

interface AuthContextType {
    user: AuthUser | null;
    loading: boolean;
    contactContent: ContactContent | null;
    login: (email: string, password: string) => Promise<boolean>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    contactContent: null,
    login: async () => false,
    logout: () => {},
});

interface AuthProviderProps {
    children: ReactNode;
    initialContactContent: ContactContent | null;
}

/** True only for a Supabase session whose server-controlled role is `admin`. */
function isAdminSession(
    appMetadata: Record<string, unknown> | undefined
): boolean {
    return (appMetadata as { role?: string } | undefined)?.role === 'admin';
}

export const AuthProvider = ({ children, initialContactContent }: AuthProviderProps) => {
    const supabase = useMemo(() => createClient(), []);
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;

        // Establish the initial state, then subscribe to changes. We only treat
        // a session as "logged in" for UI purposes if it carries the admin role
        // in app_metadata (server-controlled — never user_metadata).
        supabase.auth.getUser().then(({ data }) => {
            if (!active) return;
            const u = data.user;
            if (u && isAdminSession(u.app_metadata)) {
                setUser({ email: u.email ?? 'admin', name: 'Admin' });
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
            const u = session?.user;
            if (u && isAdminSession(u.app_metadata)) {
                setUser({ email: u.email ?? 'admin', name: 'Admin' });
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => {
            active = false;
            sub.subscription.unsubscribe();
        };
    }, [supabase]);

    const login = async (email: string, password: string): Promise<boolean> => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error || !data.user) {
            return false;
        }
        // Reject non-admin accounts: sign them straight back out so no partial
        // session lingers. Authorization is enforced again server-side (RLS +
        // middleware); this is the client-side gate for the admin UI.
        if (!isAdminSession(data.user.app_metadata)) {
            await supabase.auth.signOut();
            return false;
        }
        setUser({ email: data.user.email ?? email, name: 'Admin' });
        return true;
    };

    const logout = () => {
        setUser(null);
        void supabase.auth.signOut();
    };

    return (
        <AuthContext.Provider
            value={{ user, loading, contactContent: initialContactContent, login, logout }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
