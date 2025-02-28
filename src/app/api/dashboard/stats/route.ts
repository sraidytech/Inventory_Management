import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { startOfDay, parseISO } from "date-fns";
import { auth } from "@clerk/nextjs/server";

export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get date range from query parameters
    const url = new URL(request.url);
    const startDateParam = url.searchParams.get("startDate");
    const endDateParam = url.searchParams.get("endDate");
    
    // Default to today if no date range is provided
    const today = startOfDay(new Date());
    const startDate = startDateParam ? parseISO(startDateParam) : today;
    const endDate = endDateParam ? parseISO(endDateParam) : today;
    
    // Add one day to endDate to include the entire day
    const endDatePlusOne = new Date(endDate);
    endDatePlusOne.setDate(endDatePlusOne.getDate() + 1);

    const [
      totalProducts,
      lowStockProducts,
      totalSuppliers,
      totalCategories,
      recentTransactions,
      stockValue,
      todayTransactions,
      allTransactions,
      allPayments,
      clients
    ] = await Promise.all([
      // Total products count
      prisma.product.count({
        where: { userId: session.userId }
      }),

      // Low stock products count
      prisma.product.count({
        where: {
          quantity: {
            lte: 10 // Default threshold, can be made configurable later
          },
          userId: session.userId
        },
      }),

      // Total suppliers count
      prisma.supplier.count({
        where: { userId: session.userId }
      }),

      // Total categories count
      prisma.category.count({
        where: { userId: session.userId }
      }),

      // Recent transactions
      prisma.transaction.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        where: { userId: session.userId },
        select: {
          id: true,
          type: true,
          status: true,
          total: true,
          createdAt: true,
        },
      }),

      // Total stock value - calculated as sum of (price * quantity) for each product
      prisma.product.findMany({
        where: {
          quantity: {
            gt: 0
          },
          userId: session.userId
        },
        select: {
          price: true,
          quantity: true
        }
      }),

      // Today's transactions
      prisma.transaction.findMany({
        where: {
          createdAt: {
            gte: today,
          },
          status: "COMPLETED",
          userId: session.userId
        },
        select: {
          type: true,
          total: true,
        },
      }),
      
      // All transactions within date range
      prisma.transaction.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lt: endDatePlusOne,
          },
          userId: session.userId
        },
        select: {
          id: true,
          type: true,
          status: true,
          total: true,
          amountPaid: true,
          remainingAmount: true,
          createdAt: true,
        },
      }),
      
      // All payments within date range
      prisma.payment.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lt: endDatePlusOne,
          },
          userId: session.userId
        },
        select: {
          id: true,
          amount: true,
          status: true,
          transaction: {
            select: {
              type: true,
            }
          },
          createdAt: true,
        },
      }),
      
      // Clients with balances
      prisma.client.findMany({
        where: {
          userId: session.userId,
          balance: {
            gt: 0
          }
        },
        select: {
          id: true,
          name: true,
          totalDue: true,
          amountPaid: true,
          balance: true,
        }
      })
    ]);

    // Calculate today's sales and purchases
    const salesToday = todayTransactions
      .filter((t) => t.type === "SALE")
      .reduce((sum, t) => sum + t.total, 0);

    const purchasesToday = todayTransactions
      .filter((t) => t.type === "PURCHASE")
      .reduce((sum, t) => sum + t.total, 0);
      
    // Calculate financial metrics for the date range
    const totalSales = allTransactions
      .filter((t) => t.type === "SALE")
      .reduce((sum, t) => sum + t.total, 0);
      
    const totalPurchases = allTransactions
      .filter((t) => t.type === "PURCHASE")
      .reduce((sum, t) => sum + t.total, 0);
      
    const pendingReceivables = allTransactions
      .filter((t) => t.type === "SALE" && t.remainingAmount > 0)
      .reduce((sum, t) => sum + t.remainingAmount, 0);
      
    const pendingPayables = allTransactions
      .filter((t) => t.type === "PURCHASE" && t.remainingAmount > 0)
      .reduce((sum, t) => sum + t.remainingAmount, 0);
      
    const totalReceived = allPayments
      .filter((p) => p.transaction?.type === "SALE" && p.status === "COMPLETED")
      .reduce((sum, p) => sum + p.amount, 0);
      
    const totalPaid = allPayments
      .filter((p) => p.transaction?.type === "PURCHASE" && p.status === "COMPLETED")
      .reduce((sum, p) => sum + p.amount, 0);
      
    // Calculate profit (simple calculation: sales - purchases)
    const profit = totalSales - totalPurchases;

    return NextResponse.json({
      success: true,
      data: {
        // Dashboard stats
        totalProducts: totalProducts ?? 0,
        lowStockProducts: lowStockProducts ?? 0,
        totalSuppliers: totalSuppliers ?? 0,
        totalCategories: totalCategories ?? 0,
        recentTransactions: recentTransactions?.map((t) => ({
          ...t,
          createdAt: t.createdAt.toISOString(),
        })) ?? [],
        stockValue: stockValue.reduce((total, product) => total + (product.price * product.quantity), 0),
        salesToday: salesToday ?? 0,
        purchasesToday: purchasesToday ?? 0,
        
        // Financial stats
        totalSales,
        totalPurchases,
        totalReceived,
        totalPaid,
        pendingReceivables,
        pendingPayables,
        profit,
        
        // Client data
        clientsWithBalance: clients.length,
        totalClientBalance: clients.reduce((sum, c) => sum + c.balance, 0),
        
        // Date range
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
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
