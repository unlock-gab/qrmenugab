import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const passwordHash = await bcrypt.hash("demo123", 10);

  const restaurant = await prisma.restaurant.upsert({
    where: { slug: "demo-bistro" },
    update: {},
    create: {
      name: "Demo Bistro",
      slug: "demo-bistro",
      phone: "+1 555-0100",
      address: "123 Main Street, Downtown",
      status: "ACTIVE",
    },
  });

  await prisma.user.upsert({
    where: { email: "demo@restaurant.com" },
    update: { restaurantId: restaurant.id },
    create: {
      name: "Demo Owner",
      email: "demo@restaurant.com",
      passwordHash,
      role: "MERCHANT",
      restaurantId: restaurant.id,
    },
  });

  const tables = await Promise.all(
    ["1", "2", "3", "4", "5"].map((num) =>
      prisma.table.upsert({
        where: {
          restaurantId_tableNumber: { restaurantId: restaurant.id, tableNumber: num },
        },
        update: {},
        create: {
          restaurantId: restaurant.id,
          tableNumber: num,
          isActive: true,
        },
      })
    )
  );

  console.log(`Created ${tables.length} tables`);

  const burgers = await prisma.category.upsert({
    where: { id: "cat_burgers_demo" },
    update: {},
    create: {
      id: "cat_burgers_demo",
      restaurantId: restaurant.id,
      name: "Burgers",
      sortOrder: 1,
      isActive: true,
    },
  });

  const drinks = await prisma.category.upsert({
    where: { id: "cat_drinks_demo" },
    update: {},
    create: {
      id: "cat_drinks_demo",
      restaurantId: restaurant.id,
      name: "Drinks",
      sortOrder: 2,
      isActive: true,
    },
  });

  const sides = await prisma.category.upsert({
    where: { id: "cat_sides_demo" },
    update: {},
    create: {
      id: "cat_sides_demo",
      restaurantId: restaurant.id,
      name: "Sides",
      sortOrder: 3,
      isActive: true,
    },
  });

  const menuItems = [
    {
      id: "item_classic_burger",
      categoryId: burgers.id,
      name: "Classic Burger",
      description: "100% beef patty, lettuce, tomato, special sauce",
      price: 12.99,
      sortOrder: 1,
    },
    {
      id: "item_cheese_burger",
      categoryId: burgers.id,
      name: "Cheeseburger",
      description: "Beef patty with melted cheddar, pickles, mustard",
      price: 13.99,
      sortOrder: 2,
    },
    {
      id: "item_chicken_burger",
      categoryId: burgers.id,
      name: "Crispy Chicken",
      description: "Crispy fried chicken fillet, coleslaw, honey mustard",
      price: 13.49,
      sortOrder: 3,
    },
    {
      id: "item_fries",
      categoryId: sides.id,
      name: "French Fries",
      description: "Golden crispy fries with seasoning",
      price: 4.99,
      sortOrder: 1,
    },
    {
      id: "item_rings",
      categoryId: sides.id,
      name: "Onion Rings",
      description: "Crispy battered onion rings",
      price: 5.49,
      sortOrder: 2,
    },
    {
      id: "item_soda",
      categoryId: drinks.id,
      name: "Soft Drink",
      description: "Coke, Sprite, or Orange - your choice",
      price: 2.99,
      sortOrder: 1,
    },
    {
      id: "item_water",
      categoryId: drinks.id,
      name: "Still Water",
      description: "500ml bottle",
      price: 1.99,
      sortOrder: 2,
    },
    {
      id: "item_shake",
      categoryId: drinks.id,
      name: "Milkshake",
      description: "Vanilla, chocolate, or strawberry",
      price: 5.99,
      sortOrder: 3,
    },
  ];

  for (const item of menuItems) {
    await prisma.menuItem.upsert({
      where: { id: item.id },
      update: {},
      create: {
        ...item,
        restaurantId: restaurant.id,
        isAvailable: true,
      },
    });
  }

  console.log("Seed complete!");
  console.log(`\nDemo credentials:`);
  console.log(`Email: demo@restaurant.com`);
  console.log(`Password: demo123`);
  console.log(`\nRestaurant slug: demo-bistro`);
  console.log(`Table 1 token: ${tables[0].qrToken}`);
  console.log(`\nCustomer URL: /menu/demo-bistro/${tables[0].qrToken}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
