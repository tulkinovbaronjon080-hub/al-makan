"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import type { OrderDto } from "@al-makan/types";
import { Card, CardContent, CardHeader, CardTitle, EmptyState, StatusBadge } from "@al-makan/ui";
import { getDictionary } from "@/lib/i18n/dictionary";
import { api } from "@/lib/api/client";
import type { Paginated } from "@/lib/api/types";

const dict = getDictionary();

export default function HomePage() {
  const { data } = useQuery({
    queryKey: ["orders", "dashboard-recent"],
    queryFn: () => api.get<Paginated<OrderDto>>("/orders?page=1&pageSize=5"),
  });

  // Production/Ready/Sales stay "—" until Phases 6/8 exist to back them —
  // no fabricated numbers on the dashboard.
  const stats = [
    { key: "orders" as const, value: data ? String(data.total) : "—" },
    { key: "production" as const, value: "—" },
    { key: "ready" as const, value: "—" },
    { key: "sales" as const, value: "—" },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-4 p-4">
      <h1 className="text-xl font-semibold">{dict.dashboard.title}</h1>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.key}>
            <CardHeader className="pb-1">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                {dict.dashboard[stat.key]}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {data && data.items.length > 0 ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-muted-foreground">Recent orders</h2>
            <Link href="/orders" className="text-sm text-primary underline">
              View all
            </Link>
          </div>
          {data.items.map((order) => (
            <Link key={order.id} href={`/orders/${order.id}`}>
              <Card className="transition-colors hover:bg-muted/50">
                <CardContent className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium">
                      #{order.orderNumber} · {order.customer.fullName}
                    </p>
                    <p className="text-sm text-muted-foreground">{order.customer.phone}</p>
                  </div>
                  <StatusBadge status={order.status} />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No orders yet"
          description="Tap the + button below to create your first order."
        />
      )}
    </div>
  );
}
