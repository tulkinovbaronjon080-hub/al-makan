"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { OrderDetailDto, OrderStatus } from "@al-makan/types";
import { orderStatusSchema } from "@al-makan/types";
import { Button, Card, CardContent, EmptyState, Input, StatusBadge } from "@al-makan/ui";
import { api, ApiError } from "@/lib/api/client";

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
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

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Order #{order.orderNumber}</h1>
        <StatusBadge status={order.status} />
      </div>

      <Card>
        <CardContent className="space-y-1 pt-4">
          <Link href={`/customers/${order.customer.id}`} className="font-medium text-primary hover:underline">
            {order.customer.fullName}
          </Link>
          <p className="text-sm text-muted-foreground">{order.customer.phone}</p>
          {order.notes && <p className="pt-2 text-sm">{order.notes}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 pt-4">
          <p className="text-sm font-medium">Change status</p>
          <select
            value={nextStatus}
            onChange={(e) => setNextStatus(e.target.value as OrderStatus)}
            className="flex h-touch w-full rounded-md border border-input bg-surface px-3 py-2 text-sm"
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
          <Input placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button
            className="w-full"
            disabled={!nextStatus || changeStatus.isPending}
            onClick={submitStatusChange}
          >
            {changeStatus.isPending ? "Updating..." : "Update status"}
          </Button>
        </CardContent>
      </Card>

      <h2 className="text-sm font-medium text-muted-foreground">Timeline</h2>
      <div className="space-y-2">
        {order.statusHistory.map((entry) => (
          <Card key={entry.id}>
            <CardContent className="flex items-center justify-between py-3">
              <div>
                <StatusBadge status={entry.status} />
                {entry.note && <p className="mt-1 text-sm text-muted-foreground">{entry.note}</p>}
              </div>
              <span className="text-xs text-muted-foreground">
                {new Date(entry.createdAt).toLocaleString()}
              </span>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
