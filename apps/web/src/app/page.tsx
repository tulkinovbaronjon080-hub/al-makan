"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Bell, CheckCircle2, ClipboardList, Timer, TrendingUp } from "lucide-react";
import type { OrderDto } from "@al-makan/types";
import { Card, EmptyState, StatusBadge, cn } from "@al-makan/ui";
import { getDictionary } from "@/lib/i18n/dictionary";
import { api } from "@/lib/api/client";
import type { Paginated } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/auth-context";

const dict = getDictionary();

export default function HomePage() {
  const { business, user } = useAuth();
  const { data } = useQuery({
    queryKey: ["orders", "dashboard-recent"],
    queryFn: () => api.get<Paginated<OrderDto>>("/orders?page=1&pageSize=5"),
  });

  const today = new Date().toLocaleDateString(undefined, { day: "numeric", month: "long" });
  const initials = user?.fullName ? getInitials(user.fullName) : "";

  // Production/Ready/Sales stay "—" until Phases 6/8 exist to back them —
  // no fabricated numbers on the dashboard.
  const stats = [
    { key: "orders" as const, value: data ? String(data.total) : "—", icon: ClipboardList, accent: true },
    { key: "production" as const, value: "—", icon: Timer, accent: false },
    { key: "ready" as const, value: "—", icon: CheckCircle2, accent: false },
    { key: "sales" as const, value: "—", icon: TrendingUp, accent: false },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground">
            {dict.dashboard.title} &middot; {today}
          </p>
          <h1 className="text-[19px] font-bold tracking-tight">{business?.name}</h1>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            aria-label="Notifications"
            className="relative flex h-[38px] w-[38px] items-center justify-center rounded-lg border border-border/70 bg-surface"
          >
            <Bell className="h-[18px] w-[18px]" strokeWidth={1.75} />
            <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full border-[1.5px] border-surface bg-danger" />
          </button>
          <div className="flex h-[38px] w-[38px] items-center justify-center rounded-lg bg-primary text-[13px] font-bold text-primary-foreground">
            {initials}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.key}
              className={cn("border-0 p-4", stat.accent ? "bg-primary shadow-[0_4px_14px_-4px_hsl(var(--primary)/0.45)]" : "border border-border/70")}
            >
              <div
                className={cn(
                  "mb-2 flex items-center gap-1.5 text-[11.5px] font-semibold",
                  stat.accent ? "text-primary-foreground/75" : "text-muted-foreground",
                )}
              >
                <Icon className="h-[13px] w-[13px]" strokeWidth={1.75} />
                {dict.dashboard[stat.key]}
              </div>
              <p className={cn("font-mono text-[25px] font-bold tracking-tight", stat.accent && "text-primary-foreground")}>
                {stat.value}
              </p>
            </Card>
          );
        })}
      </div>

      {data && data.items.length > 0 ? (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h2 className="text-[13.5px] font-bold">Recent orders</h2>
            <Link href="/orders" className="text-[12.5px] font-semibold text-primary">
              View all
            </Link>
          </div>
          <div className="space-y-2">
            {data.items.map((order) => (
              <Link key={order.id} href={`/orders/${order.id}`}>
                <Card className="flex items-center gap-3 border border-border/70 p-3.5 transition-colors hover:bg-muted/50">
                  <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-lg bg-muted font-mono text-xs font-bold text-surface-foreground/80">
                    #{order.orderNumber}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-semibold">{order.customer.fullName}</p>
                    <p className="text-[11.5px] text-muted-foreground">{order.customer.phone}</p>
                  </div>
                  <StatusBadge status={order.status} />
                </Card>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <EmptyState title="No orders yet" description="Tap the + button below to create your first order." />
      )}
    </div>
  );
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}
