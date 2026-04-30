-- CreateTable
CREATE TABLE "Tournament" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "gameMode" TEXT NOT NULL DEFAULT 'classic',
    "minPlayers" INTEGER NOT NULL DEFAULT 2,
    "maxPlayers" INTEGER NOT NULL DEFAULT 8,
    "matchDurationMin" INTEGER NOT NULL DEFAULT 3,
    "ackDeadlineMin" INTEGER NOT NULL DEFAULT 20,
    "createdBy" INTEGER NOT NULL,
    "createdByUserName" TEXT NOT NULL,
    "registrationStart" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "registrationEnd" DATETIME NOT NULL,
    "startTime" DATETIME,
    "endTime" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'REGISTRATION',
    "totalRounds" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "TournamentParticipant" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tournamentId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "username" TEXT NOT NULL,
    "registeredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "seed" INTEGER,
    "eliminatedIn" INTEGER,
    "finalRank" INTEGER,
    CONSTRAINT "TournamentParticipant_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tournamentId" INTEGER,
    "gameMode" TEXT NOT NULL DEFAULT 'classic',
    "player1Id" INTEGER NOT NULL,
    "player2Id" INTEGER NOT NULL,
    "player1Username" TEXT NOT NULL,
    "player2Username" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING_ACKNOWLEDGEMENT',
    "scheduledAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deadline" DATETIME,
    "player1Acknowledged" BOOLEAN NOT NULL DEFAULT false,
    "player2Acknowledged" BOOLEAN NOT NULL DEFAULT false,
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    "winnerId" INTEGER,
    "player1Score" INTEGER,
    "player2Score" INTEGER,
    "gameSessionId" TEXT,
    "resultSource" TEXT,
    "round" INTEGER,
    "bracketPosition" INTEGER,
    CONSTRAINT "Match_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Tournament_status_idx" ON "Tournament"("status");

-- CreateIndex
CREATE INDEX "Tournament_registrationEnd_idx" ON "Tournament"("registrationEnd");

-- CreateIndex
CREATE INDEX "Tournament_createdBy_idx" ON "Tournament"("createdBy");

-- CreateIndex
CREATE UNIQUE INDEX "TournamentParticipant_tournamentId_userId_key" ON "TournamentParticipant"("tournamentId", "userId");

-- CreateIndex
CREATE INDEX "TournamentParticipant_tournamentId_idx" ON "TournamentParticipant"("tournamentId");

-- CreateIndex
CREATE INDEX "TournamentParticipant_userId_idx" ON "TournamentParticipant"("userId");

-- CreateIndex
CREATE INDEX "Match_tournamentId_idx" ON "Match"("tournamentId");

-- CreateIndex
CREATE INDEX "Match_player1Id_idx" ON "Match"("player1Id");

-- CreateIndex
CREATE INDEX "Match_player2Id_idx" ON "Match"("player2Id");

-- CreateIndex
CREATE INDEX "Match_status_idx" ON "Match"("status");

-- CreateIndex
CREATE INDEX "Match_deadline_idx" ON "Match"("deadline");

-- CreateIndex
CREATE INDEX "Match_gameSessionId_idx" ON "Match"("gameSessionId");

-- CreateIndex
CREATE INDEX "Match_gameMode_idx" ON "Match"("gameMode");
