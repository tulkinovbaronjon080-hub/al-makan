-- CreateEnum
CREATE TYPE "ProductionStage" AS ENUM ('QUEUED', 'CUTTING', 'ASSEMBLY', 'GLAZING', 'QUALITY_CHECK', 'DONE');

-- CreateTable
CREATE TABLE "production_tasks" (
    "id" TEXT NOT NULL,
    "orderItemId" TEXT NOT NULL,
    "stage" "ProductionStage" NOT NULL DEFAULT 'QUEUED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "production_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "production_task_stage_history" (
    "id" TEXT NOT NULL,
    "productionTaskId" TEXT NOT NULL,
    "stage" "ProductionStage" NOT NULL,
    "changedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "production_task_stage_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "production_tasks_orderItemId_key" ON "production_tasks"("orderItemId");

-- CreateIndex
CREATE INDEX "production_task_stage_history_productionTaskId_idx" ON "production_task_stage_history"("productionTaskId");

-- AddForeignKey
ALTER TABLE "production_tasks" ADD CONSTRAINT "production_tasks_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "order_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_task_stage_history" ADD CONSTRAINT "production_task_stage_history_productionTaskId_fkey" FOREIGN KEY ("productionTaskId") REFERENCES "production_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_task_stage_history" ADD CONSTRAINT "production_task_stage_history_changedByUserId_fkey" FOREIGN KEY ("changedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
