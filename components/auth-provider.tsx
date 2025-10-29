"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from "react";

type User = {
  id: string;
  username: string;
  role: 'user' | 'admin';
  code: string;
} | null;

type AuthContextType = {
  user: User;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isUser: boolean;
  token: string | null;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7001/api';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('auth_token');
      const storedUser = localStorage.getItem('auth_user');
      
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const data = await response.json();
        const userData = {
          id: data.user.id,
          username: data.user.username,
          role: data.user.role,
          code: data.user.code,
        };
        
        setUser(userData);
        setToken(data.token);
        
        // Store in localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth_token', data.token);
          localStorage.setItem('auth_user', JSON.stringify(userData));
        }
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };



  const logout = () => {
    setUser(null);
    setToken(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
    }
  };

  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'admin';
  const isUser = user?.role === 'user';

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      isAuthenticated, 
      isAdmin, 
      isUser, 
      token,
      isLoading
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  
  // Return a safe default if context is undefined (during SSR or before mounting)
  if (context === undefined) {
    return {
      user: null,
      login: async () => false,
      logout: () => {},
      isAuthenticated: false,
      isAdmin: false,
      isUser: false,
      token: null,
      isLoading: true
    };
  }
  
  return context;
}

// Hook that requires auth context to be available (for protected components)
export function useRequiredAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useRequiredAuth must be used within an AuthProvider");
  }
  return context;
}