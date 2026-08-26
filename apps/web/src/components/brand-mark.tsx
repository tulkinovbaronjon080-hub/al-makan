import { cn } from "@al-makan/ui";

/** The window-cross mark used on Login and the desktop sidebar. */
export function BrandMark({ className, iconClassName }: { className?: string; iconClassName?: string }) {
  return (
    <div className={cn("flex items-center justify-center rounded-xl bg-primary", className)}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className={cn("text-primary-foreground", iconClassName)}>
        <rect x="3.5" y="3.5" width="17" height="17" rx="2" />
        <path d="M12 3.5v17M3.5 12h17" />
      </svg>
    </div>
  );
}
