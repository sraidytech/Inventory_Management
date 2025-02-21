import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, RouteParams } from "@/lib/api-middleware";

export const GET = withAuth(async (req: NextRequest, params: RouteParams, userId: string) => {
  console.log('Debug endpoint called with userId:', userId);

  const productId = 'b2814a4a-cb90-431e-9557-debb3add397b';

  // Check all products
  const allProducts = await prisma.product.findMany();
  console.log('\nAll products:', allProducts);

  // Check specific product
  const product = await prisma.product.findFirst({
    where: {
      id: productId,
    },
    include: {
      category: true,
      supplier: true,
    },
  });
  console.log('\nProduct without userId:', product);

  // Check with userId
  const productWithUser = await prisma.product.findFirst({
    where: {
      id: productId,
      userId,
    },
    include: {
      category: true,
      supplier: true,
    },
  });
  console.log('\nProduct with userId:', productWithUser);

  // Check categories
  const categories = await prisma.category.findMany({
    where: { userId },
  });
  console.log('\nCategories:', categories);

  // Check suppliers
  const suppliers = await prisma.supplier.findMany({
    where: { userId },
  });
  console.log('\nSuppliers:', suppliers);

  return NextResponse.json({
    allProducts,
    product,
    productWithUser,
    categories,
    suppliers
  });
});
