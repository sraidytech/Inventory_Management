import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { expenseCategorySchema } from "@/lib/validations";
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

    const skip = (page - 1) * limit;

    const where: Prisma.ExpenseCategoryWhereInput = {
      userId, // Filter categories by user
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [categories, total] = await Promise.all([
      prisma.expenseCategory.findMany({
        where,
        include: {
          _count: {
            select: { expenses: true },
          },
        },
        skip,
        take: limit,
        orderBy: { name: "asc" },
      }),
      prisma.expenseCategory.count({ where }),
    ]);

    return NextResponse.json({
      categories,
      total,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching expense categories:", error);
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message, errors: error.errors },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { error: "Failed to fetch expense categories" },
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
      const validatedData = expenseCategorySchema.parse({
        ...body,
        userId,
      });

      // Check if category name already exists for this user
      const existingCategory = await prisma.expenseCategory.findFirst({
        where: {
          name: {
            equals: validatedData.name,
            mode: "insensitive",
          },
          userId,
        },
      });

      if (existingCategory) {
        throw ApiError.Conflict("Expense category with this name already exists");
      }

      // Create category
      const category = await prisma.expenseCategory.create({
        data: validatedData,
        include: {
          _count: {
            select: { expenses: true },
          },
        },
      });

      return NextResponse.json({ success: true, data: category }, { status: 201 });
    } catch (dbError) {
      if (dbError instanceof Error) {
        throw ApiError.BadRequest(dbError.message);
      }
      throw ApiError.BadRequest('Failed to create expense category');
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
      { error: 'Invalid expense category data' },
      { status: 400 }
    );
  }
}
