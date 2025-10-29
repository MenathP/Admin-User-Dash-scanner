"use client";

import { useAuth } from "@/components/auth-provider";
import { ReactNode } from "react";

interface AuthWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function AuthWrapper({ children, fallback }: AuthWrapperProps) {
  try {
    const { isLoading } = useAuth();
    
    if (isLoading) {
      return fallback || (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold">Loading...</h2>
            <p className="text-muted-foreground">Initializing application</p>
          </div>
        </div>
      );
    }
    
    return <>{children}</>;
  } catch (error) {
    // If useAuth fails, it means we're outside the provider
    return <>{children}</>;
  }
}