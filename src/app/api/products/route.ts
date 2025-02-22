import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { productSchema } from "@/lib/validations/product";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    // Check authentication
    const session = await auth();
    const userId = session?.userId;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await req.json();
    console.log('Request body:', body);

    // Validate data
    const validatedData = productSchema.parse(body);
    console.log('Validated data:', validatedData);

    try {
      // Create product with userId
      const product = await prisma.product.create({
        data: {
          ...validatedData,
          userId, // Add userId from auth session
        },
        include: {
          category: true,
          supplier: true,
        },
      });

      return NextResponse.json({ success: true, data: product }, { status: 201 });
    } catch (dbError) {
      let errorMessage = 'Failed to create product';
      
      // Check for specific Prisma errors
      if (dbError instanceof Error) {
        if (dbError.message.includes('Foreign key constraint failed')) {
          errorMessage = 'Invalid category or supplier ID';
        } else if (dbError.message.includes('Unique constraint failed')) {
          errorMessage = 'SKU already exists';
        } else {
          errorMessage = dbError.message;
        }
      }

      return new NextResponse(
        JSON.stringify({ success: false, error: errorMessage }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Validation error:', error);
    return NextResponse.json(
      { success: false, error: 'Invalid product data' },
      { status: 400 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const session = await auth();
    const userId = session?.userId;

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const categoryId = searchParams.get("categoryId");
    const supplierId = searchParams.get("supplierId");
    const lowStock = searchParams.get("lowStock") === "true";

    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { sku: { contains: search } },
        { description: { contains: search } },
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
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch products';
    return new NextResponse(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
