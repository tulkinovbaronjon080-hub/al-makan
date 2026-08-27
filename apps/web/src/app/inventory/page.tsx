"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, Plus } from "lucide-react";
import type {
  AccessoryDto,
  GlassDto,
  LocationDto,
  MaterialType,
  ProfileDto,
  StockBalanceDto,
  StockMovementDto,
  StockMovementType,
} from "@al-makan/types";
import { materialTypeSchema } from "@al-makan/types";
import { Button, Card, EmptyState, Input, cn } from "@al-makan/ui";
import { api, ApiError } from "@/lib/api/client";
import type { Paginated } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/auth-context";

const TABS = ["stock", "movements"] as const;
type Tab = (typeof TABS)[number];
const TAB_LABELS: Record<Tab, string> = { stock: "Stock", movements: "Movements" };

export default function InventoryPage() {
  const { permissions } = useAuth();
  const [tab, setTab] = useState<Tab>("stock");

  if (!permissions.includes("inventory.view")) {
    return (
      <div className="mx-auto max-w-2xl p-4 md:p-6">
        <EmptyState title="No access" description="You don't have permission to view inventory." />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4 md:p-6">
      <h1 className="text-[17px] font-bold tracking-tight">Inventory</h1>

      <div className="flex gap-2">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "h-[30px] shrink-0 rounded-full px-3.5 text-[12px] font-semibold transition-colors",
              tab === t ? "bg-primary text-primary-foreground" : "border border-border/70 bg-surface text-muted-foreground",
            )}
          >
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      {tab === "stock" && <StockTab />}
      {tab === "movements" && <MovementsTab />}
    </div>
  );
}

function StockTab() {
  const { permissions } = useAuth();
  const [showAdd, setShowAdd] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ["inventory", "stock"],
    queryFn: () => api.get<StockBalanceDto[]>("/inventory/stock"),
  });

  const grouped = useMemo(() => {
    const map = new Map<string, StockBalanceDto[]>();
    for (const item of data ?? []) {
      const list = map.get(item.locationName) ?? [];
      list.push(item);
      map.set(item.locationName, list);
    }
    return [...map.entries()];
  }, [data]);

  return (
    <div className="space-y-3">
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : grouped.length === 0 ? (
        <EmptyState title="No stock recorded yet" description="Receive stock to start tracking materials on hand." />
      ) : (
        grouped.map(([locationName, items]) => (
          <div key={locationName} className="space-y-1.5">
            <p className="px-1 text-[11.5px] font-bold uppercase tracking-wide text-muted-foreground">{locationName}</p>
            <Card className="divide-y divide-border/60 border border-border/70">
              {items.map((item) => (
                <div key={`${item.materialType}:${item.materialId}`} className="flex items-center justify-between px-4 py-3">
                  <span className="text-[13px] font-semibold">{item.label}</span>
                  <span className="font-mono text-[13px] font-bold text-primary">
                    {item.unit === "PCS" ? item.quantity : item.quantity.toFixed(2)} {item.unit === "PCS" ? "pc" : item.unit.toLowerCase()}
                  </span>
                </div>
              ))}
            </Card>
          </div>
        ))
      )}

      {permissions.includes("inventory.adjust") &&
        (!showAdd ? (
          <button
            onClick={() => setShowAdd(true)}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-lg border-[1.5px] border-dashed border-border text-[13px] font-semibold text-surface-foreground/80"
          >
            <Plus className="h-4 w-4" strokeWidth={2} />
            Record movement
          </button>
        ) : (
          <RecordMovementForm onDone={() => setShowAdd(false)} />
        ))}
    </div>
  );
}

function MovementsTab() {
  const { data, isLoading } = useQuery({
    queryKey: ["inventory", "movements"],
    queryFn: () => api.get<StockMovementDto[]>("/inventory/movements"),
  });

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }
  if (!data || data.length === 0) {
    return <EmptyState title="No movements yet" description="Stock intake, adjustments, and production use will show up here." />;
  }

  return (
    <div className="space-y-2">
      {data.map((m) => (
        <Card key={m.id} className="border border-border/70 p-3.5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-bold">{m.label}</p>
              <p className="mt-0.5 text-[11.5px] text-muted-foreground">
                {m.locationName} &middot; {movementTypeLabel(m.type)}
                {m.note ? ` · ${m.note}` : ""}
              </p>
              <p className="mt-1 text-[10.5px] text-muted-foreground/70">
                {new Date(m.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
              </p>
            </div>
            <span className={cn("font-mono text-[13px] font-bold", m.quantityDelta >= 0 ? "text-success" : "text-danger")}>
              {m.quantityDelta >= 0 ? "+" : ""}
              {m.quantityDelta}
            </span>
          </div>
        </Card>
      ))}
    </div>
  );
}

function movementTypeLabel(type: StockMovementType) {
  if (type === "RECEIVE") return "Received";
  if (type === "ADJUSTMENT") return "Adjusted";
  return "Used in production";
}

function RecordMovementForm({ onDone }: { onDone: () => void }) {
  const queryClient = useQueryClient();
  const [materialType, setMaterialType] = useState<MaterialType>("PROFILE");
  const [materialId, setMaterialId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [type, setType] = useState<"RECEIVE" | "ADJUSTMENT">("RECEIVE");
  const [quantity, setQuantity] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { data: locations } = useQuery({
    queryKey: ["locations", "active"],
    queryFn: () => api.get<Paginated<LocationDto>>("/locations?page=1&pageSize=100&isActive=true"),
  });
  const { data: profiles } = useQuery({
    queryKey: ["catalog", "profiles", "all"],
    queryFn: () => api.get<Paginated<ProfileDto>>("/catalog/profiles?page=1&pageSize=100&isActive=true"),
    enabled: materialType === "PROFILE",
  });
  const { data: glassList } = useQuery({
    queryKey: ["catalog", "glass", "all"],
    queryFn: () => api.get<Paginated<GlassDto>>("/catalog/glass?page=1&pageSize=100&isActive=true"),
    enabled: materialType === "GLASS",
  });
  const { data: accessories } = useQuery({
    queryKey: ["catalog", "accessories", "all"],
    queryFn: () => api.get<Paginated<AccessoryDto>>("/catalog/accessories?page=1&pageSize=100&isActive=true"),
    enabled: materialType === "ACCESSORY",
  });

  const materialOptions =
    materialType === "PROFILE" ? profiles?.items : materialType === "GLASS" ? glassList?.items : materialType === "ACCESSORY" ? accessories?.items : undefined;
  const effectiveMaterialId = materialType === "SEAL" ? "seal" : materialId;

  const record = useMutation({
    mutationFn: () =>
      api.post("/inventory/movements", {
        locationId,
        materialType,
        materialId: effectiveMaterialId,
        type,
        quantityDelta: type === "RECEIVE" ? Math.abs(Number(quantity)) : Number(quantity),
        note: note || undefined,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["inventory", "stock"] });
      await queryClient.invalidateQueries({ queryKey: ["inventory", "movements"] });
      onDone();
    },
  });

  async function onSubmit() {
    setError(null);
    try {
      await record.mutateAsync();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    }
  }

  const canSubmit = locationId && effectiveMaterialId && quantity && Number(quantity) !== 0;

  return (
    <Card className="space-y-3 border border-border/70 p-4">
      <div className="relative">
        <select
          value={materialType}
          onChange={(e) => {
            setMaterialType(e.target.value as MaterialType);
            setMaterialId("");
          }}
          className="h-touch w-full appearance-none rounded-lg border-[1.5px] border-input bg-surface px-3.5 pr-9 text-[13.5px] focus-visible:border-ring focus-visible:outline-none"
        >
          {materialTypeSchema.options.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      </div>

      {materialType !== "SEAL" && (
        <div className="relative">
          <select
            value={materialId}
            onChange={(e) => setMaterialId(e.target.value)}
            className="h-touch w-full appearance-none rounded-lg border-[1.5px] border-input bg-surface px-3.5 pr-9 text-[13.5px] focus-visible:border-ring focus-visible:outline-none"
          >
            <option value="">Select material…</option>
            {materialOptions?.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        </div>
      )}

      <div className="relative">
        <select
          value={locationId}
          onChange={(e) => setLocationId(e.target.value)}
          className="h-touch w-full appearance-none rounded-lg border-[1.5px] border-input bg-surface px-3.5 pr-9 text-[13.5px] focus-visible:border-ring focus-visible:outline-none"
        >
          <option value="">Select location…</option>
          {locations?.items.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      </div>

      <div className="flex gap-2">
        {(["RECEIVE", "ADJUSTMENT"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={cn(
              "h-9 flex-1 rounded-lg text-[12px] font-semibold",
              type === t ? "bg-primary text-primary-foreground" : "border border-border/70 bg-surface text-muted-foreground",
            )}
          >
            {t === "RECEIVE" ? "Receive stock" : "Adjust stock"}
          </button>
        ))}
      </div>

      <Input
        placeholder={type === "RECEIVE" ? "Quantity received" : "Quantity change (+/-)"}
        type="number"
        inputMode="decimal"
        value={quantity}
        onChange={(e) => setQuantity(e.target.value)}
      />
      <Input placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />

      {error && <p className="text-sm text-danger">{error}</p>}
      <Button className="w-full" onClick={onSubmit} disabled={!canSubmit || record.isPending}>
        {record.isPending ? "Saving..." : "Save movement"}
      </Button>
    </Card>
  );
}
