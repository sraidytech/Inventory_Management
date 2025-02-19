import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { transactionSchema } from "@/lib/validations";
import { withAuth, withValidation } from "@/lib/api-middleware";
import { ApiError } from "@/lib/api-error";
import { Prisma, TransactionType, TransactionStatus } from "@prisma/client";

interface TransactionItem {
  productId: string;
  quantity: number;
  price: number;
}

interface CreateTransactionData {
  type: TransactionType;
  status: TransactionStatus;
  total: number;
  notes?: string;
  items: TransactionItem[];
}

// GET /api/transactions
export const GET = withAuth(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "10");
  const type = searchParams.get("type") as TransactionType | null;
  const status = searchParams.get("status") as TransactionStatus | null;
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  const where: Prisma.TransactionWhereInput = {
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
  transactionSchema,
  async (req: NextRequest, _, userId) => {
    const data = await req.json() as CreateTransactionData;

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
    }

    // Create transaction and update product quantities in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the transaction
      const transaction = await tx.transaction.create({
        data: {
          type: data.type,
          status: data.status,
          total: data.total,
          notes: data.notes,
          userId: userId,
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
        },
      });

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

      return transaction;
    });

    return result;
  }
);
