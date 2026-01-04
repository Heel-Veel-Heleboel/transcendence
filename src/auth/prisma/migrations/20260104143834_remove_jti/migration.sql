/*
  Warnings:

  - You are about to drop the column `jti` on the `RefreshToken` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_RefreshToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" INTEGER NOT NULL,
    "hashedToken" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiredAt" DATETIME NOT NULL,
    "revokedAt" DATETIME
);
INSERT INTO "new_RefreshToken" ("createdAt", "expiredAt", "hashedToken", "id", "revokedAt", "userId") SELECT "createdAt", "expiredAt", "hashedToken", "id", "revokedAt", "userId" FROM "RefreshToken";
DROP TABLE "RefreshToken";
ALTER TABLE "new_RefreshToken" RENAME TO "RefreshToken";
CREATE INDEX "RefreshToken_revokedAt_idx" ON "RefreshToken"("revokedAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
