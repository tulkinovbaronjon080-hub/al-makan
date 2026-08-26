"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import type { CustomerDto } from "@al-makan/types";
import { Card, EmptyState, Input, buttonVariants, cn } from "@al-makan/ui";
import { api } from "@/lib/api/client";
import type { Paginated } from "@/lib/api/types";

export default function CustomersPage() {
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["customers", search],
    queryFn: () =>
      api.get<Paginated<CustomerDto>>(
        `/customers?page=1&pageSize=50${search ? `&search=${encodeURIComponent(search)}` : ""}`,
      ),
  });

  const groups = useMemo(() => groupByFirstLetter(data?.items ?? []), [data]);

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-[20px] font-bold tracking-tight">Customers</h1>
        <Link href="/customers/new" className={cn(buttonVariants({ size: "sm" }))}>
          <Plus className="h-4 w-4" />
          New
        </Link>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search name or phone"
          className="pl-10"
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
        <div className="space-y-4">
          {groups.map((group) => (
            <div key={group.letter} className="space-y-2">
              <p className="px-1 text-[11px] font-bold tracking-wide text-muted-foreground/70">{group.letter}</p>
              {group.items.map((c) => (
                <Link key={c.id} href={`/customers/${c.id}`}>
                  <Card className="flex items-center gap-3 border border-border/70 p-3.5 transition-colors hover:bg-muted/50">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-[13px] font-bold text-surface-foreground/80">
                      {getInitials(c.fullName)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13.5px] font-semibold">{c.fullName}</p>
                      <p className="text-[11.5px] text-muted-foreground">{c.phone}</p>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
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

function groupByFirstLetter(items: CustomerDto[]) {
  const map = new Map<string, CustomerDto[]>();
  for (const item of items) {
    const letter = item.fullName.trim().charAt(0).toUpperCase() || "#";
    if (!map.has(letter)) map.set(letter, []);
    map.get(letter)!.push(item);
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([letter, groupItems]) => ({ letter, items: groupItems }));
}
