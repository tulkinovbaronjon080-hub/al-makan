"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Search } from "lucide-react";
import {
  createCustomerSchema,
  type CreateCustomerDto,
  type CustomerDto,
  type OrderDto,
} from "@al-makan/types";
import { Button, Card, CardContent, Input } from "@al-makan/ui";
import { api, ApiError } from "@/lib/api/client";
import type { Paginated } from "@/lib/api/types";

export default function CreateOrderPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [customer, setCustomer] = useState<CustomerDto | null>(null);
  const [search, setSearch] = useState("");
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { data: results } = useQuery({
    queryKey: ["customers", "search", search],
    queryFn: () =>
      api.get<Paginated<CustomerDto>>(`/customers?page=1&pageSize=10&search=${encodeURIComponent(search)}`),
    enabled: search.length > 0,
  });

  const {
    register: registerCustomer,
    handleSubmit: handleCustomerSubmit,
    formState: { errors: customerErrors, isSubmitting: isCreatingCustomer },
  } = useForm<CreateCustomerDto>({ resolver: zodResolver(createCustomerSchema) });

  const createCustomer = useMutation({
    mutationFn: (dto: CreateCustomerDto) => api.post<CustomerDto>("/customers", dto),
  });

  const createOrder = useMutation({
    mutationFn: () => api.post<OrderDto>("/orders", { customerId: customer?.id, notes: notes || undefined }),
  });

  async function onQuickAddCustomer(dto: CreateCustomerDto) {
    setError(null);
    try {
      const created = await createCustomer.mutateAsync(dto);
      await queryClient.invalidateQueries({ queryKey: ["customers"] });
      setCustomer(created);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    }
  }

  async function onCreateOrder() {
    setError(null);
    try {
      const order = await createOrder.mutateAsync();
      await queryClient.invalidateQueries({ queryKey: ["orders"] });
      router.push(`/orders/${order.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    }
  }

  if (!customer) {
    return (
      <div className="mx-auto max-w-sm space-y-4 p-4">
        <h1 className="text-xl font-semibold">New order — select customer</h1>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or phone"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {results && results.items.length > 0 && (
          <div className="space-y-2">
            {results.items.map((c) => (
              <Card
                key={c.id}
                className="cursor-pointer transition-colors hover:bg-muted/50"
                onClick={() => setCustomer(c)}
              >
                <CardContent className="py-3">
                  <p className="font-medium">{c.fullName}</p>
                  <p className="text-sm text-muted-foreground">{c.phone}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        {search.length > 0 && results && results.items.length === 0 && !showQuickAdd && (
          <p className="text-sm text-muted-foreground">No matching customers.</p>
        )}

        {!showQuickAdd ? (
          <Button variant="outline" className="w-full" onClick={() => setShowQuickAdd(true)}>
            + Add new customer
          </Button>
        ) : (
          <Card>
            <CardContent className="space-y-3 pt-4">
              <form onSubmit={handleCustomerSubmit(onQuickAddCustomer)} className="space-y-3" noValidate>
                <div className="space-y-1">
                  <label className="text-sm font-medium" htmlFor="fullName">
                    Full name
                  </label>
                  <Input id="fullName" {...registerCustomer("fullName")} />
                  {customerErrors.fullName && (
                    <p className="text-sm text-danger">{customerErrors.fullName.message}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium" htmlFor="phone">
                    Phone
                  </label>
                  <Input id="phone" type="tel" inputMode="tel" {...registerCustomer("phone")} />
                  {customerErrors.phone && <p className="text-sm text-danger">{customerErrors.phone.message}</p>}
                </div>
                {error && <p className="text-sm text-danger">{error}</p>}
                <Button type="submit" className="w-full" disabled={isCreatingCustomer}>
                  {isCreatingCustomer ? "Saving..." : "Save and continue"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm space-y-4 p-4">
      <h1 className="text-xl font-semibold">New order</h1>

      <Card>
        <CardContent className="space-y-1 pt-4">
          <p className="text-sm text-muted-foreground">Customer</p>
          <p className="font-medium">{customer.fullName}</p>
          <p className="text-sm text-muted-foreground">{customer.phone}</p>
          <button className="text-sm text-primary underline" onClick={() => setCustomer(null)}>
            Change customer
          </button>
        </CardContent>
      </Card>

      <div className="space-y-1">
        <label className="text-sm font-medium" htmlFor="notes">
          Notes (optional)
        </label>
        <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}
      <Button className="w-full" onClick={onCreateOrder} disabled={createOrder.isPending}>
        {createOrder.isPending ? "Creating..." : "Create order"}
      </Button>
    </div>
  );
}
