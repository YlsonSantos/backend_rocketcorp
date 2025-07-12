-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_EvaluationAnswer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "evaluationId" TEXT NOT NULL,
    "criterionId" TEXT NOT NULL,
    "score" REAL NOT NULL,
    "justification" TEXT NOT NULL,
    CONSTRAINT "EvaluationAnswer_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "Evaluation" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EvaluationAnswer_criterionId_fkey" FOREIGN KEY ("criterionId") REFERENCES "EvaluationCriterion" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_EvaluationAnswer" ("criterionId", "evaluationId", "id", "justification", "score") SELECT "criterionId", "evaluationId", "id", "justification", "score" FROM "EvaluationAnswer";
DROP TABLE "EvaluationAnswer";
ALTER TABLE "new_EvaluationAnswer" RENAME TO "EvaluationAnswer";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
