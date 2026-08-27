"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ChevronDown, Minus, Plus } from "lucide-react";
import { calculateProductConfiguration } from "@al-makan/calculation-engine";
import type { BrandDto, GlassDto, ColorDto, AccessoryDto, ProfileDto, ProfileSeriesDto } from "@al-makan/types";
import type { OpeningDirection, ProductType, CreateOrderItemDto, PricingSettingsDto } from "@al-makan/types";
import { Button, cn } from "@al-makan/ui";
import { api, ApiError } from "@/lib/api/client";
import type { Paginated } from "@/lib/api/types";
import { ConfiguratorPreview } from "@/components/configurator/configurator-preview";

const PRODUCT_TYPES: Array<{ value: ProductType; label: string }> = [
  { value: "WINDOW", label: "Window" },
  { value: "DOOR", label: "Door" },
  { value: "FORTOCHKA", label: "Fortochka" },
  { value: "BALCONY", label: "Balcony" },
];

const OPENING_DIRECTIONS: Array<{ value: OpeningDirection; label: string }> = [
  { value: "FIXED", label: "Fixed" },
  { value: "LEFT_HINGED", label: "Left" },
  { value: "RIGHT_HINGED", label: "Right" },
  { value: "TILT_TURN", label: "Tilt-turn" },
];

function useActiveCatalog<T>(path: string, enabled = true) {
  return useQuery({
    queryKey: ["catalog", "configurator", path],
    queryFn: () => api.get<Paginated<T>>(`${path}${path.includes("?") ? "&" : "?"}isActive=true&page=1&pageSize=100`),
    enabled,
  });
}

export default function ConfiguratorPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [productType, setProductType] = useState<ProductType>("WINDOW");
  const [widthMm, setWidthMm] = useState(1200);
  const [heightMm, setHeightMm] = useState(1200);
  const [sections, setSections] = useState(1);
  const [openingDirection, setOpeningDirection] = useState<OpeningDirection>("FIXED");
  const [brandId, setBrandId] = useState("");
  const [seriesId, setSeriesId] = useState("");
  const [profileId, setProfileId] = useState("");
  const [glassId, setGlassId] = useState("");
  const [colorId, setColorId] = useState("");
  const [accessoryIds, setAccessoryIds] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const { data: brands } = useActiveCatalog<BrandDto>("/catalog/brands");
  const { data: series } = useActiveCatalog<ProfileSeriesDto>(`/catalog/series?brandId=${brandId}`, !!brandId);
  const { data: profiles } = useActiveCatalog<ProfileDto>(`/catalog/profiles?seriesId=${seriesId}`, !!seriesId);
  const { data: glassList } = useActiveCatalog<GlassDto>("/catalog/glass");
  const { data: colorList } = useActiveCatalog<ColorDto>("/catalog/colors");
  const { data: accessoryList } = useActiveCatalog<AccessoryDto>("/catalog/accessories");
  const { data: pricing } = useQuery({
    queryKey: ["pricing-settings"],
    queryFn: () => api.get<PricingSettingsDto>("/pricing-settings"),
  });

  const selectedProfile = profiles?.items.find((p) => p.id === profileId);
  const selectedGlass = glassList?.items.find((g) => g.id === glassId);
  const selectedColor = colorList?.items.find((c) => c.id === colorId);
  const selectedAccessories = (accessoryList?.items ?? []).filter((a) => accessoryIds.includes(a.id));

  const preview = useMemo(() => {
    if (!selectedProfile || !selectedGlass || !selectedColor || !pricing) return null;
    try {
      return calculateProductConfiguration({
        productType,
        widthMm,
        heightMm,
        sections,
        quantity,
        profile: selectedProfile,
        glass: selectedGlass,
        color: selectedColor,
        accessories: selectedAccessories,
        pricing,
      });
    } catch {
      return null;
    }
  }, [productType, widthMm, heightMm, sections, quantity, selectedProfile, selectedGlass, selectedColor, selectedAccessories, pricing]);

  const createItem = useMutation({
    mutationFn: (dto: CreateOrderItemDto) => api.post(`/orders/${params.id}/items`, dto),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["orders", params.id] });
      router.push(`/orders/${params.id}`);
    },
  });

  const canSubmit = !!profileId && !!glassId && !!colorId;

  async function onSubmit() {
    setError(null);
    try {
      await createItem.mutateAsync({
        productType,
        widthMm,
        heightMm,
        sections,
        openingDirection,
        profileId,
        glassId,
        colorId,
        accessoryIds,
        quantity,
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    }
  }

  function toggleAccessory(id: string) {
    setAccessoryIds((prev) => (prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]));
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <div className="flex items-center gap-3 border-b border-border/70 bg-surface p-4 md:px-6">
        <button
          onClick={() => router.back()}
          aria-label="Back"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border/70 bg-surface"
        >
          <ArrowLeft className="h-[17px] w-[17px]" strokeWidth={2} />
        </button>
        <h1 className="text-[17px] font-bold tracking-tight">Configure product</h1>
      </div>

      <div className="flex-1 overflow-y-auto pb-4 md:grid md:grid-cols-[1fr_340px] md:gap-6 md:p-6">
        <div className="order-2 md:order-2 md:sticky md:top-6 md:h-fit">
          <div className="mx-4 mt-4 aspect-square rounded-xl border border-border/70 bg-muted/30 p-6 md:mx-0 md:mt-0">
            <ConfiguratorPreview widthMm={widthMm} heightMm={heightMm} sections={sections} openingDirection={openingDirection} />
          </div>
          <p className="mx-4 mt-2 text-center text-[11px] text-muted-foreground md:mx-0">
            {widthMm} &times; {heightMm} mm &middot; {sections} section{sections > 1 ? "s" : ""}
          </p>
        </div>

        <div className="order-1 space-y-5 p-4 md:order-1 md:p-0">
          <Section title="Product type">
            <SegmentedGroup options={PRODUCT_TYPES} value={productType} onChange={setProductType} />
          </Section>

          <Section title="Dimensions">
            <div className="grid grid-cols-2 gap-3">
              <NumberField label="Width (mm)" value={widthMm} onChange={setWidthMm} min={300} max={3000} step={10} />
              <NumberField label="Height (mm)" value={heightMm} onChange={setHeightMm} min={300} max={3000} step={10} />
            </div>
            <Stepper label="Sections" value={sections} onChange={setSections} min={1} max={6} />
          </Section>

          <Section title="Opening direction">
            <SegmentedGroup options={OPENING_DIRECTIONS} value={openingDirection} onChange={setOpeningDirection} />
          </Section>

          <Section title="Profile">
            <SelectField
              label="Brand"
              value={brandId}
              onChange={(v) => {
                setBrandId(v);
                setSeriesId("");
                setProfileId("");
              }}
              options={(brands?.items ?? []).map((b) => ({ value: b.id, label: b.name }))}
              placeholder="Select a brand…"
            />
            <SelectField
              label="Series"
              value={seriesId}
              onChange={(v) => {
                setSeriesId(v);
                setProfileId("");
              }}
              options={(series?.items ?? []).map((s) => ({ value: s.id, label: s.name }))}
              placeholder={brandId ? "Select a series…" : "Select a brand first"}
              disabled={!brandId}
            />
            <SelectField
              label="Profile"
              value={profileId}
              onChange={setProfileId}
              options={(profiles?.items ?? []).map((p) => ({
                value: p.id,
                label: `${p.name} — ${p.pricePerMeter.toLocaleString()} so'm/m`,
              }))}
              placeholder={seriesId ? "Select a profile…" : "Select a series first"}
              disabled={!seriesId}
            />
          </Section>

          <Section title="Glass">
            <SelectField
              label="Glass type"
              value={glassId}
              onChange={setGlassId}
              options={(glassList?.items ?? []).map((g) => ({
                value: g.id,
                label: `${g.name} — ${g.pricePerM2.toLocaleString()} so'm/m²`,
              }))}
              placeholder="Select glass…"
            />
          </Section>

          <Section title="Color">
            <SelectField
              label="Color"
              value={colorId}
              onChange={setColorId}
              options={(colorList?.items ?? []).map((c) => ({ value: c.id, label: c.name }))}
              placeholder="Select a color…"
            />
          </Section>

          {accessoryList && accessoryList.items.length > 0 && (
            <Section title="Accessories">
              <div className="space-y-2">
                {accessoryList.items.map((accessory) => (
                  <label
                    key={accessory.id}
                    className="flex items-center gap-3 rounded-lg border border-border/70 bg-surface p-3"
                  >
                    <input
                      type="checkbox"
                      checked={accessoryIds.includes(accessory.id)}
                      onChange={() => toggleAccessory(accessory.id)}
                      className="h-[18px] w-[18px] rounded border-border accent-primary"
                    />
                    <span className="flex-1 text-[13px] font-medium">{accessory.name}</span>
                    <span className="font-mono text-[11.5px] text-muted-foreground">
                      {accessory.price.toLocaleString()} so&#39;m
                    </span>
                  </label>
                ))}
              </div>
            </Section>
          )}

          <Section title="Quantity">
            <Stepper label="Quantity" value={quantity} onChange={setQuantity} min={1} max={50} />
          </Section>
        </div>
      </div>

      <div className="sticky bottom-0 border-t border-border/70 bg-surface p-4 md:px-6">
        <p className="mb-1 text-[10.5px] text-muted-foreground">Selling price</p>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <p className="font-mono text-xl font-bold tracking-tight">
              {preview ? `${preview.sellingPrice.toLocaleString()} so'm` : "—"}
            </p>
          </div>
          <Button onClick={onSubmit} disabled={!canSubmit || createItem.isPending} className="px-6">
            {createItem.isPending ? "Adding..." : "Add to order"}
          </Button>
        </div>
        {error && <p className="mt-2 text-sm text-danger">{error}</p>}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2.5">
      <p className="text-[12px] font-bold text-surface-foreground">{title}</p>
      {children}
    </div>
  );
}

function SegmentedGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: Array<{ value: T; label: string }>;
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            "h-9 rounded-lg px-3.5 text-[12.5px] font-semibold transition-colors",
            value === opt.value ? "bg-primary text-primary-foreground" : "border border-border/70 bg-surface text-muted-foreground",
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  step,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11.5px] font-semibold text-muted-foreground">{label}</label>
      <input
        type="number"
        inputMode="numeric"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-touch w-full rounded-lg border-[1.5px] border-input bg-surface px-3.5 font-mono text-sm focus-visible:border-ring focus-visible:outline-none"
      />
    </div>
  );
}

function Stepper({
  label,
  value,
  onChange,
  min,
  max,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border/70 bg-surface p-2.5">
      <span className="text-[12.5px] font-semibold text-muted-foreground">{label}</span>
      <div className="flex items-center gap-3">
        <button
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className="flex h-8 w-8 items-center justify-center rounded-md border border-border/70 disabled:opacity-40"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <span className="w-6 text-center font-mono text-sm font-bold">{value}</span>
        <button
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          className="flex h-8 w-8 items-center justify-center rounded-md border border-border/70 disabled:opacity-40"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
  placeholder: string;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11.5px] font-semibold text-muted-foreground">{label}</label>
      <div className="relative">
        <select
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className="h-touch w-full appearance-none rounded-lg border-[1.5px] border-input bg-surface px-3.5 pr-9 text-[13px] focus-visible:border-ring focus-visible:outline-none disabled:opacity-50"
        >
          <option value="">{placeholder}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      </div>
    </div>
  );
}
