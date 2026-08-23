"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AuthResponse, LoginDto, MeResponse, RegisterDto } from "@al-makan/types";
import { api, setAccessToken } from "../api/client";

interface AuthContextValue {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: MeResponse["user"] | null;
  business: MeResponse["business"] | null;
  role: MeResponse["role"] | null;
  permissions: string[];
  login: (dto: LoginDto) => Promise<void>;
  register: (dto: RegisterDto) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const ME_QUERY_KEY = ["auth", "me"] as const;

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [bootstrapped, setBootstrapped] = useState(false);

  const meQuery = useQuery({
    queryKey: ME_QUERY_KEY,
    queryFn: () => api.get<MeResponse>("/auth/me"),
    retry: false,
  });

  useEffect(() => {
    if (!meQuery.isLoading) {
      setBootstrapped(true);
    }
  }, [meQuery.isLoading]);

  function applySession(session: AuthResponse) {
    setAccessToken(session.accessToken);
    queryClient.setQueryData<MeResponse>(ME_QUERY_KEY, {
      user: session.user,
      business: session.business,
      role: session.role,
      permissions: session.permissions,
    });
  }

  const loginMutation = useMutation({
    mutationFn: (dto: LoginDto) => api.post<AuthResponse>("/auth/login", dto),
    onSuccess: applySession,
  });

  const registerMutation = useMutation({
    mutationFn: (dto: RegisterDto) => api.post<AuthResponse>("/auth/register", dto),
    onSuccess: applySession,
  });

  async function logout() {
    await api.post("/auth/logout").catch(() => {});
    setAccessToken(null);
    queryClient.setQueryData(ME_QUERY_KEY, null);
  }

  const value: AuthContextValue = {
    isLoading: !bootstrapped,
    isAuthenticated: Boolean(meQuery.data),
    user: meQuery.data?.user ?? null,
    business: meQuery.data?.business ?? null,
    role: meQuery.data?.role ?? null,
    permissions: meQuery.data?.permissions ?? [],
    login: async (dto) => {
      await loginMutation.mutateAsync(dto);
    },
    register: async (dto) => {
      await registerMutation.mutateAsync(dto);
    },
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
