-- CreateTable
CREATE TABLE "CycleNotificationSetting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cycleId" TEXT NOT NULL,
    "notificationType" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "reminderDays" INTEGER NOT NULL DEFAULT 3,
    "customMessage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CycleNotificationSetting_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "EvaluationCycle" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "CycleNotificationSetting_cycleId_idx" ON "CycleNotificationSetting"("cycleId");

-- CreateIndex
CREATE UNIQUE INDEX "CycleNotificationSetting_cycleId_notificationType_key" ON "CycleNotificationSetting"("cycleId", "notificationType");
