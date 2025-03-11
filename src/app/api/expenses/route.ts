import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { expenseSchema } from "@/lib/validations";
import { ZodError } from "zod";
import { ApiError } from "@/lib/api-error";
import type { Prisma } from "@prisma/client";

export async function GET(req: Request) {
  try {
    const session = await auth();
    const userId = session?.userId;

    if (!userId) {
      throw ApiError.Unauthorized();
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const categoryId = searchParams.get("categoryId") || undefined;
    const status = searchParams.get("status") || undefined;
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;

    const skip = (page - 1) * limit;

    const where: Prisma.ExpenseWhereInput = {
      userId,
    };

    if (search) {
      where.OR = [
        { description: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
        { reference: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (status) {
      where.status = status as Prisma.EnumExpenseStatusFilter;
    }

    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        include: {
          category: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.expense.count({ where }),
    ]);

    return NextResponse.json({
      expenses,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching expenses:", error);
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message, errors: error.errors },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { error: "Failed to fetch expenses" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    // Check authentication
    const session = await auth();
    const userId = session?.userId;

    if (!userId) {
      throw ApiError.Unauthorized();
    }

    // Parse request body
    const body = await req.json();

    try {
      // Add userId and validate data
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

      // Create expense
      const expense = await prisma.expense.create({
        data: validatedData,
        include: {
          category: true,
        },
      });

      return NextResponse.json({ success: true, data: expense }, { status: 201 });
    } catch (dbError) {
      if (dbError instanceof Error) {
        throw ApiError.BadRequest(dbError.message);
      }
      throw ApiError.BadRequest('Failed to create expense');
    }
  } catch (error) {
    console.error('Error:', error);
    if (error instanceof ZodError) {
      const errors: Record<string, string[]> = {};
      error.errors.forEach((err) => {
        const path = err.path.join('.');
        if (!errors[path]) {
          errors[path] = [];
        }
        errors[path].push(err.message);
      });
      return NextResponse.json(
        { error: 'Validation failed', errors },
        { status: 400 }
      );
    }
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
      { error: 'Invalid expense data' },
      { status: 400 }
    );
  }
}
