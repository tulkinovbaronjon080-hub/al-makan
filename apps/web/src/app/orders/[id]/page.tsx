"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ChevronDown, Phone } from "lucide-react";
import type { OrderDetailDto, OrderStatus } from "@al-makan/types";
import { orderStatusSchema } from "@al-makan/types";
import { Button, Card, EmptyState, Input, StatusBadge, cn } from "@al-makan/ui";
import { api, ApiError } from "@/lib/api/client";

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [nextStatus, setNextStatus] = useState<OrderStatus | "">("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const queryKey = ["orders", params.id];
  const { data: order, isLoading } = useQuery({
    queryKey,
    queryFn: () => api.get<OrderDetailDto>(`/orders/${params.id}`),
  });

  const changeStatus = useMutation({
    mutationFn: () =>
      api.patch(`/orders/${params.id}/status`, { status: nextStatus, note: note || undefined }),
    onSuccess: async () => {
      setNextStatus("");
      setNote("");
      await queryClient.invalidateQueries({ queryKey });
      await queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });

  async function submitStatusChange() {
    setError(null);
    if (!nextStatus) return;
    try {
      await changeStatus.mutateAsync();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    }
  }

  if (isLoading) {
    return <p className="p-4 text-sm text-muted-foreground">Loading…</p>;
  }
  if (!order) {
    return <EmptyState title="Order not found" className="m-4" />;
  }

  const initials = getInitials(order.customer.fullName);

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4 md:p-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          aria-label="Back"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border/70 bg-surface"
        >
          <ArrowLeft className="h-[17px] w-[17px]" strokeWidth={2} />
        </button>
        <div className="flex-1">
          <h1 className="font-mono text-lg font-bold tracking-tight">Order #{order.orderNumber}</h1>
          <p className="text-[11.5px] text-muted-foreground">
            Created {new Date(order.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
          </p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <Card className="border border-border/70 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl bg-muted text-sm font-bold text-surface-foreground/80">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <Link href={`/customers/${order.customer.id}`} className="block truncate text-[14.5px] font-bold">
              {order.customer.fullName}
            </Link>
            <p className="text-xs text-muted-foreground">{order.customer.phone}</p>
          </div>
          <a
            href={`tel:${order.customer.phone}`}
            aria-label="Call"
            className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
          >
            <Phone className="h-[17px] w-[17px]" strokeWidth={1.9} />
          </a>
        </div>
        {order.notes && (
          <p className="mt-3 border-t border-border/60 pt-3 text-[12.5px] leading-relaxed text-surface-foreground/85">
            {order.notes}
          </p>
        )}
      </Card>

      <Card className="border border-border/70 p-4">
        <p className="mb-2.5 text-[12px] font-bold">Change status</p>
        <div className="relative mb-2.5">
          <select
            value={nextStatus}
            onChange={(e) => setNextStatus(e.target.value as OrderStatus)}
            className="h-touch w-full appearance-none rounded-lg border-[1.5px] border-input bg-surface px-3.5 pr-9 text-[13.5px] focus-visible:border-ring focus-visible:outline-none"
          >
            <option value="">Select a status…</option>
            {orderStatusSchema.options
              .filter((s) => s !== order.status)
              .map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        </div>
        <Input
          placeholder="Note (optional)"
          className="mb-3"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        {error && <p className="mb-2 text-sm text-danger">{error}</p>}
        <Button className="w-full" disabled={!nextStatus || changeStatus.isPending} onClick={submitStatusChange}>
          {changeStatus.isPending ? "Updating..." : "Update status"}
        </Button>
      </Card>

      <h2 className="text-[13.5px] font-bold">Timeline</h2>
      <div className="relative pl-1.5">
        {order.statusHistory.map((entry, index) => {
          const isLast = index === order.statusHistory.length - 1;
          return (
            <div key={entry.id} className={cn("relative pl-6", isLast ? "pb-0" : "pb-5")}>
              {!isLast && <div className="absolute left-[5px] top-4 h-full w-0.5 bg-border" />}
              <div
                className={cn(
                  "absolute left-0 top-0.5 h-3 w-3 rounded-full border-[2.5px]",
                  isLast ? "border-primary/15 bg-primary" : "border-muted bg-muted-foreground",
                )}
              />
              <p className="text-[12.5px] font-bold">{entry.status}</p>
              {entry.note && <p className="mt-0.5 text-xs text-muted-foreground">{entry.note}</p>}
              <p className="mt-1 text-[10.5px] text-muted-foreground/70">
                {new Date(entry.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
              </p>
            </div>
          );
        })}
      </div>
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
