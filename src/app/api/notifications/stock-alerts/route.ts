import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

// This route will be called by a cron job to check for low stock products
// and create notifications for them
export async function GET(req: NextRequest) {
  try {
    // Check if this is being called from the API or from a script
    // If from API, get the user ID from auth
    // If from script, process for all users
    const { userId: authenticatedUserId } = await auth();
    const isFromScript = !authenticatedUserId && req.headers.get('user-agent')?.includes('node');
    
    // Check if force parameter is set
    const { searchParams } = new URL(req.url);
    const forceCreate = searchParams.get('force') === 'true';
    
    console.log(`Auth check - authenticatedUserId: ${authenticatedUserId}, isFromScript: ${isFromScript}, forceCreate: ${forceCreate}`);
    
    // If force parameter is set or running from script, create test notifications
    if (forceCreate || isFromScript) {
      // Get all users
      const users = await prisma.userSettings.findMany({
        select: {
          userId: true,
        },
      });
      
      console.log(`Found ${users.length} users to create notifications for`);
      
      if (users.length === 0) {
        // If no users found, create a test notification with a hardcoded user ID
        // This is just for testing purposes
        const testUserId = "user_2XNJzS6xdCdXEctSHchTrHi9xFS";
        
        // Create a test notification
        await prisma.notification.create({
          data: {
            userId: testUserId,
            type: "STOCK_ALERT",
            title: "Test Stock Alert",
            message: "This is a test stock alert notification",
            link: "/inventory",
            status: "UNREAD",
          },
        });
        
        console.log(`Created test notification for hardcoded user ID: ${testUserId}`);
        
        return NextResponse.json({
          success: true,
          message: "Created test notification for hardcoded user ID",
        });
      }
      
      const testNotifications = [];
      
      // Create a test notification for each user
      for (const user of users) {
        const userId = user.userId;
        
        // Create English notification
        const enNotification = await prisma.notification.create({
          data: {
            userId,
            type: "STOCK_ALERT",
            title: "Test Stock Alert",
            message: "This is a test stock alert notification",
            link: "/inventory",
            status: "UNREAD",
          },
        });
        
        // Create Arabic notification
        const arNotification = await prisma.notification.create({
          data: {
            userId,
            type: "STOCK_ALERT",
            title: "تنبيه اختبار المخزون",
            message: "هذا اختبار لإشعار تنبيه المخزون",
            link: "/inventory",
            status: "UNREAD",
          },
        });
        
        testNotifications.push(enNotification, arNotification);
      }
      
      console.log(`Created ${testNotifications.length} test notifications`);
      
      return NextResponse.json({
        success: true,
        message: `Created ${testNotifications.length} test notifications`,
        data: testNotifications,
      });
    }
    
    // Normal operation - find low stock products
    // Build the where clause based on whether this is from script or API
    const where = {
      quantity: {
        lt: prisma.product.fields.minQuantity,
      },
      ...(authenticatedUserId ? { userId: authenticatedUserId } : {}),
    };

    // Find all products where current quantity is below minimum quantity
    const lowStockProducts = await prisma.product.findMany({
      where,
      select: {
        id: true,
        name: true,
        quantity: true,
        minQuantity: true,
        unit: true,
        userId: true,
      },
    });

    console.log(`Found ${lowStockProducts.length} products with low stock`);

    // Create notifications for each low stock product
    const notifications = [];
    for (const product of lowStockProducts) {
      // Get the user ID associated with the product
      const userId = product.userId;
      
      // Check if a notification already exists for this product for today
      const today = new Date();
      const existingNotification = await prisma.notification.findFirst({
        where: {
          userId,
          link: `/inventory?id=${product.id}`,
          type: "STOCK_ALERT",
          createdAt: {
            gte: new Date(today.setHours(0, 0, 0, 0)),
            lte: new Date(today.setHours(23, 59, 59, 999)),
          },
        },
      });

      if (existingNotification) {
        console.log(`Notification already exists for product ${product.id}`);
        continue;
      }

      // Create English notification
      const enTitle = "Low Stock Alert";
      const enMessage = `${product.name} is low on stock. Current quantity: ${product.quantity} ${product.unit}, Minimum quantity: ${product.minQuantity} ${product.unit}`;

      // Create Arabic notification
      const arTitle = "تنبيه انخفاض المخزون";
      const arMessage = `${product.name} منخفض في المخزون. الكمية الحالية: ${product.quantity} ${product.unit}، الحد الأدنى للكمية: ${product.minQuantity} ${product.unit}`;

      // Create notification in English
      const enNotification = await prisma.notification.create({
        data: {
          userId,
          type: "STOCK_ALERT",
          title: enTitle,
          message: enMessage,
          link: `/inventory?id=${product.id}`,
          status: "UNREAD",
        },
      });
      
      // Create notification in Arabic
      const arNotification = await prisma.notification.create({
        data: {
          userId,
          type: "STOCK_ALERT",
          title: arTitle,
          message: arMessage,
          link: `/inventory?id=${product.id}`,
          status: "UNREAD",
        },
      });

      notifications.push(enNotification, arNotification);
    }

    return NextResponse.json({
      success: true,
      message: `Created ${notifications.length} stock alert notifications`,
      data: notifications,
    });
  } catch (error) {
    console.error("Error checking for low stock products:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to check for low stock products",
      },
      { status: 500 }
    );
  }
}
