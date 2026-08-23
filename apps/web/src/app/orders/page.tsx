"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Search, Users } from "lucide-react";
import type { OrderDto, OrderStatus } from "@al-makan/types";
import { orderStatusSchema } from "@al-makan/types";
import { Card, CardContent, EmptyState, Input, StatusBadge, buttonVariants, cn } from "@al-makan/ui";
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
    <div className="mx-auto max-w-3xl space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Orders</h1>
        <Link href="/customers" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
          <Users className="h-4 w-4" />
          Customers
        </Link>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by customer name or phone"
          className="pl-9"
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
              "shrink-0 rounded-md border px-3 py-1.5 text-xs font-medium",
              status === s ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground",
            )}
          >
            {s === "ALL" ? "All" : s}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          title="No orders yet"
          description="Tap the + button below to create your first order."
        />
      ) : (
        <div className="space-y-2">
          {data.items.map((order) => (
            <Link key={order.id} href={`/orders/${order.id}`}>
              <Card className="transition-colors hover:bg-muted/50">
                <CardContent className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium">#{order.orderNumber} · {order.customer.fullName}</p>
                    <p className="text-sm text-muted-foreground">{order.customer.phone}</p>
                  </div>
                  <StatusBadge status={order.status} />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
