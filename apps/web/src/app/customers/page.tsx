"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import type { CustomerDto } from "@al-makan/types";
import { Card, CardContent, EmptyState, Input, buttonVariants, cn } from "@al-makan/ui";
import { api } from "@/lib/api/client";
import type { Paginated } from "@/lib/api/types";

export default function CustomersPage() {
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["customers", search],
    queryFn: () =>
      api.get<Paginated<CustomerDto>>(
        `/customers?page=1&pageSize=20${search ? `&search=${encodeURIComponent(search)}` : ""}`,
      ),
  });

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Customers</h1>
        <Link href="/customers/new" className={cn(buttonVariants({ size: "sm" }))}>
          <Plus className="h-4 w-4" />
          New
        </Link>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search name or phone"
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          title={search ? "No customers match your search" : "No customers yet"}
          description={search ? undefined : "Add your first customer to start creating orders."}
        />
      ) : (
        <div className="space-y-2">
          {data.items.map((c) => (
            <Link key={c.id} href={`/customers/${c.id}`}>
              <Card className="transition-colors hover:bg-muted/50">
                <CardContent className="py-3">
                  <p className="font-medium">{c.fullName}</p>
                  <p className="text-sm text-muted-foreground">{c.phone}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
