import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { paymentSchema } from "@/lib/validations";
import { withAuth, withValidation, RouteParams } from "@/lib/api-middleware";
import { ApiError } from "@/lib/api-error";
import { PaymentMethod } from "@prisma/client";

interface UpdatePaymentData {
  amount?: number;
  paymentMethod?: PaymentMethod;
  reference?: string;
  notes?: string;
  status?: string;
}

// GET /api/payments/[id]
export const GET = withAuth(async (req: NextRequest, params: RouteParams) => {
  const { id } = await params.params;

  // Using raw query until Prisma client is regenerated
  const paymentQuery = `
    SELECT 
      p.*,
      t.id as "t_id", t.type as "t_type", t.total as "t_total", t.status as "t_status",
      c.id as "c_id", c.name as "c_name"
    FROM "Payment" p
    LEFT JOIN "Transaction" t ON p."transactionId" = t.id
    LEFT JOIN "Client" c ON p."clientId" = c.id
    WHERE p.id = $1
    LIMIT 1
  `;

  const payment = await prisma.$queryRawUnsafe(paymentQuery, id);
  
  if (!payment || (payment as Array<Record<string, unknown>>).length === 0) {
    throw ApiError.NotFound("Payment not found");
  }

  const paymentData = (payment as Array<Record<string, unknown>>)[0];
  
  const result = {
    id: paymentData.id,
    amount: paymentData.amount,
    paymentMethod: paymentData.paymentMethod,
    reference: paymentData.reference,
    notes: paymentData.notes,
    status: paymentData.status,
    transactionId: paymentData.transactionId,
    clientId: paymentData.clientId,
    userId: paymentData.userId,
    createdAt: paymentData.createdAt,
    updatedAt: paymentData.updatedAt,
    transaction: paymentData.t_id ? {
      id: paymentData.t_id,
      type: paymentData.t_type,
      total: paymentData.t_total,
      status: paymentData.t_status,
    } : null,
    client: paymentData.c_id ? {
      id: paymentData.c_id,
      name: paymentData.c_name,
    } : null,
  };

  return {
    success: true,
    data: result,
  };
});

// PUT /api/payments/[id]
export const PUT = withValidation(
  paymentSchema.partial(),
  async (req: NextRequest, params: RouteParams) => {
    const { id } = await params.params;
    const data = await req.json() as UpdatePaymentData;

    // Check if payment exists
    const paymentQuery = `
      SELECT * FROM "Payment" WHERE id = $1 LIMIT 1
    `;
    const existingPayment = await prisma.$queryRawUnsafe(paymentQuery, id);
    
    if (!existingPayment || (existingPayment as Array<Record<string, unknown>>).length === 0) {
      throw ApiError.NotFound("Payment not found");
    }

    const payment = (existingPayment as Array<Record<string, unknown>>)[0];
    
    // Get transaction to check remaining amount if amount is being updated
    let transaction;
    if (data.amount !== undefined && data.amount !== Number(payment.amount)) {
      transaction = await prisma.transaction.findUnique({
        where: { id: payment.transactionId as string },
      });
      
      if (!transaction) {
        throw ApiError.NotFound("Associated transaction not found");
      }
      
      // Calculate the difference in amount
      const amountDifference = data.amount - Number(payment.amount);
      
      // If increasing the amount, check if it exceeds the remaining amount
      if (amountDifference > 0 && amountDifference > transaction.remainingAmount) {
        throw ApiError.BadRequest(`Payment amount exceeds remaining amount (${transaction.remainingAmount})`);
      }
    }

    // Build update fields
    const updateFields: string[] = [];
    const updateParams: (number | string | Date | null)[] = [];
    
    if (data.amount !== undefined) {
      updateFields.push(`"amount" = $${updateParams.length + 1}`);
      updateParams.push(data.amount);
    }
    
    if (data.paymentMethod !== undefined) {
      updateFields.push(`"paymentMethod" = $${updateParams.length + 1}`);
      updateParams.push(data.paymentMethod);
    }
    
    if (data.reference !== undefined) {
      updateFields.push(`"reference" = $${updateParams.length + 1}`);
      updateParams.push(data.reference);
    }
    
    if (data.notes !== undefined) {
      updateFields.push(`"notes" = $${updateParams.length + 1}`);
      updateParams.push(data.notes);
    }
    
    if (data.status !== undefined) {
      updateFields.push(`"status" = $${updateParams.length + 1}`);
      updateParams.push(data.status);
    }
    
    updateFields.push(`"updatedAt" = $${updateParams.length + 1}`);
    updateParams.push(new Date());
    
    // Add id as the last parameter
    updateParams.push(id);

    // Update payment and related records in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update the payment
      const updateQuery = `
        UPDATE "Payment"
        SET ${updateFields.join(", ")}
        WHERE id = $${updateParams.length}
        RETURNING *
      `;
      
      await tx.$queryRawUnsafe(updateQuery, ...updateParams);
      
      // If amount was changed, update transaction and client
      if (data.amount !== undefined && data.amount !== Number(payment.amount)) {
        const amountDifference = data.amount - Number(payment.amount);
        
        // Update transaction
        await tx.transaction.update({
          where: { id: payment.transactionId as string },
          data: {
            amountPaid: {
              increment: amountDifference,
            },
            remainingAmount: {
              decrement: amountDifference,
            },
          },
        });
        
        // Update client if this payment is associated with a client
        if (payment.clientId) {
          await tx.client.update({
            where: { id: payment.clientId as string },
            data: {
              amountPaid: {
                increment: amountDifference,
              },
              balance: {
                decrement: amountDifference,
              },
            },
          });
        }
      }
      
      // Get the updated payment with related data
      const fullPaymentQuery = `
        SELECT 
          p.*,
          t.id as "t_id", t.type as "t_type", t.total as "t_total", t.status as "t_status",
          c.id as "c_id", c.name as "c_name"
        FROM "Payment" p
        LEFT JOIN "Transaction" t ON p."transactionId" = t.id
        LEFT JOIN "Client" c ON p."clientId" = c.id
        WHERE p.id = $1
        LIMIT 1
      `;
      
      const fullPayment = await tx.$queryRawUnsafe(fullPaymentQuery, id);
      const fullPaymentData = (fullPayment as Array<Record<string, unknown>>)[0];
      
      return {
        id: fullPaymentData.id,
        amount: fullPaymentData.amount,
        paymentMethod: fullPaymentData.paymentMethod,
        reference: fullPaymentData.reference,
        notes: fullPaymentData.notes,
        status: fullPaymentData.status,
        transactionId: fullPaymentData.transactionId,
        clientId: fullPaymentData.clientId,
        userId: fullPaymentData.userId,
        createdAt: fullPaymentData.createdAt,
        updatedAt: fullPaymentData.updatedAt,
        transaction: fullPaymentData.t_id ? {
          id: fullPaymentData.t_id,
          type: fullPaymentData.t_type,
          total: fullPaymentData.t_total,
          status: fullPaymentData.t_status,
        } : null,
        client: fullPaymentData.c_id ? {
          id: fullPaymentData.c_id,
          name: fullPaymentData.c_name,
        } : null,
      };
    });

    return {
      success: true,
      data: result,
    };
  }
);

// DELETE /api/payments/[id]
export const DELETE = withAuth(async (req: NextRequest, params: RouteParams) => {
  const { id } = await params.params;

  // Check if payment exists
  const paymentQuery = `
    SELECT * FROM "Payment" WHERE id = $1 LIMIT 1
  `;
  const existingPayment = await prisma.$queryRawUnsafe(paymentQuery, id);
  
  if (!existingPayment || (existingPayment as Array<Record<string, unknown>>).length === 0) {
    throw ApiError.NotFound("Payment not found");
  }

  const payment = (existingPayment as Array<Record<string, unknown>>)[0];

  // Delete payment and update related records in a transaction
  await prisma.$transaction(async (tx) => {
    // Delete the payment
    await tx.$executeRawUnsafe(`DELETE FROM "Payment" WHERE id = $1`, id);
    
    // Update transaction
    await tx.transaction.update({
      where: { id: payment.transactionId as string },
      data: {
        amountPaid: {
          decrement: Number(payment.amount),
        },
        remainingAmount: {
          increment: Number(payment.amount),
        },
      },
    });
    
    // Update client if this payment is associated with a client
    if (payment.clientId) {
      await tx.client.update({
        where: { id: payment.clientId as string },
        data: {
          amountPaid: {
            decrement: Number(payment.amount),
          },
          balance: {
            increment: Number(payment.amount),
          },
        },
      });
    }
  });

  return {
    success: true,
    message: "Payment deleted successfully",
  };
});
