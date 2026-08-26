"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Button, Card, EmptyState, Input, cn } from "@al-makan/ui";
import { api, ApiError } from "@/lib/api/client";
import type { Paginated } from "@/lib/api/types";

interface CatalogItem {
  id: string;
  name: string;
  isActive: boolean;
  [key: string]: unknown;
}

/**
 * Glass, Colors, and Accessories are structurally identical (name + one
 * price field + isActive) — one reusable list instead of three near-copies
 * of the same JSX. See the Phase 3 plan for why this is worth it on the
 * frontend even though the backend deliberately keeps six separate
 * services (real code duplication there is small per-resource, not the
 * near-total duplication this component would otherwise be).
 */
export function CatalogPriceList({
  apiPath,
  priceField,
  unitLabel,
  namePlaceholder,
}: {
  apiPath: string;
  priceField: string;
  unitLabel: string;
  namePlaceholder: string;
}) {
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [error, setError] = useState<string | null>(null);

  const queryKey = ["catalog", apiPath];
  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () => api.get<Paginated<CatalogItem>>(`${apiPath}?page=1&pageSize=100`),
  });

  const create = useMutation({
    mutationFn: () => api.post(apiPath, { name, [priceField]: Number(price) }),
    onSuccess: async () => {
      setName("");
      setPrice("");
      setShowAdd(false);
      await queryClient.invalidateQueries({ queryKey });
    },
  });

  const toggleActive = useMutation({
    mutationFn: (item: CatalogItem) => api.patch(`${apiPath}/${item.id}`, { isActive: !item.isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  async function onSubmit() {
    setError(null);
    try {
      await create.mutateAsync();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    }
  }

  return (
    <div className="space-y-2">
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : !data || data.items.length === 0 ? (
        <EmptyState title="Nothing here yet" description="Add your first entry below." />
      ) : (
        data.items.map((item) => (
          <Card
            key={item.id}
            className={cn("flex items-center gap-3 border border-border/70 p-3.5", !item.isActive && "opacity-50")}
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13.5px] font-semibold">{item.name}</p>
              <p className="font-mono text-[11.5px] text-muted-foreground">
                {Number(item[priceField]).toLocaleString()} so&#39;m {unitLabel}
              </p>
            </div>
            <button
              onClick={() => toggleActive.mutate(item)}
              className={cn(
                "rounded-full px-2.5 py-1 text-[10.5px] font-bold",
                item.isActive ? "bg-success/10 text-success" : "bg-muted text-muted-foreground",
              )}
            >
              {item.isActive ? "Active" : "Inactive"}
            </button>
          </Card>
        ))
      )}

      {!showAdd ? (
        <button
          onClick={() => setShowAdd(true)}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-lg border-[1.5px] border-dashed border-border text-[13px] font-semibold text-surface-foreground/80"
        >
          <Plus className="h-4 w-4" strokeWidth={2} />
          Add new
        </button>
      ) : (
        <Card className="space-y-3 border border-border/70 p-4">
          <Input placeholder={namePlaceholder} value={name} onChange={(e) => setName(e.target.value)} />
          <Input
            placeholder={`Price (UZS) ${unitLabel}`}
            type="number"
            inputMode="numeric"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button className="w-full" onClick={onSubmit} disabled={!name || !price || create.isPending}>
            {create.isPending ? "Saving..." : "Save"}
          </Button>
        </Card>
      )}
    </div>
  );
}
