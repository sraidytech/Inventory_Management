import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { productSchema } from "@/lib/validations";
import { withAuth, withValidation } from "@/lib/api-middleware";
import { ApiError } from "@/lib/api-error";

// GET /api/products/[id]
export const GET = withAuth(async (req: NextRequest, params: Record<string, string>) => {
  const product = await prisma.product.findUnique({
    where: { id: params.id },
    include: {
      category: true,
      supplier: true,
    },
  });

  if (!product) {
    throw ApiError.NotFound("Product not found");
  }

  return product;
});

// PUT /api/products/[id]
export const PUT = withValidation(
  productSchema,
  async (req: NextRequest, params: Record<string, string>) => {
    const data = await req.json();

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id: params.id },
    });

    if (!existingProduct) {
      throw ApiError.NotFound("Product not found");
    }

    // Check if new SKU already exists (if SKU is being changed)
    if (data.sku !== existingProduct.sku) {
      const skuExists = await prisma.product.findUnique({
        where: { sku: data.sku },
      });

      if (skuExists) {
        throw ApiError.Conflict("Product with this SKU already exists");
      }
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

    const updatedProduct = await prisma.product.update({
      where: { id: params.id },
      data,
      include: {
        category: true,
        supplier: true,
      },
    });

    return updatedProduct;
  }
);

// DELETE /api/products/[id]
export const DELETE = withAuth(
  async (req: NextRequest, params: Record<string, string>) => {
    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: params.id },
    });

    if (!product) {
      throw ApiError.NotFound("Product not found");
    }

    // Check if product has any transactions
    const transactionCount = await prisma.transactionItem.count({
      where: { productId: params.id },
    });

    if (transactionCount > 0) {
      throw ApiError.Conflict(
        "Cannot delete product that has associated transactions"
      );
    }

    await prisma.product.delete({
      where: { id: params.id },
    });

    return { message: "Product deleted successfully" };
  }
);
