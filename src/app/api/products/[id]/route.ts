import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { productSchema } from "@/lib/validations/product";
import { withAuth, RouteParams } from "@/lib/api-middleware";
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

    // Return the complete product data including relations without wrapping it again
    // The withAuth middleware will wrap it in { success: true, data: ... }
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      sku: product.sku,
      price: Number(product.price),
      quantity: Number(product.quantity),
      minQuantity: Number(product.minQuantity),
      unit: product.unit,
      categoryId: product.categoryId,
      supplierId: product.supplierId,
      userId: product.userId,
      image: product.image,
      category: product.category,
      supplier: product.supplier,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt
    };
  } catch (error) {
    console.error('Error in GET /api/products/[id]:', error);
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message, errors: error.errors },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
});

// PUT /api/products/[id]
export const PUT = withAuth(
  async (req: NextRequest, params: RouteParams, userId: string) => {
    const resolvedParams = await Promise.resolve(params.params);
    console.log('PUT /api/products/[id]', { id: resolvedParams.id, userId });
    
    // Parse and validate request body
    const body = await req.json();
    console.log('Request body:', body);

    // Add userId to the request body
    const dataWithUserId = {
      ...body,
      userId,
    };

    // Validate data
    const validatedData = productSchema.parse(dataWithUserId);
    console.log('Validated data:', validatedData);

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

    // Check if new SKU already exists and verify category/supplier ownership
    const [skuExists, category, supplier] = await Promise.all([
      validatedData.sku !== existingProduct.sku
        ? prisma.product.findFirst({
            where: { 
              sku: validatedData.sku,
              userId,
              NOT: { id: resolvedParams.id }
            },
          })
        : null,
      prisma.category.findFirst({
        where: { 
          id: validatedData.categoryId,
          userId 
        },
      }),
      prisma.supplier.findFirst({
        where: { 
          id: validatedData.supplierId,
          userId 
        },
      }),
    ]);

    if (skuExists) {
      throw ApiError.Conflict("Product with this SKU already exists");
    }

    if (!category) {
      throw ApiError.BadRequest("Category not found or does not belong to user");
    }

    if (!supplier) {
      throw ApiError.BadRequest("Supplier not found or does not belong to user");
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
          ...validatedData
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

    // Return the updated product without wrapping it again
    // The withAuth middleware will wrap it in { success: true, data: ... }
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

    // Return a simple message without wrapping it again
    // The withAuth middleware will wrap it in { success: true, data: ... }
    return { message: "Product deleted successfully" };
  }
);
