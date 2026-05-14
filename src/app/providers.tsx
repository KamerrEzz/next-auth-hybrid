"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ComponentType, ReactNode, useEffect, useState } from "react";
import { Toaster } from "sonner";

export default function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            gcTime: 5 * 60 * 1000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );

  const [DevTools, setDevTools] = useState<ComponentType<{ initialIsOpen: boolean }> | null>(null);

  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      import("@tanstack/react-query-devtools").then((m) => {
        setDevTools(() => m.ReactQueryDevtools);
      });
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster position="top-right" richColors />
      {DevTools && <DevTools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}
