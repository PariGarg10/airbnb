"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { ApiError, USER_ID_STORAGE_KEY, usersApi } from "@/lib/api";
import type { User } from "@/types";

interface AuthContextValue {
  user: User | null;
  isHost: boolean;
  isLoading: boolean;
  switchUser: (id: number) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const users = await usersApi.list();
        if (cancelled) return;
        const stored = window.localStorage.getItem(USER_ID_STORAGE_KEY);
        const storedId = stored ? Number(stored) : Number.NaN;
        const remembered = users.find((account) => account.id === storedId);
        const guest = users.find((account) => !account.is_host);
        const next = remembered ?? guest ?? null;
        if (next) {
          window.localStorage.setItem(USER_ID_STORAGE_KEY, String(next.id));
          setUser(next);
        }
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const switchUser = useCallback(async (id: number) => {
    const users = await usersApi.list();
    const next = users.find((account) => account.id === id);
    if (!next) throw new ApiError(404, "User not found");
    window.localStorage.setItem(USER_ID_STORAGE_KEY, String(next.id));
    setUser(next);
  }, []);

  const logout = useCallback(() => {
    window.localStorage.removeItem(USER_ID_STORAGE_KEY);
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isHost: user?.is_host ?? false,
      isLoading,
      switchUser,
      logout,
    }),
    [user, isLoading, switchUser, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used within AuthProvider");
  return value;
}
