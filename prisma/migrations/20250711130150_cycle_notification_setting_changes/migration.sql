-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CycleNotificationSetting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cycleId" TEXT NOT NULL,
    "notificationType" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "reminderDays" INTEGER NOT NULL DEFAULT 3,
    "customMessage" TEXT,
    "scheduledTime" TEXT,
    "frequency" TEXT,
    "weekDay" TEXT,
    "userFilters" JSONB,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CycleNotificationSetting_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "EvaluationCycle" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_CycleNotificationSetting" ("createdAt", "customMessage", "cycleId", "enabled", "id", "notificationType", "reminderDays", "updatedAt") SELECT "createdAt", "customMessage", "cycleId", "enabled", "id", "notificationType", "reminderDays", "updatedAt" FROM "CycleNotificationSetting";
DROP TABLE "CycleNotificationSetting";
ALTER TABLE "new_CycleNotificationSetting" RENAME TO "CycleNotificationSetting";
CREATE INDEX "CycleNotificationSetting_cycleId_idx" ON "CycleNotificationSetting"("cycleId");
CREATE UNIQUE INDEX "CycleNotificationSetting_cycleId_notificationType_key" ON "CycleNotificationSetting"("cycleId", "notificationType");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
