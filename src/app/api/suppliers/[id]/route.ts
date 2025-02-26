import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { supplierFormSchema } from "@/lib/validations";
import { withAuth, withValidation, RouteParams } from "@/lib/api-middleware";
import { ApiError } from "@/lib/api-error";
import type { Prisma } from "@prisma/client";

// GET /api/suppliers/[id]
export const GET = withAuth(async (req: NextRequest, params: RouteParams, userId: string) => {
  const resolvedParams = await Promise.resolve(params.params);
  
  const supplier = await prisma.supplier.findFirst({
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

  if (!supplier) {
    throw ApiError.NotFound("Supplier not found");
  }

  return supplier;
});

// PUT /api/suppliers/[id]
export const PUT = withValidation(
  supplierFormSchema,
  async (req: NextRequest, params: RouteParams, userId: string) => {
    const resolvedParams = await Promise.resolve(params.params);
    const data = await req.json();

    // Check if supplier exists and belongs to user
    const existingSupplier = await prisma.supplier.findFirst({
      where: { 
        id: resolvedParams.id,
        userId 
      },
    });

    if (!existingSupplier) {
      throw ApiError.NotFound("Supplier not found");
    }

    // Only check email uniqueness if email is provided in the data
    if (data.email && existingSupplier.email && data.email.toLowerCase() !== existingSupplier.email.toLowerCase()) {
      const emailExists = await prisma.supplier.findFirst({
        where: {
          email: {
            equals: data.email,
            mode: "insensitive" as const,
          },
          userId,
          id: {
            not: resolvedParams.id,
          },
        },
      });

      if (emailExists) {
        throw ApiError.Conflict("Supplier with this email already exists");
      }
    }

    // Create update data with proper handling of optional email
    const updateData: Prisma.SupplierUpdateInput = {
      name: data.name,
      phone: data.phone,
      address: data.address,
      userId, // Ensure userId is preserved
    };

    // Only include email if it exists in the data
    if (data.email !== undefined) {
      updateData.email = data.email || null;
    }

    const updatedSupplier = await prisma.supplier.update({
      where: { 
        id: resolvedParams.id,
        userId
      },
      data: updateData,
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    return updatedSupplier;
  }
);

// DELETE /api/suppliers/[id]
export const DELETE = withAuth(
  async (req: NextRequest, params: RouteParams, userId: string) => {
    const resolvedParams = await Promise.resolve(params.params);
    
    // Check if supplier exists and belongs to user
    const supplier = await prisma.supplier.findFirst({
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

    if (!supplier) {
      throw ApiError.NotFound("Supplier not found");
    }

    // Check if supplier has any products
    if (supplier._count.products > 0) {
      throw ApiError.Conflict(
        "Cannot delete supplier that has associated products"
      );
    }

    await prisma.supplier.delete({
      where: { 
        id: resolvedParams.id,
        userId 
      },
    });

    return { message: "Supplier deleted successfully" };
  }
);
