import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const passwordHash = await bcrypt.hash("demo123", 10);
  const adminPasswordHash = await bcrypt.hash("admin123", 10);

  const starterPlan = await prisma.subscriptionPlan.upsert({
    where: { id: "plan_starter" },
    update: { isPublic: true, isFeatured: false, sortOrder: 1, displayPrice: "$29", billingInterval: "month" },
    create: {
      id: "plan_starter",
      name: "Starter",
      description: "Perfect for small restaurants and cafés",
      price: 29,
      displayPrice: "$29",
      billingInterval: "month",
      maxTables: 10,
      maxMenuItems: 50,
      maxStaffUsers: 2,
      isActive: true,
      isPublic: true,
      isFeatured: false,
      sortOrder: 1,
    },
  });

  await prisma.subscriptionPlan.upsert({
    where: { id: "plan_growth" },
    update: { isPublic: true, isFeatured: true, sortOrder: 2, displayPrice: "$69", billingInterval: "month" },
    create: {
      id: "plan_growth",
      name: "Growth",
      description: "For growing restaurants with more needs",
      price: 69,
      displayPrice: "$69",
      billingInterval: "month",
      maxTables: 30,
      maxMenuItems: 150,
      maxStaffUsers: 5,
      isActive: true,
      isPublic: true,
      isFeatured: true,
      sortOrder: 2,
    },
  });

  await prisma.subscriptionPlan.upsert({
    where: { id: "plan_pro" },
    update: { isPublic: true, isFeatured: false, sortOrder: 3, displayPrice: "$149", billingInterval: "month" },
    create: {
      id: "plan_pro",
      name: "Professional",
      description: "Full features for established restaurants",
      price: 149,
      displayPrice: "$149",
      billingInterval: "month",
      maxTables: 100,
      maxMenuItems: 500,
      maxStaffUsers: 20,
      isActive: true,
      isPublic: true,
      isFeatured: false,
      sortOrder: 3,
    },
  });

  await prisma.user.upsert({
    where: { email: "admin@platform.com" },
    update: {},
    create: {
      name: "Platform Admin",
      email: "admin@platform.com",
      passwordHash: adminPasswordHash,
      role: "PLATFORM_ADMIN",
      isActive: true,
    },
  });

  const restaurant = await prisma.restaurant.upsert({
    where: { slug: "demo-bistro" },
    update: { status: "ACTIVE", onboardingCompleted: true },
    create: {
      name: "Demo Bistro",
      slug: "demo-bistro",
      phone: "+1 555-0100",
      address: "123 Main Street, Downtown",
      status: "ACTIVE",
      onboardingCompleted: true,
      primaryColor: "#f97316",
    },
  });

  await prisma.user.upsert({
    where: { email: "demo@restaurant.com" },
    update: { restaurantId: restaurant.id, role: "MERCHANT_OWNER" },
    create: {
      name: "Demo Owner",
      email: "demo@restaurant.com",
      passwordHash,
      role: "MERCHANT_OWNER",
      isActive: true,
      restaurantId: restaurant.id,
    },
  });

  await prisma.restaurantSubscription.upsert({
    where: { restaurantId: restaurant.id },
    update: {},
    create: {
      restaurantId: restaurant.id,
      planId: starterPlan.id,
      status: "ACTIVE",
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
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
    { id: "item_classic_burger", categoryId: burgers.id, name: "Classic Burger", description: "100% beef patty, lettuce, tomato, special sauce", price: 12.99, sortOrder: 1 },
    { id: "item_cheese_burger", categoryId: burgers.id, name: "Cheeseburger", description: "Beef patty with melted cheddar, pickles, mustard", price: 13.99, sortOrder: 2 },
    { id: "item_chicken_burger", categoryId: burgers.id, name: "Crispy Chicken", description: "Crispy fried chicken fillet, coleslaw, honey mustard", price: 13.49, sortOrder: 3 },
    { id: "item_fries", categoryId: sides.id, name: "French Fries", description: "Golden crispy fries with seasoning", price: 4.99, sortOrder: 1 },
    { id: "item_rings", categoryId: sides.id, name: "Onion Rings", description: "Crispy battered onion rings", price: 5.49, sortOrder: 2 },
    { id: "item_soda", categoryId: drinks.id, name: "Soft Drink", description: "Coke, Sprite, or Orange - your choice", price: 2.99, sortOrder: 1 },
    { id: "item_water", categoryId: drinks.id, name: "Still Water", description: "500ml bottle", price: 1.99, sortOrder: 2 },
    { id: "item_shake", categoryId: drinks.id, name: "Milkshake", description: "Vanilla, chocolate, or strawberry", price: 5.99, sortOrder: 3 },
  ];

  for (const item of menuItems) {
    await prisma.menuItem.upsert({
      where: { id: item.id },
      update: {},
      create: { ...item, restaurantId: restaurant.id, isAvailable: true },
    });
  }

  console.log("Seed complete!");
  console.log(`\nPlatform Admin: admin@platform.com / admin123`);
  console.log(`Merchant Demo:  demo@restaurant.com / demo123`);
  console.log(`Restaurant slug: demo-bistro`);
  console.log(`Table 1 token: ${tables[0].qrToken}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
