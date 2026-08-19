'use client';

import React, {
    createContext,
    useContext,
    useEffect,
    useState,
    ReactNode,
    useMemo,
} from 'react';
import type { User } from '@supabase/supabase-js';
import type { ContactContent, UserRole } from '@/lib/types';
import { createClient } from '@/lib/supabase/browser';

interface AuthUser {
    id: string;
    email: string;
    name: string;
    role: UserRole;
}

/** Result of a login attempt. `role` is present only on success and lets the
 *  caller route by role (admin → /admin, student → /dashboard). */
interface LoginResult {
    ok: boolean;
    role?: UserRole;
}

interface AuthContextType {
    user: AuthUser | null;
    loading: boolean;
    contactContent: ContactContent | null;
    login: (email: string, password: string) => Promise<LoginResult>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    contactContent: null,
    login: async () => ({ ok: false }),
    logout: () => {},
});

interface AuthProviderProps {
    children: ReactNode;
    initialContactContent: ContactContent | null;
}

/**
 * Reads the server-controlled role from `app_metadata` (never `user_metadata`,
 * which is user-editable and unsafe). Returns null for a session with no
 * recognized role — such a session is treated as logged-out by the UI.
 */
function roleOf(appMetadata: User['app_metadata'] | undefined): UserRole | null {
    const role = (appMetadata as { role?: string } | undefined)?.role;
    return role === 'admin' || role === 'student' ? role : null;
}

/** Projects a Supabase user into our UI shape, or null if it has no known role. */
function toAuthUser(u: User): AuthUser | null {
    const role = roleOf(u.app_metadata);
    if (!role) return null;
    return {
        id: u.id,
        email: u.email ?? '',
        name: role === 'admin' ? 'Admin' : u.email ?? 'Student',
        role,
    };
}

export const AuthProvider = ({ children, initialContactContent }: AuthProviderProps) => {
    const supabase = useMemo(() => createClient(), []);
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;

        // Establish the initial state, then subscribe to changes. A session is
        // "logged in" for the UI only if it carries a recognized role in
        // app_metadata (server-controlled — never user_metadata).
        supabase.auth.getUser().then(({ data }) => {
            if (!active) return;
            setUser(data.user ? toAuthUser(data.user) : null);
            setLoading(false);
        });

        const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ? toAuthUser(session.user) : null);
            setLoading(false);
        });

        return () => {
            active = false;
            sub.subscription.unsubscribe();
        };
    }, [supabase]);

    const login = async (email: string, password: string): Promise<LoginResult> => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error || !data.user) {
            return { ok: false };
        }
        // Reject a session with no recognized role: sign it straight back out so
        // no partial session lingers. Authorization is enforced again
        // server-side (RLS + proxy); this is the client-side gate.
        const authUser = toAuthUser(data.user);
        if (!authUser) {
            await supabase.auth.signOut();
            return { ok: false };
        }
        setUser(authUser);
        return { ok: true, role: authUser.role };
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
