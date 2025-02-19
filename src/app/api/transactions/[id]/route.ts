import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/api-middleware";
import { ApiError } from "@/lib/api-error";
import { TransactionStatus } from "@prisma/client";
import { z } from "zod";

const updateTransactionSchema = z.object({
  status: z.enum(["PENDING", "COMPLETED", "CANCELLED"]),
  notes: z.string().optional(),
});

// GET /api/transactions/[id]
export const GET = withAuth(async (req: NextRequest, params: Record<string, string>) => {
  const transaction = await prisma.transaction.findUnique({
    where: { id: params.id },
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
    },
  });

  if (!transaction) {
    throw ApiError.NotFound("Transaction not found");
  }

  return transaction;
});

// PUT /api/transactions/[id]
export const PUT = withAuth(async (req: NextRequest, params: Record<string, string>) => {
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
    where: { id: params.id },
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

  // Handle status change
  if (data.status !== currentTransaction.status) {
    // If cancelling a transaction, restore product quantities
    if (data.status === "CANCELLED") {
      await prisma.$transaction(async (tx) => {
        // Update transaction status
        const updatedTransaction = await tx.transaction.update({
          where: { id: params.id },
          data: {
            status: data.status as TransactionStatus,
            notes: data.notes,
          },
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
          },
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

        return updatedTransaction;
      });
    } else {
      // Just update the status
      await prisma.transaction.update({
        where: { id: params.id },
        data: {
          status: data.status as TransactionStatus,
          notes: data.notes,
        },
      });
    }
  }

  // Get updated transaction
  const updatedTransaction = await prisma.transaction.findUnique({
    where: { id: params.id },
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
    },
  });

  return updatedTransaction;
});
