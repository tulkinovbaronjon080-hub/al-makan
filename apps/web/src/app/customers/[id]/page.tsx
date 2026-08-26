"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Phone } from "lucide-react";
import type { CustomerDto, OrderStatus } from "@al-makan/types";
import { Card, EmptyState, StatusBadge } from "@al-makan/ui";
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
  const router = useRouter();

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

  const initials = getInitials(customer.fullName);

  return (
    <div className="mx-auto max-w-2xl space-y-5 p-4 md:p-6">
      <button
        onClick={() => router.back()}
        aria-label="Back"
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/70 bg-surface"
      >
        <ArrowLeft className="h-[17px] w-[17px]" strokeWidth={2} />
      </button>

      <div className="flex flex-col items-center gap-2 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-xl font-bold text-primary-foreground shadow-[0_8px_18px_-4px_hsl(var(--primary)/0.45)]">
          {initials}
        </div>
        <h1 className="text-lg font-bold tracking-tight">{customer.fullName}</h1>
        <p className="text-[13px] text-muted-foreground">{customer.phone}</p>
        {customer.address && <p className="text-xs text-muted-foreground/70">{customer.address}</p>}
      </div>

      <a
        href={`tel:${customer.phone}`}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary text-[12.5px] font-semibold text-primary-foreground shadow-[0_6px_14px_-4px_hsl(var(--primary)/0.5)]"
      >
        <Phone className="h-[15px] w-[15px]" strokeWidth={1.9} />
        Call
      </a>

      {customer.notes && (
        <Card className="border border-border/70 p-4 text-[12.5px] leading-relaxed text-surface-foreground/85">
          {customer.notes}
        </Card>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-[13.5px] font-bold">Orders</h2>
        <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-bold text-muted-foreground">
          {customer.orders.length}
        </span>
      </div>
      {customer.orders.length === 0 ? (
        <EmptyState title="No orders yet" description="Create an order for this customer to see it here." />
      ) : (
        <div className="space-y-2">
          {customer.orders.map((order) => (
            <Link key={order.id} href={`/orders/${order.id}`}>
              <Card className="flex items-center gap-3 border border-border/70 p-3.5 transition-colors hover:bg-muted/50">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted font-mono text-xs font-bold text-surface-foreground/80">
                  #{order.orderNumber}
                </div>
                <span className="flex-1 text-[12.5px] font-medium text-muted-foreground">
                  {new Date(order.createdAt).toLocaleDateString(undefined, { dateStyle: "medium" })}
                </span>
                <StatusBadge status={order.status} />
              </Card>
            </Link>
          ))}
        </div>
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
