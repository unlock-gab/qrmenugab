-- Phase 9: Add onboardingStep to restaurants and businessType to leads
ALTER TABLE "restaurants" ADD COLUMN IF NOT EXISTS "onboardingStep" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "businessType" TEXT;
