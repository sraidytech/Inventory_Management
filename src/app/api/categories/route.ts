import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { categorySchema } from "@/lib/validations";
import { withAuth, withValidation } from "@/lib/api-middleware";
import { ApiError } from "@/lib/api-error";

// GET /api/categories
export const GET = withAuth(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "10");
  const search = searchParams.get("search") ?? "";

  const where = search
    ? {
        name: {
          contains: search,
          mode: "insensitive" as const,
        },
      }
    : {};

  const [total, items] = await Promise.all([
    prisma.category.count({ where }),
    prisma.category.findMany({
      where,
      include: {
        _count: {
          select: { products: true },
        },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { name: "asc" },
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

// POST /api/categories
export const POST = withValidation(categorySchema, async (req: NextRequest) => {
  const data = await req.json();

  // Check if category with same name exists
  const existingCategory = await prisma.category.findFirst({
    where: {
      name: {
        equals: data.name,
        mode: "insensitive" as const,
      },
    },
  });

  if (existingCategory) {
    throw ApiError.Conflict("Category with this name already exists");
  }

  const category = await prisma.category.create({
    data,
    include: {
      _count: {
        select: { products: true },
      },
    },
  });

  return category;
});
