const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  // Clean up existing data
  await prisma.transactionItem.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.supplier.deleteMany();

  // Create categories
  const electronics = await prisma.category.create({
    data: {
      name: 'Electronics',
      description: 'Electronic devices and accessories',
    },
  });

  const clothing = await prisma.category.create({
    data: {
      name: 'Clothing',
      description: 'Apparel and accessories',
    },
  });

  // Create suppliers
  const techSupplier = await prisma.supplier.create({
    data: {
      name: 'Tech Supplies Inc',
      email: 'tech@example.com',
      phone: '123-456-7890',
      address: '123 Tech St',
    },
  });

  const fashionSupplier = await prisma.supplier.create({
    data: {
      name: 'Fashion Wholesale',
      email: 'fashion@example.com',
      phone: '098-765-4321',
      address: '456 Fashion Ave',
    },
  });

  // Create products
  const laptop = await prisma.product.create({
    data: {
      name: 'Laptop Pro',
      description: 'High-performance laptop',
      sku: 'TECH-001',
      price: 999.99,
      quantity: 50,
      minQuantity: 10,
      categoryId: electronics.id,
      supplierId: techSupplier.id,
    },
  });

  const smartphone = await prisma.product.create({
    data: {
      name: 'Smartphone X',
      description: 'Latest smartphone model',
      sku: 'TECH-002',
      price: 699.99,
      quantity: 5,
      minQuantity: 15,
      categoryId: electronics.id,
      supplierId: techSupplier.id,
    },
  });

  await prisma.product.create({
    data: {
      name: 'Cotton T-Shirt',
      description: 'Comfortable cotton t-shirt',
      sku: 'CLT-001',
      price: 19.99,
      quantity: 100,
      minQuantity: 20,
      categoryId: clothing.id,
      supplierId: fashionSupplier.id,
    },
  });

  // Create some transactions
  await prisma.transaction.create({
    data: {
      type: 'PURCHASE',
      status: 'COMPLETED',
      total: 4999.95,
      notes: 'Initial stock purchase',
      userId: 'test-user',
      items: {
        create: [
          {
            productId: laptop.id,
            quantity: 5,
            price: 999.99,
          },
        ],
      },
    },
  });

  await prisma.transaction.create({
    data: {
      type: 'SALE',
      status: 'COMPLETED',
      total: 1399.98,
      notes: 'Customer order',
      userId: 'test-user',
      items: {
        create: [
          {
            productId: smartphone.id,
            quantity: 2,
            price: 699.99,
          },
        ],
      },
    },
  });

  console.log('Database seeded successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
