-- DropIndex
DROP INDEX "Product_sku_key";

-- First add nullable userId columns
ALTER TABLE "Category" ADD COLUMN "userId" TEXT;
ALTER TABLE "Product" ADD COLUMN "userId" TEXT;
ALTER TABLE "Supplier" ADD COLUMN "userId" TEXT;

-- Set a default userId for existing records
UPDATE "Category" SET "userId" = 'default-user';
UPDATE "Product" SET "userId" = 'default-user';
UPDATE "Supplier" SET "userId" = 'default-user';

-- Make userId columns non-nullable
ALTER TABLE "Category" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "Product" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "Supplier" ALTER COLUMN "userId" SET NOT NULL;

-- Create unique indexes
CREATE UNIQUE INDEX "Category_name_userId_key" ON "Category"("name", "userId");
CREATE UNIQUE INDEX "Product_sku_userId_key" ON "Product"("sku", "userId");
CREATE UNIQUE INDEX "Supplier_email_userId_key" ON "Supplier"("email", "userId");
