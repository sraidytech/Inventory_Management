import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, RouteParams } from "@/lib/api-middleware";
import { ApiError } from "@/lib/api-error";
import { TransactionStatus, PaymentMethod, Prisma } from "@prisma/client";
import { z } from "zod";

const updateTransactionSchema = z.object({
  status: z.enum(["PENDING", "COMPLETED", "CANCELLED"]),
  amountPaid: z.number().min(0, "Amount paid must be positive").optional(),
  paymentMethod: z.enum(["CASH", "BANK_TRANSFER", "CHECK"]).optional(),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

// GET /api/transactions/[id]
export const GET = withAuth(async (req: NextRequest, params: RouteParams) => {
  const { id } = await params.params;
  const transaction = await prisma.transaction.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          product: {
            include: {
              category: true,
              supplier: true,
            },
          },
        },
      },
      client: true,
      supplier: true,
    },
  });

  if (!transaction) {
    throw ApiError.NotFound("Transaction not found");
  }

  return transaction;
});

// PUT /api/transactions/[id]
export const PUT = withAuth(async (req: NextRequest, params: RouteParams) => {
  const { id } = await params.params;
  const data = await req.json();
  
  // Validate request data
  const validationResult = updateTransactionSchema.safeParse(data);
  if (!validationResult.success) {
    throw ApiError.BadRequest("Invalid request data", {
      validation: validationResult.error.errors.map(e => e.message),
    });
  }

  // Get current transaction
  const currentTransaction = await prisma.transaction.findUnique({
    where: { id },
    include: {
      items: true,
    },
  });

  if (!currentTransaction) {
    throw ApiError.NotFound("Transaction not found");
  }

  // If transaction is already completed or cancelled, don't allow updates
  if (
    currentTransaction.status === "COMPLETED" ||
    currentTransaction.status === "CANCELLED"
  ) {
    throw ApiError.BadRequest(
      `Cannot update transaction that is already ${currentTransaction.status.toLowerCase()}`
    );
  }

  // Calculate new payment values if amountPaid is provided
  const updateData: Prisma.TransactionUpdateInput = {
    status: data.status as TransactionStatus,
    notes: data.notes,
  };

  if (data.amountPaid !== undefined) {
    updateData.amountPaid = data.amountPaid;
    updateData.remainingAmount = currentTransaction.total - data.amountPaid;
  }

  if (data.paymentMethod !== undefined) {
    updateData.paymentMethod = data.paymentMethod as PaymentMethod;
  }

  if (data.reference !== undefined) {
    updateData.reference = data.reference;
  }

  // Handle status change and payment updates
  await prisma.$transaction(async (tx) => {
    // If cancelling a transaction, restore product quantities
    if (data.status === "CANCELLED" && currentTransaction.status !== "CANCELLED") {
      // Update transaction status
      const updatedTransaction = await tx.transaction.update({
        where: { id },
        data: updateData,
      });

      // Restore product quantities
      for (const item of currentTransaction.items) {
        const quantityChange =
          currentTransaction.type === "SALE" ? item.quantity : -item.quantity;
        await tx.product.update({
          where: { id: item.productId },
          data: {
            quantity: {
              increment: quantityChange,
            },
          },
        });
      }

      // Revert client credit for sales transactions
      if (currentTransaction.type === "SALE" && currentTransaction.clientId) {
        await tx.client.update({
          where: { id: currentTransaction.clientId },
          data: {
            totalDue: { decrement: currentTransaction.total },
            amountPaid: { decrement: currentTransaction.amountPaid },
            balance: { decrement: currentTransaction.remainingAmount },
          },
        });
      }

      return updatedTransaction;
    } else {
      // Update the transaction
      const updatedTransaction = await tx.transaction.update({
        where: { id },
        data: updateData,
      });

      // Update client credit if payment amount changed for sales transactions
      if (
        data.amountPaid !== undefined &&
        currentTransaction.type === "SALE" &&
        currentTransaction.clientId
      ) {
        const amountPaidDifference = data.amountPaid - currentTransaction.amountPaid;
        const remainingAmountDifference = (currentTransaction.total - data.amountPaid) - currentTransaction.remainingAmount;

        await tx.client.update({
          where: { id: currentTransaction.clientId },
          data: {
            amountPaid: { increment: amountPaidDifference },
            balance: { increment: remainingAmountDifference },
          },
        });
      }

      return updatedTransaction;
    }
  });

  // Get updated transaction
  const updatedTransaction = await prisma.transaction.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          product: {
            include: {
              category: true,
              supplier: true,
            },
          },
        },
      },
      client: true,
      supplier: true,
    },
  });

  return updatedTransaction;
});
