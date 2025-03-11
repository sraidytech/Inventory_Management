import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { expenseSchema } from "@/lib/validations";
import { ZodError } from "zod";
import { ApiError } from "@/lib/api-error";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    const userId = session?.userId;

    if (!userId) {
      throw ApiError.Unauthorized();
    }

    const { id } = params;

    const expense = await prisma.expense.findUnique({
      where: {
        id,
      },
      include: {
        category: true,
      },
    });

    if (!expense) {
      throw ApiError.NotFound("Expense not found");
    }

    if (expense.userId !== userId) {
      throw ApiError.Forbidden("You don't have access to this expense");
    }

    return NextResponse.json({ data: expense });
  } catch (error) {
    console.error("Error fetching expense:", error);
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message, errors: error.errors },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { error: "Failed to fetch expense" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    const userId = session?.userId;

    if (!userId) {
      throw ApiError.Unauthorized();
    }

    const { id } = params;
    const body = await req.json();

    // Check if expense exists and belongs to user
    const existingExpense = await prisma.expense.findUnique({
      where: { id },
    });

    if (!existingExpense) {
      throw ApiError.NotFound("Expense not found");
    }

    if (existingExpense.userId !== userId) {
      throw ApiError.Forbidden("You don't have access to this expense");
    }

    try {
      // Validate data
      const validatedData = expenseSchema.parse({
        ...body,
        userId,
      });

      // Check if category exists and belongs to user
      const category = await prisma.expenseCategory.findUnique({
        where: { id: validatedData.categoryId },
      });

      if (!category) {
        throw ApiError.NotFound("Expense category not found");
      }

      if (category.userId !== userId) {
        throw ApiError.Forbidden("You don't have access to this expense category");
      }

      // Update expense
      const updatedExpense = await prisma.expense.update({
        where: { id },
        data: {
          amount: validatedData.amount,
          description: validatedData.description,
          status: validatedData.status,
          paymentMethod: validatedData.paymentMethod,
          reference: validatedData.reference,
          notes: validatedData.notes,
          categoryId: validatedData.categoryId,
        },
        include: {
          category: true,
        },
      });

      return NextResponse.json({ success: true, data: updatedExpense });
    } catch (validationError) {
      if (validationError instanceof ZodError) {
        const errors: Record<string, string[]> = {};
        validationError.errors.forEach((err) => {
          const path = err.path.join(".");
          if (!errors[path]) {
            errors[path] = [];
          }
          errors[path].push(err.message);
        });
        throw ApiError.BadRequest("Validation failed", errors);
      }
      throw validationError;
    }
  } catch (error) {
    console.error("Error updating expense:", error);
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message, errors: error.errors },
        { status: error.statusCode }
      );
    }
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update expense" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    const userId = session?.userId;

    if (!userId) {
      throw ApiError.Unauthorized();
    }

    const { id } = params;

    // Check if expense exists and belongs to user
    const expense = await prisma.expense.findUnique({
      where: { id },
    });

    if (!expense) {
      throw ApiError.NotFound("Expense not found");
    }

    if (expense.userId !== userId) {
      throw ApiError.Forbidden("You don't have access to this expense");
    }

    // Delete expense
    await prisma.expense.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting expense:", error);
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message, errors: error.errors },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { error: "Failed to delete expense" },
      { status: 500 }
    );
  }
}
