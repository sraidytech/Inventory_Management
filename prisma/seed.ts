import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Create categories
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        name: "Electronics",
        description: "Electronic devices and accessories",
      },
    }),
    prisma.category.create({
      data: {
        name: "Food & Beverages",
        description: "Food products and beverages",
      },
    }),
    prisma.category.create({
      data: {
        name: "Clothing",
        description: "Apparel and accessories",
      },
    }),
  ]);

  // Create suppliers
  const suppliers = await Promise.all([
    prisma.supplier.create({
      data: {
        name: "Tech Supplies Inc",
        email: "contact@techsupplies.com",
        phone: "+212 600000001",
        address: "123 Tech Street, Casablanca",
      },
    }),
    prisma.supplier.create({
      data: {
        name: "Global Foods",
        email: "info@globalfoods.com",
        phone: "+212 600000002",
        address: "456 Food Avenue, Rabat",
      },
    }),
    prisma.supplier.create({
      data: {
        name: "Fashion Wholesale",
        email: "sales@fashionwholesale.com",
        phone: "+212 600000003",
        address: "789 Fashion Boulevard, Marrakech",
      },
    }),
  ]);

  console.log("Seed data created:", {
    categories: categories.map((c) => c.name),
    suppliers: suppliers.map((s) => s.name),
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
