-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "ShiftKind" AS ENUM ('WORKING', 'CLOSED', 'UNAVAILABLE', 'HOLIDAY');

-- CreateEnum
CREATE TYPE "StockLevel" AS ENUM ('LOW', 'OUT');

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsOnEntry" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "schedule" TEXT NOT NULL,
    "date" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsOnEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffMember" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "pinLookup" TEXT,
    "pinHash" TEXT,
    "pinSetAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaffMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffPinThrottle" (
    "slug" TEXT NOT NULL,
    "failures" INTEGER NOT NULL DEFAULT 0,
    "lastFailAt" TIMESTAMP(3),
    "lockedUntil" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaffPinThrottle_pkey" PRIMARY KEY ("slug")
);

-- CreateTable
CREATE TABLE "Shift" (
    "id" TEXT NOT NULL,
    "staffMemberId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "kind" "ShiftKind" NOT NULL DEFAULT 'WORKING',
    "startMinutes" INTEGER,
    "endMinutes" INTEGER,
    "holidayEnd" DATE,
    "slot" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shift_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DayNote" (
    "date" DATE NOT NULL,
    "note" TEXT NOT NULL,

    CONSTRAINT "DayNote_pkey" PRIMARY KEY ("date")
);

-- CreateTable
CREATE TABLE "ChecklistItem" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChecklistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChecklistRun" (
    "businessDate" DATE NOT NULL,
    "submittedAt" TIMESTAMP(3),
    "submittedById" TEXT,
    "reopenedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChecklistRun_pkey" PRIMARY KEY ("businessDate")
);

-- CreateTable
CREATE TABLE "ChecklistCheck" (
    "id" TEXT NOT NULL,
    "runDate" DATE NOT NULL,
    "itemId" TEXT NOT NULL,
    "checkedById" TEXT NOT NULL,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,

    CONSTRAINT "ChecklistCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockReport" (
    "id" TEXT NOT NULL,
    "itemId" TEXT,
    "freeText" TEXT,
    "level" "StockLevel" NOT NULL,
    "note" TEXT,
    "reportedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "resolvedById" TEXT,

    CONSTRAINT "StockReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimeEntry" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "clockInAt" TIMESTAMP(3) NOT NULL,
    "clockOutAt" TIMESTAMP(3),
    "autoClosed" BOOLEAN NOT NULL DEFAULT false,
    "adminEdited" BOOLEAN NOT NULL DEFAULT false,
    "note" TEXT,

    CONSTRAINT "TimeEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PushSubscription" (
    "id" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "label" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSentAt" TIMESTAMP(3),

    CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Setting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");

-- CreateIndex
CREATE INDEX "WhatsOnEntry_active_sortOrder_idx" ON "WhatsOnEntry"("active", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "StaffMember_pinLookup_key" ON "StaffMember"("pinLookup");

-- CreateIndex
CREATE INDEX "StaffMember_active_sortOrder_idx" ON "StaffMember"("active", "sortOrder");

-- CreateIndex
CREATE INDEX "Shift_date_idx" ON "Shift"("date");

-- CreateIndex
CREATE INDEX "Shift_staffMemberId_date_idx" ON "Shift"("staffMemberId", "date");

-- CreateIndex
CREATE INDEX "ChecklistItem_active_sortOrder_idx" ON "ChecklistItem"("active", "sortOrder");

-- CreateIndex
CREATE INDEX "ChecklistRun_submittedAt_idx" ON "ChecklistRun"("submittedAt");

-- CreateIndex
CREATE INDEX "ChecklistCheck_runDate_idx" ON "ChecklistCheck"("runDate");

-- CreateIndex
CREATE UNIQUE INDEX "ChecklistCheck_runDate_itemId_key" ON "ChecklistCheck"("runDate", "itemId");

-- CreateIndex
CREATE INDEX "StockItem_active_sortOrder_idx" ON "StockItem"("active", "sortOrder");

-- CreateIndex
CREATE INDEX "StockReport_resolvedAt_createdAt_idx" ON "StockReport"("resolvedAt", "createdAt");

-- CreateIndex
CREATE INDEX "StockReport_itemId_resolvedAt_idx" ON "StockReport"("itemId", "resolvedAt");

-- CreateIndex
CREATE INDEX "TimeEntry_staffId_clockInAt_idx" ON "TimeEntry"("staffId", "clockInAt");

-- CreateIndex
CREATE INDEX "TimeEntry_clockOutAt_idx" ON "TimeEntry"("clockOutAt");

-- CreateIndex
CREATE UNIQUE INDEX "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");

-- AddForeignKey
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_staffMemberId_fkey" FOREIGN KEY ("staffMemberId") REFERENCES "StaffMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistRun" ADD CONSTRAINT "ChecklistRun_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "StaffMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistCheck" ADD CONSTRAINT "ChecklistCheck_runDate_fkey" FOREIGN KEY ("runDate") REFERENCES "ChecklistRun"("businessDate") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistCheck" ADD CONSTRAINT "ChecklistCheck_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "ChecklistItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistCheck" ADD CONSTRAINT "ChecklistCheck_checkedById_fkey" FOREIGN KEY ("checkedById") REFERENCES "StaffMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockReport" ADD CONSTRAINT "StockReport_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "StockItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockReport" ADD CONSTRAINT "StockReport_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "StaffMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockReport" ADD CONSTRAINT "StockReport_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeEntry" ADD CONSTRAINT "TimeEntry_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "StaffMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

