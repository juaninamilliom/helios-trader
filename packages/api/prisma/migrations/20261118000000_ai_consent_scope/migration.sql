-- Existing boolean consent is deliberately not expanded to new recipients/models.
ALTER TABLE "FinancePreference" ADD COLUMN "aiConsentScope" TEXT;
