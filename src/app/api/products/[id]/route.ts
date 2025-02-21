import { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { productSchema } from "@/lib/validations";
import { withAuth, withValidation, RouteParams } from "@/lib/api-middleware";
import { ApiError } from "@/lib/api-error";

// GET /api/products/[id]
export const GET = withAuth(async (req: NextRequest, params: RouteParams, userId: string) => {
  const resolvedParams = await Promise.resolve(params.params);
  console.log('GET /api/products/[id]', { id: resolvedParams.id, userId });
  
  try {
    const product = await prisma.product.findFirst({
      where: { 
        id: resolvedParams.id,
        userId
      },
      include: {
        category: true,
        supplier: true,
      },
    });

    console.log('Database query result:', product);

    if (!product) {
      console.log('Product not found with params:', { id: resolvedParams.id, userId });
      throw ApiError.NotFound("Product not found");
    }

    return product;
  } catch (error) {
    console.error('Error in GET /api/products/[id]:', error);
    throw error;
  }
});

// PUT /api/products/[id]
export const PUT = withValidation(
  productSchema,
  async (req: NextRequest, params: RouteParams, userId: string) => {
    const resolvedParams = await Promise.resolve(params.params);
  console.log('PUT /api/products/[id]', { id: resolvedParams.id, userId });
    const data = await req.json();
    console.log('Request body:', data);

    // Check if product exists and belongs to user
    const existingProduct = await prisma.product.findFirst({
      where: { 
        id: resolvedParams.id,
        userId
      },
    });

    if (!existingProduct) {
      throw ApiError.NotFound("Product not found");
    }

    // Check if new SKU already exists (if SKU is being changed)
    if (data.sku !== existingProduct.sku) {
      const skuExists = await prisma.product.findFirst({
        where: { 
          sku: data.sku,
          userId,
          NOT: { id: resolvedParams.id }
        },
      });

      if (skuExists) {
        throw ApiError.Conflict("Product with this SKU already exists");
      }
    }

    // Verify category exists and belongs to user
    const category = await prisma.category.findFirst({
      where: { 
        id: data.categoryId,
        userId 
      },
    });

    if (!category) {
      throw ApiError.BadRequest("Category not found");
    }

    // Verify supplier exists and belongs to user
    const supplier = await prisma.supplier.findFirst({
      where: { 
        id: data.supplierId,
        userId 
      },
    });

    if (!supplier) {
      throw ApiError.BadRequest("Supplier not found");
    }

    // Update using transaction to ensure atomicity
    console.log('Starting transaction');
    const updatedProduct = await prisma.$transaction(async (tx) => {
      // First check if the product exists and belongs to user
      console.log('Checking if product exists');
      const existing = await tx.product.findFirst({
        where: { 
          id: resolvedParams.id,
          userId
        }
      });

      console.log('Existing product:', existing);
      if (!existing) {
        console.log('Product not found in transaction');
        throw ApiError.NotFound("Product not found");
      }

      // Then perform the update
      console.log('Updating product');
      const updated = await tx.product.update({
        where: { 
          id: resolvedParams.id,
          userId
        },
        data: {
          ...data,
          userId
        },
        include: {
          category: true,
          supplier: true,
        },
      });
      console.log('Updated product:', updated);
      return updated;
    });

    console.log('Transaction completed successfully');

    return updatedProduct;
  }
);

// DELETE /api/products/[id]
export const DELETE = withAuth(
  async (req: NextRequest, params: RouteParams, userId: string) => {
    const resolvedParams = await Promise.resolve(params.params);
    // Check if product exists and belongs to user
    const product = await prisma.product.findFirst({
      where: { 
        id: resolvedParams.id,
        userId
      },
    });

    if (!product) {
      throw ApiError.NotFound("Product not found");
    }

    // Check if product has any transactions
    const transactionCount = await prisma.transactionItem.count({
      where: { productId: resolvedParams.id },
    });

    if (transactionCount > 0) {
      throw ApiError.Conflict(
        "Cannot delete product that has associated transactions"
      );
    }

    await prisma.product.delete({
      where: { 
        id: resolvedParams.id,
        userId
      },
    });

    return { message: "Product deleted successfully" };
  }
);
