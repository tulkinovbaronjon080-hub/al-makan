"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { cn } from "@al-makan/ui";
import { CatalogPriceList } from "@/components/catalog-price-list";
import { BrandsSection } from "./brands-section";

const TABS = ["brands", "glass", "colors", "accessories"] as const;
type Tab = (typeof TABS)[number];

const TAB_LABELS: Record<Tab, string> = {
  brands: "Brands",
  glass: "Glass",
  colors: "Colors",
  accessories: "Accessories",
};

export default function CatalogSettingsPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("brands");

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
        <h1 className="text-[17px] font-bold tracking-tight">Catalog settings</h1>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
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

      {tab === "brands" && <BrandsSection />}
      {tab === "glass" && (
        <CatalogPriceList apiPath="/catalog/glass" priceField="pricePerM2" unitLabel="/ m²" namePlaceholder="e.g. 4mm tempered" />
      )}
      {tab === "colors" && (
        <CatalogPriceList
          apiPath="/catalog/colors"
          priceField="surchargePerMeter"
          unitLabel="/ m surcharge"
          namePlaceholder="e.g. White"
        />
      )}
      {tab === "accessories" && (
        <CatalogPriceList apiPath="/catalog/accessories" priceField="price" unitLabel="/ pc" namePlaceholder="e.g. Handle - white" />
      )}
    </div>
  );
}
