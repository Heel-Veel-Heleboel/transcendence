-- CreateTable
CREATE TABLE "UserCredentials" (
    "user_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "hashed_password" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" INTEGER NOT NULL,
    "hashed_token" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expired_at" DATETIME NOT NULL,
    "revoked_at" DATETIME
);

-- CreateIndex
CREATE INDEX "RefreshToken_revoked_at_idx" ON "RefreshToken"("revoked_at");
