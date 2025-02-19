import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { supplierSchema } from "@/lib/validations";
import { withAuth, withValidation } from "@/lib/api-middleware";
import { ApiError } from "@/lib/api-error";

// GET /api/suppliers/[id]
export const GET = withAuth(async (req: NextRequest, params: Record<string, string>) => {
  const supplier = await prisma.supplier.findUnique({
    where: { id: params.id },
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
  supplierSchema,
  async (req: NextRequest, params: Record<string, string>) => {
    const data = await req.json();

    // Check if supplier exists
    const existingSupplier = await prisma.supplier.findUnique({
      where: { id: params.id },
    });

    if (!existingSupplier) {
      throw ApiError.NotFound("Supplier not found");
    }

    // Check if new email already exists (if email is being changed)
    if (data.email.toLowerCase() !== existingSupplier.email.toLowerCase()) {
      const emailExists = await prisma.supplier.findFirst({
        where: {
          email: {
            equals: data.email,
            mode: "insensitive" as const,
          },
          id: {
            not: params.id,
          },
        },
      });

      if (emailExists) {
        throw ApiError.Conflict("Supplier with this email already exists");
      }
    }

    const updatedSupplier = await prisma.supplier.update({
      where: { id: params.id },
      data,
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
  async (req: NextRequest, params: Record<string, string>) => {
    // Check if supplier exists
    const supplier = await prisma.supplier.findUnique({
      where: { id: params.id },
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
      where: { id: params.id },
    });

    return { message: "Supplier deleted successfully" };
  }
);
