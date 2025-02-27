import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { paymentSchema } from "@/lib/validations";
import { withAuth, withValidation } from "@/lib/api-middleware";
import { ApiError } from "@/lib/api-error";
import { PaymentMethod } from "@prisma/client";
import { randomUUID } from "crypto";

interface CreatePaymentData {
  amount: number;
  paymentMethod: PaymentMethod;
  reference?: string;
  notes?: string;
  status?: string;
  transactionId: string;
  clientId?: string;
}

// GET /api/payments
export const GET = withAuth(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "10");
  const transactionId = searchParams.get("transactionId");
  const clientId = searchParams.get("clientId");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  // Using raw queries until Prisma client is regenerated
  const whereConditions: string[] = [];
  const params: (string | Date)[] = [];
  
  if (transactionId) {
    whereConditions.push(`"transactionId" = $${params.length + 1}`);
    params.push(transactionId);
  }
  
  if (clientId) {
    whereConditions.push(`"clientId" = $${params.length + 1}`);
    params.push(clientId);
  }
  
  if (startDate && endDate) {
    whereConditions.push(`"createdAt" BETWEEN $${params.length + 1} AND $${params.length + 2}`);
    params.push(new Date(startDate), new Date(endDate));
  }
  
  const whereClause = whereConditions.length > 0 
    ? `WHERE ${whereConditions.join(" AND ")}` 
    : "";

  const countQuery = `
    SELECT COUNT(*) FROM "Payment" ${whereClause}
  `;
  
  const itemsQuery = `
    SELECT 
      p.*,
      t.id as "t_id", t.type as "t_type", t.total as "t_total", t.status as "t_status",
      c.id as "c_id", c.name as "c_name"
    FROM "Payment" p
    LEFT JOIN "Transaction" t ON p."transactionId" = t.id
    LEFT JOIN "Client" c ON p."clientId" = c.id
    ${whereClause}
    ORDER BY p."createdAt" DESC
    LIMIT ${limit} OFFSET ${(page - 1) * limit}
  `;

  const [countResult, itemsResult] = await Promise.all([
    prisma.$queryRawUnsafe(countQuery, ...params),
    prisma.$queryRawUnsafe(itemsQuery, ...params),
  ]);

  const total = parseInt((countResult as Array<{count: string}>)[0].count);
  
  // Transform raw results to match expected format
  const items = (itemsResult as Array<Record<string, unknown>>).map(item => ({
    id: item.id,
    amount: item.amount,
    paymentMethod: item.paymentMethod,
    reference: item.reference,
    notes: item.notes,
    status: item.status,
    transactionId: item.transactionId,
    clientId: item.clientId,
    userId: item.userId,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    transaction: item.t_id ? {
      id: item.t_id,
      type: item.t_type,
      total: item.t_total,
      status: item.t_status,
    } : null,
    client: item.c_id ? {
      id: item.c_id,
      name: item.c_name,
    } : null,
  }));

  return {
    success: true,
    data: {
      items,
      metadata: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    },
  };
});

// POST /api/payments
export const POST = withValidation(
  paymentSchema,
  async (req: NextRequest, _, userId) => {
    const data = await req.json() as CreatePaymentData;

    // Validate transaction exists
    const transaction = await prisma.transaction.findUnique({
      where: { id: data.transactionId },
      include: {
        client: true,
      },
    });

    if (!transaction) {
      throw ApiError.NotFound("Transaction not found");
    }

    // For sale transactions, ensure client is associated
    if (transaction.type === "SALE" && !transaction.clientId) {
      throw ApiError.BadRequest("Transaction has no associated client");
    }

    // Ensure payment amount doesn't exceed remaining amount
    if (data.amount > transaction.remainingAmount) {
      throw ApiError.BadRequest(`Payment amount exceeds remaining amount (${transaction.remainingAmount})`);
    }

    // Create payment and update transaction in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the payment using raw query
      await tx.$executeRawUnsafe(`
        INSERT INTO "Payment" (
          id, amount, "paymentMethod", reference, notes, status, "transactionId", "clientId", "userId", "createdAt", "updatedAt"
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
        ) RETURNING *
      `, 
        randomUUID(),
        data.amount,
        data.paymentMethod,
        data.reference || null,
        data.notes || null,
        data.status || "COMPLETED",
        data.transactionId,
        transaction.clientId || null,
        userId,
        new Date(),
        new Date()
      );

      // Update transaction
      await tx.transaction.update({
        where: { id: data.transactionId },
        data: {
          amountPaid: {
            increment: data.amount,
          },
          remainingAmount: {
            decrement: data.amount,
          },
          // If payment completes the transaction, update status
          ...(transaction.remainingAmount - data.amount <= 0 && {
            status: "COMPLETED",
          }),
        },
      });

      // Update client if this is a sale transaction
      if (transaction.type === "SALE" && transaction.clientId) {
        await tx.client.update({
          where: { id: transaction.clientId },
          data: {
            amountPaid: {
              increment: data.amount,
            },
            balance: {
              decrement: data.amount,
            },
          },
        });
      }

      // Get the created payment with related data
      const payment = await tx.$queryRawUnsafe(`
        SELECT 
          p.*,
          t.id as "t_id", t.type as "t_type", t.total as "t_total", t.status as "t_status",
          c.id as "c_id", c.name as "c_name"
        FROM "Payment" p
        LEFT JOIN "Transaction" t ON p."transactionId" = t.id
        LEFT JOIN "Client" c ON p."clientId" = c.id
        WHERE p."transactionId" = $1
        ORDER BY p."createdAt" DESC
        LIMIT 1
      `, data.transactionId);

      const paymentData = (payment as Array<Record<string, unknown>>)[0];
      
      return {
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
    });

    return {
      success: true,
      data: result,
    };
  }
);
