import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { productSchema } from "@/lib/validations/product";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { ApiError } from "@/lib/api-error";

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
    console.log('Request body:', body);

    try {
      // Add userId and validate data first
      const validatedData = productSchema.parse({
        ...body,
        userId,
      });

      // Check if SKU already exists for this user
      const existingSku = await prisma.product.findFirst({
        where: {
          sku: validatedData.sku,
          userId,
        },
      });

      if (existingSku) {
        throw ApiError.Conflict("Product with this SKU already exists");
      }

      // Then verify that category and supplier belong to user
      const [category, supplier] = await Promise.all([
        prisma.category.findFirst({
          where: {
            id: validatedData.categoryId,
            userId,
          },
        }),
        prisma.supplier.findFirst({
          where: {
            id: validatedData.supplierId,
            userId,
          },
        }),
      ]);

      if (!category) {
        throw ApiError.BadRequest("Category not found or does not belong to user");
      }

      if (!supplier) {
        throw ApiError.BadRequest("Supplier not found or does not belong to user");
      }

      // Create product
      const product = await prisma.product.create({
        data: validatedData,
        include: {
          category: true,
          supplier: true,
        },
      });

      return NextResponse.json({ success: true, data: product }, { status: 201 });
    } catch (dbError) {
      // Check for specific Prisma errors
      if (dbError instanceof Error) {
        if (dbError.message.includes('Foreign key constraint failed')) {
          throw ApiError.BadRequest('Invalid category or supplier ID');
        } else if (dbError.message.includes('Unique constraint failed')) {
          throw ApiError.Conflict('SKU already exists');
        }
        throw ApiError.BadRequest(dbError.message);
      }
      throw ApiError.BadRequest('Failed to create product');
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
      { error: 'Invalid product data' },
      { status: 400 }
    );
  }
}

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
    const categoryId = searchParams.get("categoryId");
    const supplierId = searchParams.get("supplierId");
    const lowStock = searchParams.get("lowStock") === "true";

    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {
      userId, // Filter products by user
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (supplierId) {
      where.supplierId = supplierId;
    }

    if (lowStock) {
      where.quantity = { lte: 10 }; // Using fixed value for now
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: true,
          supplier: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({
      products,
      total,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error:', error);
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message, errors: error.errors },
        { status: error.statusCode }
      );
    }
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
