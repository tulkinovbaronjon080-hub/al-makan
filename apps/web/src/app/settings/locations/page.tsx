"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ChevronDown, Plus } from "lucide-react";
import { locationTypeSchema, type LocationDto, type LocationType } from "@al-makan/types";
import { Button, Card, EmptyState, Input, cn } from "@al-makan/ui";
import { api, ApiError } from "@/lib/api/client";
import type { Paginated } from "@/lib/api/types";

export default function LocationsSettingsPage() {
  const router = useRouter();

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
        <h1 className="text-[17px] font-bold tracking-tight">Locations</h1>
      </div>

      <LocationsSection />
    </div>
  );
}

function LocationsSection() {
  const queryClient = useQueryClient();
  const queryKey = ["locations", "all"];
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<LocationType>("WAREHOUSE");
  const [address, setAddress] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () => api.get<Paginated<LocationDto>>("/locations?page=1&pageSize=100"),
  });

  const create = useMutation({
    mutationFn: () => api.post("/locations", { name, type, address: address || undefined }),
    onSuccess: async () => {
      setName("");
      setType("WAREHOUSE");
      setAddress("");
      setShowAdd(false);
      await queryClient.invalidateQueries({ queryKey });
    },
  });

  const toggleActive = useMutation({
    mutationFn: (location: LocationDto) => api.patch(`/locations/${location.id}`, { isActive: !location.isActive }),
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
        <EmptyState title="No locations yet" description="Add a warehouse or factory to start tracking stock." />
      ) : (
        data.items.map((location) => (
          <Card key={location.id} className="flex items-center gap-3 border border-border/70 p-3.5">
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13.5px] font-bold">{location.name}</p>
              <p className="text-[11.5px] text-muted-foreground">
                {location.type}
                {location.address ? ` · ${location.address}` : ""}
              </p>
            </div>
            <button
              onClick={() => toggleActive.mutate(location)}
              className={cn(
                "rounded-full px-2.5 py-1 text-[10px] font-bold",
                location.isActive ? "bg-success/10 text-success" : "bg-muted text-muted-foreground",
              )}
            >
              {location.isActive ? "Active" : "Inactive"}
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
          Add location
        </button>
      ) : (
        <Card className="space-y-3 border border-border/70 p-4">
          <Input placeholder="e.g. Main warehouse" value={name} onChange={(e) => setName(e.target.value)} />
          <div className="relative">
            <select
              value={type}
              onChange={(e) => setType(e.target.value as LocationType)}
              className="h-touch w-full appearance-none rounded-lg border-[1.5px] border-input bg-surface px-3.5 pr-9 text-[13.5px] focus-visible:border-ring focus-visible:outline-none"
            >
              {locationTypeSchema.options.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          </div>
          <Input placeholder="Address (optional)" value={address} onChange={(e) => setAddress(e.target.value)} />
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button className="w-full" onClick={onSubmit} disabled={!name || create.isPending}>
            {create.isPending ? "Saving..." : "Save location"}
          </Button>
        </Card>
      )}
    </div>
  );
}
