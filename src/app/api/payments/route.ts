import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { paymentSchema } from "@/lib/validations";
import { withAuth } from "@/lib/api-middleware";
import { ApiError } from "@/lib/api-error";
import { auth } from "@clerk/nextjs/server";

// GET /api/payments
export const GET = withAuth(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "10");
  const transactionId = searchParams.get("transactionId");
  const clientId = searchParams.get("clientId");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  // Using raw queries until Prisma client is regenerated
  const whereConditions: string[] = [];
  const params: (string | Date)[] = [];
  
  if (transactionId) {
    whereConditions.push(`"transactionId" = $${params.length + 1}`);
    params.push(transactionId);
  }
  
  if (clientId) {
    whereConditions.push(`"clientId" = $${params.length + 1}`);
    params.push(clientId);
  }
  
  if (startDate && endDate) {
    whereConditions.push(`"createdAt" BETWEEN $${params.length + 1} AND $${params.length + 2}`);
    params.push(new Date(startDate), new Date(endDate));
  }
  
  const whereClause = whereConditions.length > 0 
    ? `WHERE ${whereConditions.join(" AND ")}` 
    : "";

  const countQuery = `
    SELECT COUNT(*) FROM "Payment" ${whereClause}
  `;
  
  const itemsQuery = `
    SELECT 
      p.*,
      t.id as "t_id", t.type as "t_type", t.total as "t_total", t.status as "t_status",
      c.id as "c_id", c.name as "c_name"
    FROM "Payment" p
    LEFT JOIN "Transaction" t ON p."transactionId" = t.id
    LEFT JOIN "Client" c ON p."clientId" = c.id
    ${whereClause}
    ORDER BY p."createdAt" DESC
    LIMIT ${limit} OFFSET ${(page - 1) * limit}
  `;

  const [countResult, itemsResult] = await Promise.all([
    prisma.$queryRawUnsafe(countQuery, ...params),
    prisma.$queryRawUnsafe(itemsQuery, ...params),
  ]);

  const total = parseInt((countResult as Array<{count: string}>)[0].count);
  
  // Transform raw results to match expected format
  const items = (itemsResult as Array<Record<string, unknown>>).map(item => ({
    id: item.id,
    amount: item.amount,
    paymentMethod: item.paymentMethod,
    reference: item.reference,
    notes: item.notes,
    status: item.status,
    transactionId: item.transactionId,
    clientId: item.clientId,
    userId: item.userId,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    transaction: item.t_id ? {
      id: item.t_id,
      type: item.t_type,
      total: item.t_total,
      status: item.t_status,
    } : null,
    client: item.c_id ? {
      id: item.c_id,
      name: item.c_name,
    } : null,
  }));

  return {
    success: true,
    data: {
      items,
      metadata: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    },
  };
});

// POST /api/payments
export const POST = async (req: NextRequest) => {
  try {
    console.log("POST /api/payments - Start");
    
    // Get the user ID from auth
    const { userId } = await auth();
    console.log("User ID:", userId);
    
    if (!userId) {
      console.log("Unauthorized - No user ID");
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Clone the request for multiple reads
    const clonedReq = req.clone();
    
    // Parse the request body
    let data;
    try {
      const bodyText = await clonedReq.text();
      console.log("Request body text:", bodyText);
      
      if (!bodyText) {
        console.log("Empty request body");
        return NextResponse.json(
          { success: false, error: "Empty request body" },
          { status: 400 }
        );
      }
      
      data = JSON.parse(bodyText);
      console.log("Parsed data:", data);
    } catch (error) {
      console.error("Error parsing request body:", error);
      return NextResponse.json(
        { success: false, error: "Invalid request body: " + (error instanceof Error ? error.message : String(error)) },
        { status: 400 }
      );
    }

    // Validate the data
    console.log("Validating data with schema");
    const validationResult = paymentSchema.safeParse({ ...data, userId });
    console.log("Validation result:", validationResult.success ? "Success" : "Failed");
    
    if (!validationResult.success) {
      const errors: Record<string, string[]> = {};
      validationResult.error.errors.forEach((error) => {
        const path = error.path.join(".");
        if (!errors[path]) {
          errors[path] = [];
        }
        errors[path].push(error.message);
      });
      
      console.log("Validation errors:", errors);
      return NextResponse.json(
        { success: false, error: "Validation failed", errors },
        { status: 400 }
      );
    }

    const paymentData = validationResult.data;
    console.log("Validated payment data:", paymentData);

    // Validate transaction exists
    console.log("Finding transaction with ID:", paymentData.transactionId);
    const transaction = await prisma.transaction.findUnique({
      where: { id: paymentData.transactionId },
      include: {
        client: true,
      },
    });
    
    console.log("Transaction found:", transaction ? "Yes" : "No");
    
    if (!transaction) {
      console.log("Transaction not found");
      throw ApiError.NotFound("Transaction not found");
    }

    // For sale transactions, ensure client is associated
    if (transaction.type === "SALE" && !transaction.clientId) {
      console.log("Sale transaction has no client");
      throw ApiError.BadRequest("Transaction has no associated client");
    }

    // Ensure payment amount doesn't exceed remaining amount
    console.log("Payment amount:", paymentData.amount, "Remaining amount:", transaction.remainingAmount);
    if (paymentData.amount > transaction.remainingAmount) {
      console.log("Payment amount exceeds remaining amount");
      throw ApiError.BadRequest(`Payment amount exceeds remaining amount (${transaction.remainingAmount})`);
    }

    // Create payment and update transaction in a transaction
    console.log("Starting database transaction");
    const result = await prisma.$transaction(async (tx) => {
      console.log("Creating payment record");
      
      // Create the payment using Prisma's built-in methods
      const newPayment = await tx.payment.create({
        data: {
          amount: paymentData.amount,
          paymentMethod: paymentData.paymentMethod,
          reference: paymentData.reference || null,
          notes: paymentData.notes || null,
          status: paymentData.status || "COMPLETED",
          transactionId: paymentData.transactionId,
          clientId: transaction.clientId || null,
          userId: userId,
        },
        include: {
          transaction: true,
          client: true,
        },
      });
      
      console.log("Payment created with ID:", newPayment.id);

      console.log("Updating transaction");
      // Update transaction
      const updatedTransaction = await tx.transaction.update({
        where: { id: paymentData.transactionId },
        data: {
          amountPaid: {
            increment: paymentData.amount,
          },
          remainingAmount: {
            decrement: paymentData.amount,
          },
          // If payment completes the transaction, update status
          ...(transaction.remainingAmount - paymentData.amount <= 0 && {
            status: "COMPLETED",
          }),
        },
      });
      
      console.log("Transaction updated, new remaining amount:", updatedTransaction.remainingAmount);

      console.log("Checking if client update is needed");
      // Update client if this is a sale transaction
      if (transaction.type === "SALE" && transaction.clientId) {
        console.log("Updating client balance");
        const updatedClient = await tx.client.update({
          where: { id: transaction.clientId },
          data: {
            amountPaid: {
              increment: paymentData.amount,
            },
            balance: {
              decrement: paymentData.amount,
            },
          },
        });
        
        console.log("Client updated, new balance:", updatedClient.balance);
      }
      
      // Format the response
      return {
        ...newPayment,
        transaction: newPayment.transaction ? {
          id: newPayment.transaction.id,
          type: newPayment.transaction.type,
          total: newPayment.transaction.total,
          status: newPayment.transaction.status,
        } : null,
        client: newPayment.client ? {
          id: newPayment.client.id,
          name: newPayment.client.name,
        } : null,
      };
    });

    console.log("Transaction completed successfully");
    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error creating payment:", error);
    
    if (error instanceof ApiError) {
      console.log("API Error:", error.message, "Status:", error.statusCode);
      return NextResponse.json(
        { success: false, error: error.message, errors: error.errors },
        { status: error.statusCode }
      );
    }
    
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.log("Generic error:", errorMessage);
    return NextResponse.json(
      { success: false, error: "Failed to create payment: " + errorMessage },
      { status: 500 }
    );
  }
};
