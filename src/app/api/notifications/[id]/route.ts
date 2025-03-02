import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, RouteParams } from "@/lib/api-middleware";

// GET /api/notifications/[id]
export const GET = withAuth(async (req: NextRequest, params: RouteParams, userId: string) => {
  // Extract the id from the params
  const id = (await params.params).id;
  try {
    const notification = await prisma.notification.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!notification) {
      return {
        success: false,
        error: "Notification not found",
      };
    }

    return {
      success: true,
      data: notification,
    };
  } catch (error) {
    console.error("Error fetching notification:", error);
    return {
      success: false,
      error: "Failed to fetch notification",
    };
  }
});

// PATCH /api/notifications/[id]
export const PATCH = withAuth(async (req: NextRequest, params: RouteParams, userId: string) => {
  // Extract the id from the params
  const id = (await params.params).id;
  
  try {
    const data = await req.json();
    
    // Check if notification exists and belongs to the user
    const existingNotification = await prisma.notification.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existingNotification) {
      return {
        success: false,
        error: "Notification not found",
      };
    }

    // Update notification status
    const updatedNotification = await prisma.notification.update({
      where: {
        id,
      },
      data: {
        status: data.status,
      },
    });

    return {
      success: true,
      data: updatedNotification,
    };
  } catch (error) {
    console.error("Error updating notification:", error);
    return {
      success: false,
      error: "Failed to update notification",
    };
  }
});

// DELETE /api/notifications/[id]
export const DELETE = withAuth(async (req: NextRequest, params: RouteParams, userId: string) => {
  // Extract the id from the params
  const id = (await params.params).id;
  
  try {
    // Check if notification exists and belongs to the user
    const existingNotification = await prisma.notification.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existingNotification) {
      return {
        success: false,
        error: "Notification not found",
      };
    }

    // Delete notification
    await prisma.notification.delete({
      where: {
        id,
      },
    });

    return {
      success: true,
      message: "Notification deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting notification:", error);
    return {
      success: false,
      error: "Failed to delete notification",
    };
  }
});
