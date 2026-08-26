-- CreateTable
CREATE TABLE "brands" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "brands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profile_series" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profile_series_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profiles" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "seriesId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "pricePerMeter" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "glasses" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "pricePerM2" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "glasses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "colors" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "surchargePerMeter" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "colors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accessories" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accessories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "brands_businessId_idx" ON "brands"("businessId");

-- CreateIndex
CREATE UNIQUE INDEX "brands_businessId_name_key" ON "brands"("businessId", "name");

-- CreateIndex
CREATE INDEX "profile_series_businessId_idx" ON "profile_series"("businessId");

-- CreateIndex
CREATE UNIQUE INDEX "profile_series_brandId_name_key" ON "profile_series"("brandId", "name");

-- CreateIndex
CREATE INDEX "profiles_businessId_idx" ON "profiles"("businessId");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_seriesId_name_key" ON "profiles"("seriesId", "name");

-- CreateIndex
CREATE INDEX "glasses_businessId_idx" ON "glasses"("businessId");

-- CreateIndex
CREATE UNIQUE INDEX "glasses_businessId_name_key" ON "glasses"("businessId", "name");

-- CreateIndex
CREATE INDEX "colors_businessId_idx" ON "colors"("businessId");

-- CreateIndex
CREATE UNIQUE INDEX "colors_businessId_name_key" ON "colors"("businessId", "name");

-- CreateIndex
CREATE INDEX "accessories_businessId_idx" ON "accessories"("businessId");

-- CreateIndex
CREATE UNIQUE INDEX "accessories_businessId_name_key" ON "accessories"("businessId", "name");

-- AddForeignKey
ALTER TABLE "brands" ADD CONSTRAINT "brands_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_series" ADD CONSTRAINT "profile_series_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_series" ADD CONSTRAINT "profile_series_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "profile_series"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "glasses" ADD CONSTRAINT "glasses_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "colors" ADD CONSTRAINT "colors_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accessories" ADD CONSTRAINT "accessories_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
