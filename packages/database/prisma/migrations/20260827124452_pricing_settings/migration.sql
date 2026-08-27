-- CreateTable
CREATE TABLE "pricing_settings" (
    "businessId" TEXT NOT NULL,
    "laborRatePerMeter" INTEGER NOT NULL DEFAULT 15000,
    "sealPricePerMeter" INTEGER NOT NULL DEFAULT 3000,
    "marginPercent" INTEGER NOT NULL DEFAULT 25,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pricing_settings_pkey" PRIMARY KEY ("businessId")
);

-- AddForeignKey
ALTER TABLE "pricing_settings" ADD CONSTRAINT "pricing_settings_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
