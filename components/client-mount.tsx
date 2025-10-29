"use client";

import { useEffect, useState } from "react";

interface ClientMountProps {
  children: React.ReactNode;
}

export function ClientMount({ children }: ClientMountProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold">Loading...</h2>
          <p className="text-muted-foreground">Initializing application</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}