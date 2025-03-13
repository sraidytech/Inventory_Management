import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// This is a special endpoint for testing purposes only
// It bypasses authentication to create a test notification
export async function GET() {
  try {
    // Get all users to create notifications for
    const users = await prisma.userSettings.findMany({
      select: {
        userId: true,
      },
    });

    if (users.length === 0) {
      return NextResponse.json({
        success: false,
        error: "No users found",
      });
    }

    const notifications = [];
    
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

      notifications.push(enNotification, arNotification);
    }

    return NextResponse.json({
      success: true,
      message: `Created ${notifications.length} test notifications`,
      data: notifications,
    });
  } catch (error) {
    console.error("Error creating test notifications:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create test notifications",
      },
      { status: 500 }
    );
  }
}
