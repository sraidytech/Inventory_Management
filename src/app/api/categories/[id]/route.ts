import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { categoryFormSchema } from "@/lib/validations";
import { withAuth, withValidation, RouteParams } from "@/lib/api-middleware";
import { ApiError } from "@/lib/api-error";

// GET /api/categories/[id]
export const GET = withAuth(async (req: NextRequest, params: RouteParams, userId: string) => {
  const resolvedParams = await Promise.resolve(params.params);
  
  const category = await prisma.category.findFirst({
    where: { 
      id: resolvedParams.id,
      userId 
    },
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
  categoryFormSchema,
  async (req: NextRequest, params: RouteParams, userId: string) => {
    const resolvedParams = await Promise.resolve(params.params);
    const data = await req.json();

    // Check if category exists and belongs to user
    const existingCategory = await prisma.category.findFirst({
      where: { 
        id: resolvedParams.id,
        userId 
      },
    });

    if (!existingCategory) {
      throw ApiError.NotFound("Category not found");
    }

    // Check if new name already exists for this user (if name is being changed)
    if (data.name.toLowerCase() !== existingCategory.name.toLowerCase()) {
      const nameExists = await prisma.category.findFirst({
        where: {
          name: {
            equals: data.name,
            mode: "insensitive" as const,
          },
          userId,
          id: {
            not: resolvedParams.id,
          },
        },
      });

      if (nameExists) {
        throw ApiError.Conflict("Category with this name already exists");
      }
    }

    const updatedCategory = await prisma.category.update({
      where: { 
        id: resolvedParams.id,
        userId
      },
      data: {
        ...data,
        userId // Ensure userId is preserved
      },
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
  async (req: NextRequest, params: RouteParams, userId: string) => {
    const resolvedParams = await Promise.resolve(params.params);
    
    // Check if category exists and belongs to user
    const category = await prisma.category.findFirst({
      where: { 
        id: resolvedParams.id,
        userId 
      },
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
      where: { 
        id: resolvedParams.id,
        userId 
      },
    });

    return { message: "Category deleted successfully" };
  }
);
