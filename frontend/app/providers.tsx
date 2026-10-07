"use client";

import { CircleAlert } from "lucide-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { Toaster } from "sonner";
import { WishlistProvider } from "@/hooks/useWishlist";
import { AuthProvider } from "@/lib/auth";

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, retry: 1 },
        },
      }),
  );

  return (
    <QueryClientProvider client={client}>
      <AuthProvider>
        <WishlistProvider>
          {children}
          <Toaster
          position="bottom-left"
          offset={24}
          theme="light"
          icons={{
            success: null,
            info: null,
            warning: null,
            error: <CircleAlert size={16} className="text-rausch" aria-hidden />,
          }}
          toastOptions={{
            classNames: {
              toast: "t-toast",
              title: "t-toast",
              actionButton: "t-toast-action",
            },
            style: {
              background: "#ffffff",
              color: "#222222",
              border: "none",
              borderRadius: 16,
              boxShadow: "0 6px 20px rgba(0,0,0,.18)",
              padding: 16,
              fontSize: 14,
              lineHeight: "18px",
              fontWeight: 400,
              maxWidth: 380,
            },
          }}
          />
        </WishlistProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
