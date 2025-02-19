import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { supplierSchema } from "@/lib/validations";
import { withAuth, withValidation } from "@/lib/api-middleware";
import { ApiError } from "@/lib/api-error";

// GET /api/suppliers
export const GET = withAuth(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "10");
  const search = searchParams.get("search") ?? "";

  const where = search
    ? {
        OR: [
          {
            name: {
              contains: search,
              mode: "insensitive" as const,
            },
          },
          {
            email: {
              contains: search,
              mode: "insensitive" as const,
            },
          },
          {
            phone: {
              contains: search,
              mode: "insensitive" as const,
            },
          },
        ],
      }
    : {};

  const [total, items] = await Promise.all([
    prisma.supplier.count({ where }),
    prisma.supplier.findMany({
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

// POST /api/suppliers
export const POST = withValidation(supplierSchema, async (req: NextRequest) => {
  const data = await req.json();

  // Check if supplier with same email exists
  const existingSupplier = await prisma.supplier.findFirst({
    where: {
      email: {
        equals: data.email,
        mode: "insensitive" as const,
      },
    },
  });

  if (existingSupplier) {
    throw ApiError.Conflict("Supplier with this email already exists");
  }

  const supplier = await prisma.supplier.create({
    data,
    include: {
      _count: {
        select: { products: true },
      },
    },
  });

  return supplier;
});
