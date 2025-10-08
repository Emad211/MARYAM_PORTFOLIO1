
'use client';

import React, {createContext, useContext, useEffect, useState, ReactNode} from 'react';
import {deleteCookie, getCookie, setCookie} from 'cookies-next';
import type { AdminUser, ContactContent } from '@/lib/types';
import { getAdminUser } from '@/app/actions/auth-actions';

interface MockUser {
    email: string;
    name: string;
}

interface AuthContextType {
  user: MockUser | null;
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
    initialAdminUser: AdminUser | null;
    initialContactContent: ContactContent | null;
    isAuthenticated: boolean;
}

export const AuthProvider = ({children, initialAdminUser, initialContactContent, isAuthenticated}: AuthProviderProps) => {
  const [user, setUser] = useState<MockUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(initialAdminUser);

  useEffect(() => {
    // The authentication state is now passed from the server layout.
    // We just need to sync it into the state.
    if (isAuthenticated) {
      // We can get the email from the cookie if needed, or just use a placeholder
      const userEmail = getCookie('auth-token') as string || 'admin';
      setUser({ email: userEmail, name: 'Admin' });
    } else {
      setUser(null);
    }
    setLoading(false);
  }, [isAuthenticated]);

  const login = async (email: string, password: string): Promise<boolean> => {
    // If adminUser is not loaded yet for some reason, fetch it.
    const currentUser = adminUser || await getAdminUser();
    
    if (!currentUser) return false;

    if (email === currentUser.email && password === currentUser.password) {
        const mockUser: MockUser = { email, name: 'Admin' };
        setUser(mockUser);
        setCookie('auth-token', email, { maxAge: 60 * 60 * 24 }); // Cookie expires in 1 day
        return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    deleteCookie('auth-token');
  };

  return (
    <AuthContext.Provider value={{user, loading, contactContent: initialContactContent, login, logout}}>
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
