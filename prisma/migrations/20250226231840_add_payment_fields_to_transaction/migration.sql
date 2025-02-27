-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'BANK_TRANSFER', 'CHECK');

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "amountPaid" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "paymentMethod" "PaymentMethod",
ADD COLUMN     "reference" TEXT,
ADD COLUMN     "remainingAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "supplierId" TEXT;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;
