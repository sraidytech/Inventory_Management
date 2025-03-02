import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/api-middleware";

// Define notification types
type NotificationType = "STOCK_ALERT" | "PAYMENT_DUE" | "PAYMENT_RECEIVED" | "SYSTEM";
type NotificationStatus = "UNREAD" | "READ" | "ARCHIVED";

// Define types for the where clause
interface NotificationWhereClause {
  userId: string;
  status?: NotificationStatus;
  type?: NotificationType;
}

// GET /api/notifications
export const GET = withAuth(async (req: NextRequest, _, userId: string) => {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") as NotificationStatus | null;
    const type = searchParams.get("type") as NotificationType | null;
    const limit = parseInt(searchParams.get("limit") || "50");
    const page = parseInt(searchParams.get("page") || "1");
    const skip = (page - 1) * limit;

    // Build the where clause based on the provided filters
    const where: NotificationWhereClause = { userId };
    
    if (status) {
      where.status = status;
    }
    
    if (type) {
      where.type = type;
    }

    // Get total count for pagination
    const total = await prisma.notification.count({ where });

    // Get notifications with pagination
    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    });

    return {
      success: true,
      data: {
        items: notifications,
        meta: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      },
    };
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return {
      success: false,
      error: "Failed to fetch notifications",
    };
  }
});

// POST /api/notifications
export const POST = withAuth(async (req: NextRequest, _, userId: string) => {
  try {
    const data = await req.json();
    
    // Create a new notification
    const notification = await prisma.notification.create({
      data: {
        userId,
        type: data.type,
        title: data.title,
        message: data.message,
        link: data.link,
        status: "UNREAD",
      },
    });

    return {
      success: true,
      data: notification,
    };
  } catch (error) {
    console.error("Error creating notification:", error);
    return {
      success: false,
      error: "Failed to create notification",
    };
  }
});

// DELETE /api/notifications (mark all as read)
export const DELETE = withAuth(async (req: NextRequest, _, userId: string) => {
  try {
    // Mark all notifications as read
    await prisma.notification.updateMany({
      where: {
        userId,
        status: "UNREAD",
      },
      data: {
        status: "READ",
      },
    });

    return {
      success: true,
      message: "All notifications marked as read",
    };
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    return {
      success: false,
      error: "Failed to mark notifications as read",
    };
  }
});
