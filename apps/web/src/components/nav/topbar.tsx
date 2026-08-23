"use client";

import { Bell, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";

/** Desktop-only top bar: business switcher / search / notifications / user menu placeholders. */
export function Topbar() {
  const { business, user, logout } = useAuth();

  return (
    <header className="hidden h-16 items-center justify-between border-b border-border bg-surface px-6 md:flex">
      <span className="text-sm font-medium text-muted-foreground">{business?.name ?? "Al-Makan"}</span>
      <div className="flex items-center gap-3">
        <button
          aria-label="Notifications"
          className="flex h-9 w-9 items-center justify-center rounded-md hover:bg-muted"
        >
          <Bell className="h-4 w-4" />
        </button>
        <span className="text-sm text-muted-foreground">{user?.fullName}</span>
        <button
          aria-label="Log out"
          onClick={() => void logout()}
          className="flex h-9 w-9 items-center justify-center rounded-md hover:bg-muted"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
