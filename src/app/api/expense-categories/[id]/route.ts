import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { expenseCategorySchema } from "@/lib/validations";
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

    const category = await prisma.expenseCategory.findUnique({
      where: {
        id,
      },
      include: {
        _count: {
          select: { expenses: true },
        },
      },
    });

    if (!category) {
      throw ApiError.NotFound("Expense category not found");
    }

    if (category.userId !== userId) {
      throw ApiError.Forbidden("You don't have access to this expense category");
    }

    return NextResponse.json({ data: category });
  } catch (error) {
    console.error("Error fetching expense category:", error);
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message, errors: error.errors },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { error: "Failed to fetch expense category" },
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

    // Check if category exists and belongs to user
    const existingCategory = await prisma.expenseCategory.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      throw ApiError.NotFound("Expense category not found");
    }

    if (existingCategory.userId !== userId) {
      throw ApiError.Forbidden("You don't have access to this expense category");
    }

    try {
      // Validate data
      const validatedData = expenseCategorySchema.parse({
        ...body,
        userId,
      });

      // Check if name is being changed and if it conflicts with existing category
      if (
        validatedData.name.toLowerCase() !== existingCategory.name.toLowerCase()
      ) {
        const nameConflict = await prisma.expenseCategory.findFirst({
          where: {
            name: {
              equals: validatedData.name,
              mode: "insensitive",
            },
            userId,
            id: { not: id },
          },
        });

        if (nameConflict) {
          throw ApiError.Conflict("Expense category with this name already exists");
        }
      }

      // Update category
      const updatedCategory = await prisma.expenseCategory.update({
        where: { id },
        data: {
          name: validatedData.name,
          description: validatedData.description,
        },
        include: {
          _count: {
            select: { expenses: true },
          },
        },
      });

      return NextResponse.json({ success: true, data: updatedCategory });
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
    console.error("Error updating expense category:", error);
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
      { error: "Failed to update expense category" },
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

    // Check if category exists and belongs to user
    const category = await prisma.expenseCategory.findUnique({
      where: { id },
      include: {
        _count: {
          select: { expenses: true },
        },
      },
    });

    if (!category) {
      throw ApiError.NotFound("Expense category not found");
    }

    if (category.userId !== userId) {
      throw ApiError.Forbidden("You don't have access to this expense category");
    }

    // Check if category has associated expenses
    if (category._count.expenses > 0) {
      throw ApiError.Conflict(
        "Cannot delete expense category with associated expenses"
      );
    }

    // Delete category
    await prisma.expenseCategory.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting expense category:", error);
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message, errors: error.errors },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { error: "Failed to delete expense category" },
      { status: 500 }
    );
  }
}
