-- CreateTable
CREATE TABLE "Trip" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Trip_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TripDay" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tripId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "dayIndex" INTEGER NOT NULL,
    "parkId" INTEGER,
    "parkName" TEXT,
    "hopping" BOOLEAN NOT NULL DEFAULT false,
    "secondParkId" INTEGER,
    "secondParkName" TEXT,
    "switchTime" TEXT,
    CONSTRAINT "TripDay_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Plan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "parkId" INTEGER NOT NULL,
    "parkName" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "inputJson" TEXT NOT NULL,
    "itineraryJson" TEXT NOT NULL,
    "summary" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "tripDayId" TEXT,
    CONSTRAINT "Plan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Plan_tripDayId_fkey" FOREIGN KEY ("tripDayId") REFERENCES "TripDay" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Plan" ("createdAt", "date", "id", "inputJson", "itineraryJson", "parkId", "parkName", "summary", "updatedAt", "userId") SELECT "createdAt", "date", "id", "inputJson", "itineraryJson", "parkId", "parkName", "summary", "updatedAt", "userId" FROM "Plan";
DROP TABLE "Plan";
ALTER TABLE "new_Plan" RENAME TO "Plan";
CREATE UNIQUE INDEX "Plan_tripDayId_key" ON "Plan"("tripDayId");
CREATE INDEX "Plan_userId_idx" ON "Plan"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Trip_userId_idx" ON "Trip"("userId");

-- CreateIndex
CREATE INDEX "TripDay_tripId_idx" ON "TripDay"("tripId");

-- CreateIndex
CREATE UNIQUE INDEX "TripDay_tripId_dayIndex_key" ON "TripDay"("tripId", "dayIndex");
