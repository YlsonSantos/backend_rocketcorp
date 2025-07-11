-- CreateTable
CREATE TABLE "NextCycleCriterion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "NextCycleCriterionPosition" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nextCycleCriterionId" TEXT NOT NULL,
    "positionId" TEXT NOT NULL,
    CONSTRAINT "NextCycleCriterionPosition_nextCycleCriterionId_fkey" FOREIGN KEY ("nextCycleCriterionId") REFERENCES "NextCycleCriterion" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "NextCycleCriterionPosition_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "Position" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "NextCycleCriterionPosition_nextCycleCriterionId_positionId_key" ON "NextCycleCriterionPosition"("nextCycleCriterionId", "positionId");
