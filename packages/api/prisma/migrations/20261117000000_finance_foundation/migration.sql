-- CreateTable
CREATE TABLE "FinanceConnection" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "itemId" TEXT NOT NULL,
    "encryptedToken" TEXT NOT NULL,
    "institution" TEXT NOT NULL,
    "environment" TEXT NOT NULL,
    "cursor" TEXT,
    "status" TEXT NOT NULL DEFAULT 'connected',
    "syncedAt" TIMESTAMP(3),
    "attemptedAt" TIMESTAMP(3),
    "leaseUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FinanceConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinanceAccount" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mask" TEXT,
    "type" TEXT NOT NULL,
    "subtype" TEXT,
    "currency" TEXT,
    "currentCents" BIGINT,
    "availableCents" BIGINT,
    "balanceAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinanceAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinanceTransaction" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "merchant" TEXT NOT NULL,
    "amountCents" BIGINT NOT NULL,
    "currency" TEXT,
    "pending" BOOLEAN NOT NULL,
    "pendingId" TEXT,
    "removed" BOOLEAN NOT NULL DEFAULT false,
    "category" TEXT NOT NULL,
    "categorySource" TEXT NOT NULL,
    "confidence" TEXT NOT NULL,
    "accounting" TEXT NOT NULL,
    "correctedCategory" TEXT,
    "model" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinanceTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinanceSession" (
    "id" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinanceSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancePreference" (
    "userId" INTEGER NOT NULL,
    "aiConsent" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinancePreference_pkey" PRIMARY KEY ("userId")
);

-- CreateIndex
CREATE UNIQUE INDEX "FinanceConnection_itemId_key" ON "FinanceConnection"("itemId");

-- CreateIndex
CREATE INDEX "FinanceConnection_userId_idx" ON "FinanceConnection"("userId");

-- CreateIndex
CREATE INDEX "FinanceAccount_connectionId_idx" ON "FinanceAccount"("connectionId");

-- CreateIndex
CREATE INDEX "FinanceTransaction_connectionId_date_idx" ON "FinanceTransaction"("connectionId", "date");

-- AddForeignKey
ALTER TABLE "FinanceConnection" ADD CONSTRAINT "FinanceConnection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceAccount" ADD CONSTRAINT "FinanceAccount_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "FinanceConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceTransaction" ADD CONSTRAINT "FinanceTransaction_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "FinanceConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancePreference" ADD CONSTRAINT "FinancePreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

