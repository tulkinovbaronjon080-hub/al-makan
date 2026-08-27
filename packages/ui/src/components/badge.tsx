import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wide",
  {
    variants: {
      variant: {
        neutral: "bg-muted text-muted-foreground",
        primary: "bg-primary/10 text-primary",
        success: "bg-success/10 text-success",
        warning: "bg-warning/10 text-warning",
        danger: "bg-danger/10 text-danger",
        info: "bg-info/10 text-info",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, className }))} {...props} />;
}

/**
 * Order/production status → badge variant. Central place so every screen
 * (order list, order detail, production board) renders the same status
 * the same way — no per-screen color guessing.
 */
export type OrderStatus =
  | "NEW"
  | "MEASUREMENT"
  | "CALCULATED"
  | "CONFIRMED"
  | "PRODUCTION"
  | "READY"
  | "INSTALLATION"
  | "COMPLETED"
  | "CANCELLED";

const orderStatusVariant: Record<OrderStatus, BadgeProps["variant"]> = {
  NEW: "neutral",
  MEASUREMENT: "info",
  CALCULATED: "info",
  CONFIRMED: "primary",
  PRODUCTION: "warning",
  READY: "success",
  INSTALLATION: "warning",
  COMPLETED: "success",
  CANCELLED: "danger",
};

export function StatusBadge({ status, className }: { status: OrderStatus; className?: string }) {
  return (
    <Badge variant={orderStatusVariant[status]} className={className}>
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
      {status}
    </Badge>
  );
}

export type ProductionStage = "QUEUED" | "CUTTING" | "ASSEMBLY" | "GLAZING" | "QUALITY_CHECK" | "DONE";

const productionStageVariant: Record<ProductionStage, BadgeProps["variant"]> = {
  QUEUED: "neutral",
  CUTTING: "info",
  ASSEMBLY: "info",
  GLAZING: "warning",
  QUALITY_CHECK: "warning",
  DONE: "success",
};

export function ProductionStageBadge({ stage, className }: { stage: ProductionStage; className?: string }) {
  return (
    <Badge variant={productionStageVariant[stage]} className={className}>
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
      {stage.replace("_", " ")}
    </Badge>
  );
}
