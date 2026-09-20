import { QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { AuthProvider } from "@/features/auth/AuthProvider";
import { createQueryClient } from "@/lib/queryClient";

/** App-wide providers (the router sits inside these, so route guards can read auth state). */
export function AppProviders({ children }: { children: ReactNode }) {
  // One QueryClient per app instance, created once.
  const [queryClient] = useState(createQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  );
}
