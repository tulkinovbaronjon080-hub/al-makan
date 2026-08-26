"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronRight, Plus } from "lucide-react";
import type { BrandDto, ProfileDto, ProfileSeriesDto } from "@al-makan/types";
import { Button, Card, EmptyState, Input, cn } from "@al-makan/ui";
import { api, ApiError } from "@/lib/api/client";
import type { Paginated } from "@/lib/api/types";

export function BrandsSection() {
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["catalog", "brands"],
    queryFn: () => api.get<Paginated<BrandDto>>("/catalog/brands?page=1&pageSize=100"),
  });

  const create = useMutation({
    mutationFn: () => api.post("/catalog/brands", { name }),
    onSuccess: async () => {
      setName("");
      setShowAdd(false);
      await queryClient.invalidateQueries({ queryKey: ["catalog", "brands"] });
    },
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
        <EmptyState title="No brands yet" description="Add a brand, then its series and profiles." />
      ) : (
        data.items.map((brand) => <BrandRow key={brand.id} brand={brand} />)
      )}

      {!showAdd ? (
        <button
          onClick={() => setShowAdd(true)}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-lg border-[1.5px] border-dashed border-border text-[13px] font-semibold text-surface-foreground/80"
        >
          <Plus className="h-4 w-4" strokeWidth={2} />
          Add brand
        </button>
      ) : (
        <Card className="space-y-3 border border-border/70 p-4">
          <Input placeholder="e.g. AKFA" value={name} onChange={(e) => setName(e.target.value)} />
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button className="w-full" onClick={onSubmit} disabled={!name || create.isPending}>
            {create.isPending ? "Saving..." : "Save brand"}
          </Button>
        </Card>
      )}
    </div>
  );
}

function BrandRow({ brand }: { brand: BrandDto }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="border border-border/70 p-0">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-2 p-3.5 text-left"
      >
        {expanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
        <span className="flex-1 text-[13.5px] font-bold">{brand.name}</span>
        {!brand.isActive && (
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">Inactive</span>
        )}
      </button>
      {expanded && (
        <div className="space-y-2 border-t border-border/60 bg-muted/30 p-3.5 pl-8">
          <SeriesSection brandId={brand.id} />
        </div>
      )}
    </Card>
  );
}

function SeriesSection({ brandId }: { brandId: string }) {
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const queryKey = ["catalog", "series", brandId];
  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () => api.get<Paginated<ProfileSeriesDto>>(`/catalog/series?brandId=${brandId}&page=1&pageSize=100`),
  });

  const create = useMutation({
    mutationFn: () => api.post("/catalog/series", { brandId, name }),
    onSuccess: async () => {
      setName("");
      setShowAdd(false);
      await queryClient.invalidateQueries({ queryKey });
    },
  });

  async function onSubmit() {
    setError(null);
    try {
      await create.mutateAsync();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    }
  }

  if (isLoading) return <p className="text-xs text-muted-foreground">Loading…</p>;

  return (
    <div className="space-y-2">
      {data && data.items.length > 0 ? (
        data.items.map((series) => <SeriesRow key={series.id} series={series} />)
      ) : (
        <p className="text-xs text-muted-foreground">No series yet.</p>
      )}

      {!showAdd ? (
        <button
          onClick={() => setShowAdd(true)}
          className="flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border text-[12px] font-semibold text-surface-foreground/80"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2} />
          Add series
        </button>
      ) : (
        <div className="space-y-2 rounded-lg border border-border/70 bg-surface p-3">
          <Input placeholder="e.g. A45" value={name} onChange={(e) => setName(e.target.value)} />
          {error && <p className="text-xs text-danger">{error}</p>}
          <Button size="sm" className="w-full" onClick={onSubmit} disabled={!name || create.isPending}>
            {create.isPending ? "Saving..." : "Save series"}
          </Button>
        </div>
      )}
    </div>
  );
}

function SeriesRow({ series }: { series: ProfileSeriesDto }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-lg border border-border/70 bg-surface">
      <button onClick={() => setExpanded((v) => !v)} className="flex w-full items-center gap-2 p-3 text-left">
        {expanded ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
        <span className="flex-1 text-[12.5px] font-semibold">{series.name}</span>
        {!series.isActive && (
          <span className="rounded-full bg-muted px-2 py-0.5 text-[9.5px] font-bold text-muted-foreground">Inactive</span>
        )}
      </button>
      {expanded && (
        <div className="border-t border-border/60 p-3 pl-7">
          <ProfilesSection seriesId={series.id} />
        </div>
      )}
    </div>
  );
}

function ProfilesSection({ seriesId }: { seriesId: string }) {
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [error, setError] = useState<string | null>(null);

  const queryKey = ["catalog", "profiles", seriesId];
  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () => api.get<Paginated<ProfileDto>>(`/catalog/profiles?seriesId=${seriesId}&page=1&pageSize=100`),
  });

  const create = useMutation({
    mutationFn: () => api.post("/catalog/profiles", { seriesId, name, pricePerMeter: Number(price) }),
    onSuccess: async () => {
      setName("");
      setPrice("");
      setShowAdd(false);
      await queryClient.invalidateQueries({ queryKey });
    },
  });

  const toggleActive = useMutation({
    mutationFn: (profile: ProfileDto) => api.patch(`/catalog/profiles/${profile.id}`, { isActive: !profile.isActive }),
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

  if (isLoading) return <p className="text-xs text-muted-foreground">Loading…</p>;

  return (
    <div className="space-y-1.5">
      {data && data.items.length > 0 ? (
        data.items.map((profile) => (
          <div
            key={profile.id}
            className={cn("flex items-center gap-2 rounded-md bg-muted/50 px-2.5 py-2", !profile.isActive && "opacity-50")}
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12px] font-medium">{profile.name}</p>
              <p className="font-mono text-[10.5px] text-muted-foreground">
                {profile.pricePerMeter.toLocaleString()} so&#39;m / m
              </p>
            </div>
            <button
              onClick={() => toggleActive.mutate(profile)}
              className={cn(
                "rounded-full px-2 py-0.5 text-[9.5px] font-bold",
                profile.isActive ? "bg-success/10 text-success" : "bg-muted text-muted-foreground",
              )}
            >
              {profile.isActive ? "Active" : "Inactive"}
            </button>
          </div>
        ))
      ) : (
        <p className="text-xs text-muted-foreground">No profiles yet.</p>
      )}

      {!showAdd ? (
        <button
          onClick={() => setShowAdd(true)}
          className="flex h-8 w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-border text-[11.5px] font-semibold text-surface-foreground/80"
        >
          <Plus className="h-3 w-3" strokeWidth={2} />
          Add profile
        </button>
      ) : (
        <div className="space-y-1.5 rounded-md border border-border/70 bg-surface p-2.5">
          <Input placeholder="e.g. Frame" value={name} onChange={(e) => setName(e.target.value)} className="h-9 text-xs" />
          <Input
            placeholder="Price / meter (UZS)"
            type="number"
            inputMode="numeric"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="h-9 text-xs"
          />
          {error && <p className="text-xs text-danger">{error}</p>}
          <Button size="sm" className="w-full" onClick={onSubmit} disabled={!name || !price || create.isPending}>
            {create.isPending ? "Saving..." : "Save profile"}
          </Button>
        </div>
      )}
    </div>
  );
}
