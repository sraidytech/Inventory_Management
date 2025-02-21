import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkProduct() {
  const productId = 'b2814a4a-cb90-431e-9557-debb3add397b';
  const userId = 'user_2tBMzMZPzTt7W3sRTJ5UMWPfoZf';

  console.log('Checking database state...');

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
}

checkProduct()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
