"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { BottomNav } from "./bottom-nav";
import { useAuth } from "@/lib/auth/auth-context";

const AUTH_PATHS = new Set(["/login", "/register"]);

/**
 * Mobile: bottom nav only, no sidebar (per brief §6).
 * Desktop: sidebar + topbar + content.
 *
 * /login and /register render standalone (no nav chrome, no auth check —
 * that's the whole point). Every other route requires a session; this is
 * UX routing only, the real security boundary is the API's guards.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const isAuthPage = AUTH_PATHS.has(pathname);

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !isAuthPage) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, isAuthPage, router]);

  if (isAuthPage) {
    return <>{children}</>;
  }

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-sm text-muted-foreground">Loading…</div>
    );
  }

  return (
    <div className="flex min-h-dvh">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 pb-24 md:pb-0">{children}</main>
      </div>
      <BottomNav />
    </div>
  );
}
