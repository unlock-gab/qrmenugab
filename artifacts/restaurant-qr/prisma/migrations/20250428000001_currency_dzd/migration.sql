-- Change default currency from USD to DZD and update existing records
ALTER TABLE "restaurants" ALTER COLUMN "currency" SET DEFAULT 'DZD';
UPDATE "restaurants" SET "currency" = 'DZD' WHERE "currency" = 'USD';
