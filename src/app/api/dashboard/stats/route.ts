import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { startOfDay } from "date-fns";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const today = startOfDay(new Date());

    const [
      totalProducts,
      lowStockProducts,
      totalSuppliers,
      totalCategories,
      recentTransactions,
      stockValue,
      todayTransactions,
    ] = await Promise.all([
      // Total products count
      prisma.product.count(),

      // Low stock products count
      prisma.product.count({
        where: {
          quantity: {
            lte: 10 // Default threshold, can be made configurable later
          }
        },
      }),

      // Total suppliers count
      prisma.supplier.count(),

      // Total categories count
      prisma.category.count(),

      // Recent transactions
      prisma.transaction.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          type: true,
          status: true,
          total: true,
          createdAt: true,
        },
      }),

      // Total stock value
      prisma.product.aggregate({
        _sum: {
          price: true,
        },
        where: {
          quantity: {
            gt: 0
          }
        },
      }),

      // Today's transactions
      prisma.transaction.findMany({
        where: {
          createdAt: {
            gte: today,
          },
          status: "COMPLETED",
        },
        select: {
          type: true,
          total: true,
        },
      }),
    ]);

    // Calculate today's sales and purchases
    const salesToday = todayTransactions
      .filter((t) => t.type === "SALE")
      .reduce((sum, t) => sum + t.total, 0);

    const purchasesToday = todayTransactions
      .filter((t) => t.type === "PURCHASE")
      .reduce((sum, t) => sum + t.total, 0);

    return NextResponse.json({
      success: true,
      data: {
        totalProducts: totalProducts ?? 0,
        lowStockProducts: lowStockProducts ?? 0,
        totalSuppliers: totalSuppliers ?? 0,
        totalCategories: totalCategories ?? 0,
        recentTransactions: recentTransactions?.map((t) => ({
          ...t,
          createdAt: t.createdAt.toISOString(),
        })) ?? [],
        stockValue: stockValue._sum?.price ?? 0,
        salesToday: salesToday ?? 0,
        purchasesToday: purchasesToday ?? 0,
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch dashboard stats" },
      { status: 500 }
    );
  }
}
