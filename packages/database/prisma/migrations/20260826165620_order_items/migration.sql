-- CreateEnum
CREATE TYPE "OpeningDirection" AS ENUM ('FIXED', 'LEFT_HINGED', 'RIGHT_HINGED', 'TILT_TURN');

-- CreateTable
CREATE TABLE "order_items" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productType" TEXT NOT NULL,
    "widthMm" INTEGER NOT NULL,
    "heightMm" INTEGER NOT NULL,
    "sections" INTEGER NOT NULL,
    "openingDirection" "OpeningDirection" NOT NULL,
    "profileId" TEXT NOT NULL,
    "glassId" TEXT NOT NULL,
    "colorId" TEXT NOT NULL,
    "accessoryIds" JSONB NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "materialCost" INTEGER NOT NULL,
    "laborCost" INTEGER NOT NULL,
    "additionalCost" INTEGER NOT NULL,
    "totalCost" INTEGER NOT NULL,
    "margin" INTEGER NOT NULL,
    "sellingPrice" INTEGER NOT NULL,
    "bom" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "order_items_orderId_idx" ON "order_items"("orderId");

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_glassId_fkey" FOREIGN KEY ("glassId") REFERENCES "glasses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_colorId_fkey" FOREIGN KEY ("colorId") REFERENCES "colors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
