import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, RouteParams } from "@/lib/api-middleware";

export const GET = withAuth(async (req: NextRequest, params: RouteParams, userId: string) => {
  try {
    // Find all products where current quantity is below minimum quantity
    const lowStockProducts = await prisma.product.findMany({
      where: {
        userId,
        quantity: {
          lt: prisma.product.fields.minQuantity,
        },
      },
      select: {
        id: true,
        name: true,
        quantity: true,
        minQuantity: true,
        unit: true,
      },
    });

    const alerts = lowStockProducts.map((product) => ({
      productId: product.id,
      productName: product.name,
      currentQuantity: product.quantity,
      minQuantity: product.minQuantity,
      unit: product.unit,
    }));

    return NextResponse.json({ success: true, alerts });
  } catch (error) {
    console.error("Error fetching stock alerts:", error);
    return NextResponse.json(
      { error: "Failed to fetch stock alerts" },
      { status: 500 }
    );
  }
});
