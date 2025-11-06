/*
  Warnings:

  - The primary key for the `UsageLog` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_UsageLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "apiKeyId" TEXT,
    "endpoint" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "statusCode" INTEGER NOT NULL,
    "responseTimeMs" INTEGER NOT NULL,
    "tokensUsed" INTEGER NOT NULL DEFAULT 1,
    "cost" REAL NOT NULL DEFAULT 0,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "errorMessage" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UsageLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UsageLog_apiKeyId_fkey" FOREIGN KEY ("apiKeyId") REFERENCES "ApiKey" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_UsageLog" ("apiKeyId", "cost", "endpoint", "errorMessage", "id", "ipAddress", "method", "responseTimeMs", "statusCode", "timestamp", "tokensUsed", "userAgent", "userId") SELECT "apiKeyId", "cost", "endpoint", "errorMessage", "id", "ipAddress", "method", "responseTimeMs", "statusCode", "timestamp", "tokensUsed", "userAgent", "userId" FROM "UsageLog";
DROP TABLE "UsageLog";
ALTER TABLE "new_UsageLog" RENAME TO "UsageLog";
CREATE INDEX "UsageLog_userId_idx" ON "UsageLog"("userId");
CREATE INDEX "UsageLog_apiKeyId_idx" ON "UsageLog"("apiKeyId");
CREATE INDEX "UsageLog_timestamp_idx" ON "UsageLog"("timestamp");
CREATE INDEX "UsageLog_endpoint_idx" ON "UsageLog"("endpoint");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
