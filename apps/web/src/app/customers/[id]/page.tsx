"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import type { CustomerDto, OrderStatus } from "@al-makan/types";
import { Card, CardContent, EmptyState, StatusBadge } from "@al-makan/ui";
import { api } from "@/lib/api/client";

interface CustomerOrderSummary {
  id: string;
  orderNumber: number;
  status: OrderStatus;
  createdAt: string;
}

interface CustomerDetail extends CustomerDto {
  orders: CustomerOrderSummary[];
}

export default function CustomerDetailPage() {
  const params = useParams<{ id: string }>();

  const { data: customer, isLoading } = useQuery({
    queryKey: ["customers", params.id],
    queryFn: () => api.get<CustomerDetail>(`/customers/${params.id}`),
  });

  if (isLoading) {
    return <p className="p-4 text-sm text-muted-foreground">Loading…</p>;
  }
  if (!customer) {
    return <EmptyState title="Customer not found" className="m-4" />;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4">
      <Card>
        <CardContent className="space-y-1 pt-4">
          <h1 className="text-xl font-semibold">{customer.fullName}</h1>
          <p className="text-sm text-muted-foreground">{customer.phone}</p>
          {customer.address && <p className="text-sm text-muted-foreground">{customer.address}</p>}
          {customer.notes && <p className="pt-2 text-sm">{customer.notes}</p>}
        </CardContent>
      </Card>

      <h2 className="text-sm font-medium text-muted-foreground">Orders</h2>
      {customer.orders.length === 0 ? (
        <EmptyState title="No orders yet" description="Create an order for this customer to see it here." />
      ) : (
        <div className="space-y-2">
          {customer.orders.map((order) => (
            <Link key={order.id} href={`/orders/${order.id}`}>
              <Card className="transition-colors hover:bg-muted/50">
                <CardContent className="flex items-center justify-between py-3">
                  <span className="font-medium">#{order.orderNumber}</span>
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
