/*
  Warnings:

  - You are about to drop the column `notifications` on the `UserSettings` table. All the data in the column will be lost.
  - Made the column `description` on table `Product` required. This step will fail if there are existing NULL values in that column.
  - Made the column `phone` on table `Supplier` required. This step will fail if there are existing NULL values in that column.
  - Made the column `address` on table `Supplier` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "Unit" AS ENUM ('KG', 'GRAM', 'PIECE');

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "unit" "Unit" NOT NULL DEFAULT 'PIECE',
ALTER COLUMN "description" SET NOT NULL,
ALTER COLUMN "quantity" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "minQuantity" DROP DEFAULT,
ALTER COLUMN "minQuantity" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Supplier" ALTER COLUMN "phone" SET NOT NULL,
ALTER COLUMN "address" SET NOT NULL;

-- AlterTable
ALTER TABLE "TransactionItem" ALTER COLUMN "quantity" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "UserSettings" DROP COLUMN "notifications";
