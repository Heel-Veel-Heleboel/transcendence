-- CreateTable
CREATE TABLE "UserCredentials" (
    "user_id" INTEGER NOT NULL PRIMARY KEY,
    "hashed_password" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
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

-- CreateTable
CREATE TABLE "TwoFactorAuth" (
    "user_id" INTEGER NOT NULL PRIMARY KEY,
    "secret" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expires_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "RefreshToken_revoked_at_idx" ON "RefreshToken"("revoked_at");
