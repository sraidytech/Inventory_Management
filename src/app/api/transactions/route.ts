import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { transactionFormSchema } from "@/lib/validations";
import { withAuth, withValidation } from "@/lib/api-middleware";
import { ApiError } from "@/lib/api-error";
import { Prisma, TransactionType, TransactionStatus, PaymentMethod } from "@prisma/client";

interface TransactionItem {
  productId: string;
  quantity: number;
  price: number;
}

interface CreateTransactionData {
  type: TransactionType;
  status: TransactionStatus;
  total: number;
  amountPaid?: number;
  remainingAmount?: number;
  paymentMethod?: string;
  reference?: string;
  notes?: string;
  paymentDueDate?: Date;
  clientId?: string;
  supplierId?: string;
  items: TransactionItem[];
}

// GET /api/transactions
export const GET = withAuth(async (req: NextRequest, _, userId) => {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "10");
  const type = searchParams.get("type") as TransactionType | null;
  const status = searchParams.get("status") as TransactionStatus | null;
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  const where: Prisma.TransactionWhereInput = {
    userId, // Filter transactions by user
    ...(type && { type }),
    ...(status && { status }),
    ...(startDate && endDate && {
      createdAt: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
    }),
  };

  const [total, items] = await Promise.all([
    prisma.transaction.count({ where }),
    prisma.transaction.findMany({
      where,
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
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return {
    items,
    metadata: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
});

// POST /api/transactions
export const POST = withValidation(
  transactionFormSchema,
  async (req: NextRequest, _, userId) => {
    const rawData = await req.json();
    
    // Convert paymentDueDate string to Date object if it exists
    const data = {
      ...rawData,
      paymentDueDate: rawData.paymentDueDate ? new Date(rawData.paymentDueDate) : undefined
    } as CreateTransactionData;

    // Set default values
    const amountPaid = data.amountPaid || 0;
    const remainingAmount = data.total - amountPaid;

    // Validate all products exist and have sufficient stock for SALE transactions
    const productIds = data.items.map((item) => item.productId);
    const products = await prisma.product.findMany({
      where: {
        id: {
          in: productIds,
        },
      },
    });

    if (products.length !== productIds.length) {
      throw ApiError.BadRequest("One or more products not found");
    }

    if (data.type === "SALE") {
      const insufficientStock = data.items.some((item) => {
        const product = products.find((p) => p.id === item.productId);
        return product!.quantity < item.quantity;
      });

      if (insufficientStock) {
        throw ApiError.BadRequest("Insufficient stock for one or more products");
      }

      // For SALE transactions, clientId is required
      if (!data.clientId) {
        throw ApiError.BadRequest("Client is required for sale transactions");
      }
    } else if (data.type === "PURCHASE") {
      // For PURCHASE transactions, supplierId is required
      if (!data.supplierId) {
        throw ApiError.BadRequest("Supplier is required for purchase transactions");
      }
    }

    // Create transaction and update product quantities in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the transaction
      const transaction = await tx.transaction.create({
        data: {
          type: data.type,
          status: data.status,
          total: data.total,
          amountPaid: amountPaid,
          remainingAmount: remainingAmount,
          paymentMethod: data.paymentMethod as PaymentMethod | undefined,
          reference: data.reference,
          notes: data.notes,
          paymentDueDate: data.paymentDueDate,
          userId,
          clientId: data.clientId,
          supplierId: data.supplierId,
          items: {
            create: data.items,
          },
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
          client: true,
          supplier: true,
        },
      });
      
      // Create a payment record if there's an initial payment
      if (amountPaid > 0 && data.paymentMethod) {
        await tx.payment.create({
          data: {
            amount: amountPaid,
            paymentMethod: data.paymentMethod as PaymentMethod,
            reference: data.reference,
            notes: data.notes ? `Initial payment: ${data.notes}` : "Initial payment",
            status: "COMPLETED",
            transactionId: transaction.id,
            clientId: data.clientId,
            userId,
          },
        });
      }

      // Update product quantities
      for (const item of data.items) {
        const quantityChange =
          data.type === "SALE" ? -item.quantity : item.quantity;
        await tx.product.update({
          where: { id: item.productId },
          data: {
            quantity: {
              increment: quantityChange,
            },
          },
        });
      }

      // Update client credit for sales transactions
      if (data.type === "SALE" && data.clientId) {
        await tx.client.update({
          where: { id: data.clientId },
          data: {
            totalDue: { increment: data.total },
            amountPaid: { increment: amountPaid },
            balance: { increment: remainingAmount },
          },
        });
      }

      return transaction;
    });

    return result;
  }
);
