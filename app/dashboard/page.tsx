"use client";

import { useAuth } from "@/components/auth-provider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardPage() {
  const { isAuthenticated, isAdmin, isUser, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Don't redirect while still loading
    if (isLoading) return;
    
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    // Redirect based on role
    if (isAdmin) {
      router.push("/dashboard/admin");
    } else if (isUser) {
      router.push("/dashboard/user");
    }
  }, [isAuthenticated, isAdmin, isUser, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold">Loading...</h2>
          <p className="text-muted-foreground">Checking authentication</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-xl font-semibold">Redirecting to dashboard...</h2>
      </div>
    </div>
  );
}
