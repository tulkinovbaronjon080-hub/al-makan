import * as React from "react";
import { cn } from "../lib/utils";

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export function EmptyState({ title, description, icon, action, className, ...props }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-xl border-[1.5px] border-dashed border-border/80 bg-muted/30 p-10 text-center",
        className,
      )}
      {...props}
    >
      {icon}
      <p className="text-[13.5px] font-bold text-surface-foreground">{title}</p>
      {description ? <p className="max-w-[240px] text-[12.5px] text-muted-foreground">{description}</p> : null}
      {action}
    </div>
  );
}
