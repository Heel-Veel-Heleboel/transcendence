-- CreateTable
CREATE TABLE "UserCredentials" (
    "userId" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "hashedPassword" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" INTEGER NOT NULL,
    "hashedToken" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiredAt" DATETIME NOT NULL,
    "revokedAt" DATETIME NOT NULL
);
