"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { PRODUCTION_STAGE_SEQUENCE, type MaterialRequirementDto, type ProductionQueueItemDto } from "@al-makan/types";
import { Button, Card, EmptyState, ProductionStageBadge, cn } from "@al-makan/ui";
import { api } from "@/lib/api/client";

const TABS = ["queue", "materials"] as const;
type Tab = (typeof TABS)[number];
const TAB_LABELS: Record<Tab, string> = { queue: "Queue", materials: "Materials" };

export default function ProductionPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("queue");

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
        <h1 className="text-[17px] font-bold tracking-tight">Production</h1>
      </div>

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

      {tab === "queue" && <QueueTab />}
      {tab === "materials" && <MaterialsTab />}
    </div>
  );
}

function QueueTab() {
  const queryClient = useQueryClient();
  const queryKey = ["production", "queue"];
  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () => api.get<ProductionQueueItemDto[]>("/production/queue"),
  });

  const advance = useMutation({
    mutationFn: ({ taskId, stage }: { taskId: string; stage: string }) =>
      api.patch(`/production/tasks/${taskId}/stage`, { stage }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey });
      await queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }
  if (!data || data.length === 0) {
    return <EmptyState title="No active production tasks" description="Confirmed orders you start will show up here." />;
  }

  return (
    <div className="space-y-2">
      {data.map((task) => {
        const nextStage = PRODUCTION_STAGE_SEQUENCE[PRODUCTION_STAGE_SEQUENCE.indexOf(task.stage) + 1];
        return (
          <Card key={task.taskId} className="border border-border/70 p-3.5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-mono text-[13px] font-bold">
                  #{task.orderNumber} &middot; {task.customerName}
                </p>
                <p className="mt-0.5 text-[11.5px] text-muted-foreground">
                  {task.productType} — {task.widthMm}&times;{task.heightMm} mm &middot; &times;{task.quantity}
                </p>
                <ProductionStageBadge stage={task.stage} className="mt-2" />
              </div>
              {nextStage && (
                <Button
                  size="sm"
                  disabled={advance.isPending}
                  onClick={() => advance.mutate({ taskId: task.taskId, stage: nextStage })}
                >
                  Mark as {nextStage.replace("_", " ")}
                </Button>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function MaterialsTab() {
  const { data, isLoading } = useQuery({
    queryKey: ["production", "materials"],
    queryFn: () => api.get<MaterialRequirementDto[]>("/production/materials"),
  });

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }
  if (!data || data.length === 0) {
    return <EmptyState title="Nothing needed right now" description="Materials for active production tasks will show up here." />;
  }

  return (
    <Card className="divide-y divide-border/60 border border-border/70">
      {data.map((line) => (
        <div key={line.materialId} className="flex items-center justify-between px-4 py-3">
          <span className="text-[13px] font-semibold">{line.label}</span>
          <span className="font-mono text-[13px] font-bold text-primary">
            {line.unit === "PCS" ? line.quantity : line.quantity.toFixed(2)} {line.unit === "PCS" ? "pc" : line.unit.toLowerCase()}
          </span>
        </div>
      ))}
    </Card>
  );
}
