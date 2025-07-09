/*
  Warnings:

  - Added the required column `active` to the `Survey` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Survey" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cycleId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" DATETIME NOT NULL,
    "active" BOOLEAN NOT NULL,
    CONSTRAINT "Survey_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "EvaluationCycle" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Survey" ("createdAt", "cycleId", "description", "endDate", "id", "title") SELECT "createdAt", "cycleId", "description", "endDate", "id", "title" FROM "Survey";
DROP TABLE "Survey";
ALTER TABLE "new_Survey" RENAME TO "Survey";
CREATE INDEX "Survey_cycleId_idx" ON "Survey"("cycleId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
