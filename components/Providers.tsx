"use client";

import { QueryClient, QueryClientProvider as TanstackProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

/**
 * QueryClientProvider wrapper.
 *
 * Creates a new QueryClient per request to avoid stale data
 * leaking between different users in SSR.
 */
export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // SSR apps should refetch on mount to get fresh data
            staleTime: 60 * 1000,
            refetchOnWindowFocus: true,
            retry: 1,
          },
        },
      })
  );

  return (
    <TanstackProvider client={queryClient}>
      {children}
    </TanstackProvider>
  );
}
