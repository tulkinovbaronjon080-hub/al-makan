"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Search, Users } from "lucide-react";
import type { OrderDto, OrderStatus } from "@al-makan/types";
import { orderStatusSchema } from "@al-makan/types";
import { Card, EmptyState, Input, StatusBadge, buttonVariants, cn } from "@al-makan/ui";
import { api } from "@/lib/api/client";
import type { Paginated } from "@/lib/api/types";

const STATUS_FILTERS: Array<OrderStatus | "ALL"> = ["ALL", ...orderStatusSchema.options];

export default function OrdersPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<OrderStatus | "ALL">("ALL");

  const { data, isLoading } = useQuery({
    queryKey: ["orders", search, status],
    queryFn: () => {
      const params = new URLSearchParams({ page: "1", pageSize: "20" });
      if (search) params.set("search", search);
      if (status !== "ALL") params.set("status", status);
      return api.get<Paginated<OrderDto>>(`/orders?${params.toString()}`);
    },
  });

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-[20px] font-bold tracking-tight">Orders</h1>
        <Link href="/customers" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "md:hidden")}>
          <Users className="h-4 w-4" />
          Customers
        </Link>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by customer name or phone"
          className="pl-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={cn(
              "h-[30px] shrink-0 rounded-full px-3.5 text-[12px] font-semibold transition-colors",
              status === s
                ? "bg-primary text-primary-foreground"
                : "border border-border/70 bg-surface text-muted-foreground",
            )}
          >
            {s === "ALL" ? "All" : s}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : !data || data.items.length === 0 ? (
        <EmptyState title="No orders yet" description="Tap the + button below to create your first order." />
      ) : (
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
      )}
    </div>
  );
}
