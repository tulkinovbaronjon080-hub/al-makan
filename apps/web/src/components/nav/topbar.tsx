import { Bell } from "lucide-react";

/** Desktop-only top bar: business switcher / search / notifications / user menu placeholders. */
export function Topbar() {
  return (
    <header className="hidden h-16 items-center justify-between border-b border-border bg-surface px-6 md:flex">
      <span className="text-sm font-medium text-muted-foreground">Al-Makan</span>
      <button
        aria-label="Notifications"
        className="flex h-9 w-9 items-center justify-center rounded-md hover:bg-muted"
      >
        <Bell className="h-4 w-4" />
      </button>
    </header>
  );
}
