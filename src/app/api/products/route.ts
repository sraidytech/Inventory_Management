import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { productSchema } from "@/lib/validations";
import { withAuth, withValidation } from "@/lib/api-middleware";
import { ApiError } from "@/lib/api-error";

const { QueryMode } = Prisma;

// GET /api/products
export const GET = withAuth(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "10");
  const search = searchParams.get("search") ?? "";
  const categoryId = searchParams.get("categoryId");
  const supplierId = searchParams.get("supplierId");

  const where = {
    ...(search && {
      OR: [
        { name: { contains: search, mode: QueryMode.insensitive } },
        { sku: { contains: search, mode: QueryMode.insensitive } },
        { description: { contains: search, mode: QueryMode.insensitive } },
      ],
    }),
    ...(categoryId && { categoryId }),
    ...(supplierId && { supplierId }),
  };

  const [total, items] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      include: {
        category: true,
        supplier: true,
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return {
    items,
    metadata: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
});

// POST /api/products
export const POST = withValidation(productSchema, async (req: NextRequest) => {
  const data = await req.json();

  // Check if SKU already exists
  const existingProduct = await prisma.product.findUnique({
    where: { sku: data.sku },
  });

  if (existingProduct) {
    throw ApiError.Conflict("Product with this SKU already exists");
  }

  // Verify category exists
  const category = await prisma.category.findUnique({
    where: { id: data.categoryId },
  });

  if (!category) {
    throw ApiError.BadRequest("Category not found");
  }

  // Verify supplier exists
  const supplier = await prisma.supplier.findUnique({
    where: { id: data.supplierId },
  });

  if (!supplier) {
    throw ApiError.BadRequest("Supplier not found");
  }

  const product = await prisma.product.create({
    data,
    include: {
      category: true,
      supplier: true,
    },
  });

  return product;
});
