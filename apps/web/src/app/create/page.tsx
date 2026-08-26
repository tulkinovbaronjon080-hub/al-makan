"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Plus, Search } from "lucide-react";
import {
  createCustomerSchema,
  type CreateCustomerDto,
  type CustomerDto,
  type OrderDto,
} from "@al-makan/types";
import { Button, Card, Input, cn } from "@al-makan/ui";
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

  const step = customer ? 2 : 1;

  return (
    <div className="mx-auto flex max-w-sm flex-col p-4 md:p-6">
      <div className="mb-5 flex items-center gap-3">
        <button
          onClick={() => (customer ? setCustomer(null) : router.back())}
          aria-label="Back"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border/70 bg-surface"
        >
          <ArrowLeft className="h-[17px] w-[17px]" strokeWidth={2} />
        </button>
        <h1 className="text-[17px] font-bold tracking-tight">New order</h1>
      </div>

      <div className="mb-1.5 flex gap-1.5">
        <div className="h-1 flex-1 rounded-full bg-primary" />
        <div className={cn("h-1 flex-1 rounded-full", step === 2 ? "bg-primary" : "bg-border")} />
      </div>
      <div className="mb-6 flex justify-between text-[11px] font-semibold text-muted-foreground">
        <span className={step === 1 ? "text-primary" : undefined}>1 &middot; Customer</span>
        <span className={step === 2 ? "text-primary" : undefined}>2 &middot; Details</span>
      </div>

      {step === 1 ? (
        <div className="space-y-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name or phone"
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>

          {results && results.items.length > 0 && (
            <div className="space-y-2">
              {results.items.map((c) => (
                <Card
                  key={c.id}
                  className="flex cursor-pointer items-center gap-3 border border-border/70 p-3.5 transition-colors hover:bg-muted/50"
                  onClick={() => setCustomer(c)}
                >
                  <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-bold text-surface-foreground/80">
                    {getInitials(c.fullName)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-semibold">{c.fullName}</p>
                    <p className="text-[11.5px] text-muted-foreground">{c.phone}</p>
                  </div>
                </Card>
              ))}
            </div>
          )}
          {search.length > 0 && results && results.items.length === 0 && !showQuickAdd && (
            <p className="text-sm text-muted-foreground">No matching customers.</p>
          )}

          {!showQuickAdd ? (
            <button
              onClick={() => setShowQuickAdd(true)}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-lg border-[1.5px] border-dashed border-border text-[13.5px] font-semibold text-surface-foreground/80"
            >
              <Plus className="h-4 w-4" strokeWidth={2} />
              Add new customer
            </button>
          ) : (
            <Card className="border border-border/70 p-4">
              <form onSubmit={handleCustomerSubmit(onQuickAddCustomer)} className="space-y-3" noValidate>
                <div className="space-y-1.5">
                  <label className="text-[12.5px] font-semibold" htmlFor="fullName">
                    Full name
                  </label>
                  <Input id="fullName" {...registerCustomer("fullName")} />
                  {customerErrors.fullName && (
                    <p className="text-sm text-danger">{customerErrors.fullName.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="text-[12.5px] font-semibold" htmlFor="phone">
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
            </Card>
          )}
        </div>
      ) : (
        customer && (
          <div className="space-y-4">
            <Card className="flex items-center gap-3 border border-border/70 p-3.5">
              <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">
                {getInitials(customer.fullName)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13.5px] font-semibold">{customer.fullName}</p>
                <p className="text-[11.5px] text-muted-foreground">{customer.phone}</p>
              </div>
              <button
                className="text-[12px] font-semibold text-primary"
                onClick={() => setCustomer(null)}
              >
                Change
              </button>
            </Card>

            <div className="space-y-1.5">
              <label className="text-[12.5px] font-semibold" htmlFor="notes">
                Notes (optional)
              </label>
              <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>

            {error && <p className="text-sm text-danger">{error}</p>}
            <Button className="w-full" onClick={onCreateOrder} disabled={createOrder.isPending}>
              {createOrder.isPending ? "Creating..." : "Create order"}
            </Button>
          </div>
        )
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
