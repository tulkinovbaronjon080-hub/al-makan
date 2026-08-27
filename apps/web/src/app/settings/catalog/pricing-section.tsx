"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PricingSettingsDto, UpdatePricingSettingsDto } from "@al-makan/types";
import { Button, Card, Input } from "@al-makan/ui";
import { api, ApiError } from "@/lib/api/client";

/** Replaces the hard-coded labor/margin/seal rates the Phase 0-4 placeholder used — every business tunes its own. */
export function PricingSection() {
  const queryClient = useQueryClient();
  const queryKey = ["pricing-settings"];
  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () => api.get<PricingSettingsDto>("/pricing-settings"),
  });

  const [laborRatePerMeter, setLaborRatePerMeter] = useState("");
  const [sealPricePerMeter, setSealPricePerMeter] = useState("");
  const [marginPercent, setMarginPercent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!data) return;
    setLaborRatePerMeter(String(data.laborRatePerMeter));
    setSealPricePerMeter(String(data.sealPricePerMeter));
    setMarginPercent(String(data.marginPercent));
  }, [data]);

  const update = useMutation({
    mutationFn: (dto: UpdatePricingSettingsDto) => api.patch<PricingSettingsDto>("/pricing-settings", dto),
    onSuccess: async (updated) => {
      queryClient.setQueryData(queryKey, updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  async function onSave() {
    setError(null);
    try {
      await update.mutateAsync({
        laborRatePerMeter: Number(laborRatePerMeter),
        sealPricePerMeter: Number(sealPricePerMeter),
        marginPercent: Number(marginPercent),
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    }
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  return (
    <Card className="space-y-4 border border-border/70 p-4">
      <div className="space-y-1.5">
        <label className="text-[12.5px] font-semibold">Labor rate (UZS / meter of profile)</label>
        <Input type="number" inputMode="numeric" value={laborRatePerMeter} onChange={(e) => setLaborRatePerMeter(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <label className="text-[12.5px] font-semibold">Seal/rubber rate (UZS / meter of profile)</label>
        <Input type="number" inputMode="numeric" value={sealPricePerMeter} onChange={(e) => setSealPricePerMeter(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <label className="text-[12.5px] font-semibold">Margin (%)</label>
        <Input type="number" inputMode="numeric" value={marginPercent} onChange={(e) => setMarginPercent(e.target.value)} />
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
      <Button className="w-full" onClick={onSave} disabled={update.isPending}>
        {update.isPending ? "Saving..." : saved ? "Saved" : "Save"}
      </Button>
      <p className="text-[11px] text-muted-foreground">
        Applies to every product configured after saving — existing order items keep their original price.
      </p>
    </Card>
  );
}
