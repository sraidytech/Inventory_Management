import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { PaymentMethod } from "@prisma/client";

// This is a debug endpoint to create sample payment data
export async function POST() {
  try {
    // Get the user ID from auth
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get existing transactions
    const transactions = await prisma.transaction.findMany({
      where: { 
        userId,
        type: "SALE",
        status: "COMPLETED"
      },
      take: 5,
      orderBy: { createdAt: "desc" }
    });

    if (transactions.length === 0) {
      return NextResponse.json(
        { success: false, error: "No transactions found to create payments for" },
        { status: 404 }
      );
    }

    // Create sample payments for each transaction
    const payments: Array<{
      id: string;
      amount: number;
      paymentMethod: PaymentMethod;
      transactionId: string;
      clientId?: string | null;
      status: string;
      reference?: string | null;
      notes?: string | null;
      createdAt: Date;
      updatedAt: Date;
      userId: string;
    }> = [];
    
    for (const transaction of transactions) {
      // Create 1-3 payments for each transaction
      const numPayments = Math.floor(Math.random() * 3) + 1;
      const totalAmount = transaction.total;
      
      for (let i = 0; i < numPayments; i++) {
        // For the last payment, use the remaining amount
        const amount: number = i === numPayments - 1 
          ? totalAmount - payments
              .filter(p => p.transactionId === transaction.id)
              .reduce((sum, p) => sum + p.amount, 0)
          : Math.floor(totalAmount / numPayments);
        
        // Skip if amount is zero or negative
        if (amount <= 0) continue;
        
        // Random payment method
        const methods: PaymentMethod[] = ["CASH", "BANK_TRANSFER", "CHECK"];
        const paymentMethod: PaymentMethod = methods[Math.floor(Math.random() * methods.length)];
        
        // Create the payment
        const payment = await prisma.payment.create({
          data: {
            amount,
            paymentMethod,
            reference: paymentMethod === "CHECK" ? `CHK-${Math.floor(Math.random() * 10000)}` : null,
            notes: i === 0 ? "Initial payment" : null,
            status: "COMPLETED",
            transactionId: transaction.id,
            clientId: transaction.clientId,
            userId,
          }
        });
        
        payments.push(payment);
      }
      
      // Update transaction payment amounts
      const totalPaid = payments
        .filter(p => p.transactionId === transaction.id)
        .reduce((sum, p) => sum + p.amount, 0);
      
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          amountPaid: totalPaid,
          remainingAmount: transaction.total - totalPaid
        }
      });
      
      // Update client balance if this is a sale
      if (transaction.type === "SALE" && transaction.clientId) {
        const client = await prisma.client.findUnique({
          where: { id: transaction.clientId }
        });
        
        if (client) {
          await prisma.client.update({
            where: { id: client.id },
            data: {
              amountPaid: client.amountPaid + totalPaid,
              balance: client.totalDue - (client.amountPaid + totalPaid)
            }
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        message: `Created ${payments.length} sample payments`,
        payments
      }
    });
  } catch (error) {
    console.error("Error creating sample payments:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create sample payments" },
      { status: 500 }
    );
  }
}
