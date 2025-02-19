import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { categorySchema } from "@/lib/validations";
import { withAuth, withValidation } from "@/lib/api-middleware";
import { ApiError } from "@/lib/api-error";

// GET /api/categories/[id]
export const GET = withAuth(async (req: NextRequest, params: Record<string, string>) => {
  const category = await prisma.category.findUnique({
    where: { id: params.id },
    include: {
      _count: {
        select: { products: true },
      },
    },
  });

  if (!category) {
    throw ApiError.NotFound("Category not found");
  }

  return category;
});

// PUT /api/categories/[id]
export const PUT = withValidation(
  categorySchema,
  async (req: NextRequest, params: Record<string, string>) => {
    const data = await req.json();

    // Check if category exists
    const existingCategory = await prisma.category.findUnique({
      where: { id: params.id },
    });

    if (!existingCategory) {
      throw ApiError.NotFound("Category not found");
    }

    // Check if new name already exists (if name is being changed)
    if (data.name.toLowerCase() !== existingCategory.name.toLowerCase()) {
      const nameExists = await prisma.category.findFirst({
        where: {
          name: {
            equals: data.name,
            mode: "insensitive" as const,
          },
          id: {
            not: params.id,
          },
        },
      });

      if (nameExists) {
        throw ApiError.Conflict("Category with this name already exists");
      }
    }

    const updatedCategory = await prisma.category.update({
      where: { id: params.id },
      data,
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    return updatedCategory;
  }
);

// DELETE /api/categories/[id]
export const DELETE = withAuth(
  async (req: NextRequest, params: Record<string, string>) => {
    // Check if category exists
    const category = await prisma.category.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    if (!category) {
      throw ApiError.NotFound("Category not found");
    }

    // Check if category has any products
    if (category._count.products > 0) {
      throw ApiError.Conflict(
        "Cannot delete category that has associated products"
      );
    }

    await prisma.category.delete({
      where: { id: params.id },
    });

    return { message: "Category deleted successfully" };
  }
);
