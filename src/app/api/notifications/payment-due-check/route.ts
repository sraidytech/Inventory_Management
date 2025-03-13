import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// This route will be called by a cron job to check for upcoming payment due dates
// and create notifications for them
export async function GET() {
  try {
    // Get all transactions with payment due dates that are in the future
    // but less than 7 days away, and have a remaining amount > 0
    const today = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(today.getDate() + 7);

    // Find transactions with due dates in the next 7 days
    const transactions = await prisma.transaction.findMany({
      where: {
        paymentDueDate: {
          gte: today,
          lte: sevenDaysFromNow,
        },
        remainingAmount: {
          gt: 0,
        },
        status: "PENDING",
      },
      include: {
        client: true,
        supplier: true,
      },
    });

    console.log(`Found ${transactions.length} transactions with payment due dates in the next 7 days`);

    // Create notifications for each transaction
    const notifications = [];
    for (const transaction of transactions) {
      // Get the user ID associated with the transaction
      const userId = transaction.userId;
      
      // Check if a notification already exists for this transaction for today
      const existingNotification = await prisma.notification.findFirst({
        where: {
          userId,
          link: `/transactions?id=${transaction.id}`,
          createdAt: {
            gte: new Date(today.setHours(0, 0, 0, 0)),
            lte: new Date(today.setHours(23, 59, 59, 999)),
          },
        },
      });

      if (existingNotification) {
        console.log(`Notification already exists for transaction ${transaction.id}`);
        continue;
      }

      // Format the due date
      const dueDate = new Date(transaction.paymentDueDate!);
      const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      // Create English notification
      const enTitle = "Payment Due Soon";
      const enMessage = `Payment of DH ${transaction.remainingAmount.toFixed(2)} for ${
        transaction.type === "SALE" ? transaction.client?.name : transaction.supplier?.name
      } is due in ${daysUntilDue} ${daysUntilDue === 1 ? "day" : "days"}.`;

      // Create Arabic notification
      const arTitle = "استحقاق الدفع قريبًا";
      const arMessage = `دفعة بقيمة ${transaction.remainingAmount.toFixed(2)} درهم لـ ${
        transaction.type === "SALE" ? transaction.client?.name : transaction.supplier?.name
      } مستحقة خلال ${daysUntilDue} ${daysUntilDue === 1 ? "يوم" : "أيام"}.`;

      // Create notification in English
      const enNotification = await prisma.notification.create({
        data: {
          userId,
          type: "PAYMENT_DUE",
          title: enTitle,
          message: enMessage,
          link: `/transactions?id=${transaction.id}`,
          status: "UNREAD",
        },
      });
      
      // Create notification in Arabic
      const arNotification = await prisma.notification.create({
        data: {
          userId,
          type: "PAYMENT_DUE",
          title: arTitle,
          message: arMessage,
          link: `/transactions?id=${transaction.id}`,
          status: "UNREAD",
        },
      });

      notifications.push(enNotification, arNotification);
    }

    return NextResponse.json({
      success: true,
      message: `Created ${notifications.length} payment due notifications`,
      data: notifications,
    });
  } catch (error) {
    console.error("Error checking for payment due dates:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to check for payment due dates",
      },
      { status: 500 }
    );
  }
}
