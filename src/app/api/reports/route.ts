import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { parseISO, format, subDays, eachDayOfInterval } from "date-fns";

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
    const reportType = url.searchParams.get("type") || "sales";
    
    // Default to last 30 days if no date range is provided
    const today = new Date();
    const thirtyDaysAgo = subDays(today, 29);
    const startDate = startDateParam ? parseISO(startDateParam) : thirtyDaysAgo;
    const endDate = endDateParam ? parseISO(endDateParam) : today;
    
    // Add one day to endDate to include the entire day
    const endDatePlusOne = new Date(endDate);
    endDatePlusOne.setDate(endDatePlusOne.getDate() + 1);

    // Generate all dates in the range for consistent data
    const dateRange = eachDayOfInterval({ start: startDate, end: endDate });
    const dateMap = new Map(dateRange.map(date => [format(date, 'yyyy-MM-dd'), { date: format(date, 'yyyy-MM-dd'), sales: 0, transactions: 0, inStock: 0, lowStock: 0, outOfStock: 0, revenue: 0, cost: 0, profit: 0 }]));

    // Fetch data based on report type
    switch (reportType) {
      case "sales": {
        // Get all transactions in the date range
        const transactions = await prisma.transaction.findMany({
          where: {
            createdAt: {
              gte: startDate,
              lt: endDatePlusOne,
            },
            userId: session.userId,
            status: "COMPLETED",
          },
          select: {
            id: true,
            type: true,
            total: true,
            createdAt: true,
          },
        });

        // Process transactions into daily data
        transactions.forEach(transaction => {
          const dateKey = format(transaction.createdAt, 'yyyy-MM-dd');
          const dayData = dateMap.get(dateKey);
          
          if (dayData) {
            if (transaction.type === "SALE") {
              dayData.sales += transaction.total;
              dayData.revenue += transaction.total;
              dayData.transactions += 1;
            } else if (transaction.type === "PURCHASE") {
              dayData.cost += transaction.total;
            }
            
            // Calculate profit
            dayData.profit = dayData.revenue - dayData.cost;
          }
        });

        break;
      }
      
      case "inventory": {
        // Get current inventory status
        const products = await prisma.product.findMany({
          where: {
            userId: session.userId,
          },
          select: {
            id: true,
            name: true,
            quantity: true,
          },
        });
        
        // Count products by stock status
        const inStock = products.filter(p => p.quantity > 10).length;
        const lowStock = products.filter(p => p.quantity > 0 && p.quantity <= 10).length;
        const outOfStock = products.filter(p => p.quantity === 0).length;
        
        // Get historical inventory data from transactions
        const transactions = await prisma.transaction.findMany({
          where: {
            createdAt: {
              gte: startDate,
              lt: endDatePlusOne,
            },
            userId: session.userId,
          },
          include: {
            items: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                  }
                }
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        });
        
        // Create a map to track product quantities over time
        const productQuantities = new Map();
        
        // Initialize with current quantities
        products.forEach(product => {
          productQuantities.set(product.id, product.quantity);
        });
        
        // Process transactions in reverse chronological order to reconstruct historical inventory
        const sortedTransactions = [...transactions].sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        
        // Set initial values for all dates to current values
        [...dateMap.keys()].forEach(dateKey => {
          const dayData = dateMap.get(dateKey);
          if (dayData) {
            dayData.inStock = inStock;
            dayData.lowStock = lowStock;
            dayData.outOfStock = outOfStock;
          }
        });
        
        // Process transactions to update historical inventory data
        sortedTransactions.forEach(transaction => {
          const dateKey = format(transaction.createdAt, 'yyyy-MM-dd');
          
          // Update product quantities based on transaction type and items
          transaction.items.forEach(item => {
            if (!item.product) return;
            
            const productId = item.productId;
            const quantity = item.quantity;
            
            if (transaction.type === 'PURCHASE') {
              // For purchases, we need to subtract the quantity to go back in time
              if (productQuantities.has(productId)) {
                productQuantities.set(productId, Math.max(0, productQuantities.get(productId) - quantity));
              }
            } else if (transaction.type === 'SALE') {
              // For sales, we need to add the quantity to go back in time
              if (productQuantities.has(productId)) {
                productQuantities.set(productId, productQuantities.get(productId) + quantity);
              }
            }
          });
          
          // Count products by stock status for this date
          const historicalInStock = Array.from(productQuantities.values()).filter(q => q > 10).length;
          const historicalLowStock = Array.from(productQuantities.values()).filter(q => q > 0 && q <= 10).length;
          const historicalOutOfStock = Array.from(productQuantities.values()).filter(q => q === 0).length;
          
          // Update all dates before this transaction date
          [...dateMap.keys()].filter(key => key <= dateKey).forEach(key => {
            const dayData = dateMap.get(key);
            if (dayData) {
              dayData.inStock = historicalInStock;
              dayData.lowStock = historicalLowStock;
              dayData.outOfStock = historicalOutOfStock;
            }
          });
        });
        
        break;
      }
      
      case "products": {
        // Get top products by sales
        const productSales = await prisma.transactionItem.findMany({
          where: {
            transaction: {
              type: "SALE",
              status: "COMPLETED",
              userId: session.userId,
              createdAt: {
                gte: startDate,
                lt: endDatePlusOne,
              },
            },
          },
          select: {
            productId: true,
            quantity: true,
            price: true,
            product: {
              select: {
                name: true,
              },
            },
          },
        });
        
        // Aggregate sales by product
        const productTotals = productSales.reduce((acc, item) => {
          const productId = item.productId;
          const total = item.quantity * item.price;
          
          if (!acc[productId]) {
            acc[productId] = {
              name: item.product.name,
              value: 0,
            };
          }
          
          acc[productId].value += total;
          return acc;
        }, {} as Record<string, { name: string, value: number }>);
        
        // Convert to array and sort by value
        const topProducts = Object.values(productTotals)
          .sort((a, b) => b.value - a.value)
          .slice(0, 5);
        
        return NextResponse.json({
          success: true,
          data: {
            productData: topProducts,
          }
        });
      }
      
      case "suppliers": {
        // Get top suppliers by purchase amount
        const supplierPurchases = await prisma.transaction.findMany({
          where: {
            type: "PURCHASE",
            status: "COMPLETED",
            userId: session.userId,
            createdAt: {
              gte: startDate,
              lt: endDatePlusOne,
            },
          },
          select: {
            supplierId: true,
            total: true,
            supplier: {
              select: {
                name: true,
              },
            },
          },
        });
        
        // Aggregate purchases by supplier
        const supplierTotals = supplierPurchases.reduce((acc, transaction) => {
          if (!transaction.supplierId || !transaction.supplier) return acc;
          
          const supplierId = transaction.supplierId;
          
          if (!acc[supplierId]) {
            acc[supplierId] = {
              name: transaction.supplier.name,
              value: 0,
            };
          }
          
          acc[supplierId].value += transaction.total;
          return acc;
        }, {} as Record<string, { name: string, value: number }>);
        
        // Convert to array and sort by value
        const topSuppliers = Object.values(supplierTotals)
          .sort((a, b) => b.value - a.value)
          .slice(0, 5);
        
        return NextResponse.json({
          success: true,
          data: {
            supplierData: topSuppliers,
          }
        });
      }
      
      case "clients": {
        // Get top clients by sales amount
        const clientSales = await prisma.transaction.findMany({
          where: {
            type: "SALE",
            status: "COMPLETED",
            userId: session.userId,
            createdAt: {
              gte: startDate,
              lt: endDatePlusOne,
            },
          },
          select: {
            clientId: true,
            total: true,
            client: {
              select: {
                name: true,
              },
            },
          },
        });
        
        // Aggregate sales by client
        const clientTotals = clientSales.reduce((acc, transaction) => {
          if (!transaction.clientId || !transaction.client) return acc;
          
          const clientId = transaction.clientId;
          
          if (!acc[clientId]) {
            acc[clientId] = {
              name: transaction.client.name,
              value: 0,
            };
          }
          
          acc[clientId].value += transaction.total;
          return acc;
        }, {} as Record<string, { name: string, value: number }>);
        
        // Convert to array and sort by value
        const topClients = Object.values(clientTotals)
          .sort((a, b) => b.value - a.value)
          .slice(0, 5);
        
        return NextResponse.json({
          success: true,
          data: {
            clientData: topClients,
          }
        });
      }
      
      case "profit": {
        // This is handled in the sales case, as we calculate profit there
        break;
      }
      
      default:
        throw new Error(`Unknown report type: ${reportType}`);
    }

    // For sales and inventory reports, return the time series data
    return NextResponse.json({
      success: true,
      data: {
        timeSeriesData: Array.from(dateMap.values()),
      }
    });
  } catch (error) {
    console.error('Reports API error:', error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch report data" },
      { status: 500 }
    );
  }
}
