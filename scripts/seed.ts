/**
 * Seed script — populates the database with an initial admin account and
 * sample catalog/customer/order data so the dashboard is usable immediately.
 *
 * Run with: npx tsx scripts/seed.ts
 */
import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../src/lib/db";
import { Admin } from "../src/models/Admin";
import { Category } from "../src/models/Category";
import { Product } from "../src/models/Product";
import { Customer } from "../src/models/Customer";
import { Order } from "../src/models/Order";
import { Payment } from "../src/models/Payment";
import { Settings } from "../src/models/Settings";
import { Notification } from "../src/models/Notification";
import { hashPassword } from "../src/lib/auth";
import { slugify, generateOrderNumber } from "../src/lib/utils";

async function main() {
  await connectDB();
  console.log("Connected to MongoDB. Seeding data...");

  const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@example.com";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "Admin@12345";
  const adminName = process.env.SEED_ADMIN_NAME || "Super Admin";

  let admin = await Admin.findOne({ email: adminEmail });
  if (!admin) {
    admin = await Admin.create({
      name: adminName,
      email: adminEmail,
      passwordHash: await hashPassword(adminPassword),
      role: "super_admin",
      isActive: true,
    });
    console.log(`Created admin account: ${adminEmail} / ${adminPassword}`);
  } else {
    console.log("Admin account already exists, skipping.");
  }

  await Settings.findOneAndUpdate(
    {},
    {
      $setOnInsert: {
        storeName: "RetailAdmin Store",
        storeEmail: adminEmail,
        storePhone: "+1 555 0100",
        storeAddress: "123 Market Street, San Francisco, CA",
        currency: "LKR",
        currencySymbol: "LKR",
      },
    },
    { upsert: true, new: true }
  );

  const categoryDefs = [
    {
      name: "Electronics",
      description: "Phones, laptops, gadgets and accessories.",
      subcategories: [
        { name: "Audio", slug: "audio" },
        { name: "Lighting", slug: "lighting" },
        { name: "Cameras", slug: "cameras" },
      ],
    },
    {
      name: "Home & Kitchen",
      description: "Appliances and kitchenware for the home.",
      subcategories: [
        { name: "Pots & Pans", slug: "pots-pans" },
        { name: "Small Appliances", slug: "small-appliances" },
      ],
    },
    {
      name: "Fashion",
      description: "Apparel, footwear and accessories.",
      subcategories: [
        { name: "Outerwear & Coats", slug: "outerwear-coats" },
        { name: "Bags & Accessories", slug: "bags-accessories" },
      ],
    },
    {
      name: "Sports & Outdoors",
      description: "Gear for fitness and outdoor activities.",
      subcategories: [
        { name: "Strength Training", slug: "strength-training" },
        { name: "Yoga & Pilates", slug: "yoga-pilates" },
      ],
    },
  ];

  const categories = [];
  for (const def of categoryDefs) {
    let category = await Category.findOne({ slug: slugify(def.name) });
    if (!category) {
      category = await Category.create({ ...def, slug: slugify(def.name) });
    } else {
      category.subcategories = def.subcategories as any;
      await category.save();
    }
    categories.push(category);
  }
  console.log(`Ensured ${categories.length} categories.`);

  const productDefs = [
    { name: "Wireless Bluetooth Headphones", category: 0, subcategory: "Audio", price: 79.99, salePrice: 59.99, sku: "ELEC-001", stock: 42, lowStockThreshold: 10 },
    { name: "Smart LED Desk Lamp", category: 0, subcategory: "Lighting", price: 34.5, salePrice: null, sku: "ELEC-002", stock: 4, lowStockThreshold: 8 },
    { name: "4K Action Camera", category: 0, subcategory: "Cameras", price: 129.0, salePrice: 99.0, sku: "ELEC-003", stock: 0, lowStockThreshold: 5 },
    { name: "Stainless Steel Cookware Set", category: 1, subcategory: "Pots & Pans", price: 149.99, salePrice: null, sku: "HOME-001", stock: 18, lowStockThreshold: 5 },
    { name: "Electric Kettle 1.7L", category: 1, subcategory: "Small Appliances", price: 29.99, salePrice: 24.99, sku: "HOME-002", stock: 3, lowStockThreshold: 6 },
    { name: "Men's Running Jacket", category: 2, subcategory: "Outerwear & Coats", price: 59.99, salePrice: null, sku: "FASH-001", stock: 25, lowStockThreshold: 10 },
    { name: "Women's Leather Handbag", category: 2, subcategory: "Bags & Accessories", price: 89.99, salePrice: 69.99, sku: "FASH-002", stock: 12, lowStockThreshold: 5 },
    { name: "Yoga Mat Premium", category: 3, subcategory: "Yoga & Pilates", price: 24.99, salePrice: null, sku: "SPORT-001", stock: 60, lowStockThreshold: 15 },
    { name: "Adjustable Dumbbell Set", category: 3, subcategory: "Strength Training", price: 199.99, salePrice: 179.99, sku: "SPORT-002", stock: 2, lowStockThreshold: 5 },
  ];

  const products = [];
  for (const def of productDefs) {
    let product = await Product.findOne({ sku: def.sku });
    if (!product) {
      product = await Product.create({
        name: def.name,
        slug: slugify(def.name),
        description: `${def.name} — sourced from trusted bulk suppliers and quality checked before listing.`,
        category: categories[def.category]._id,
        subcategory: def.subcategory,
        price: def.price,
        salePrice: def.salePrice,
        sku: def.sku,
        images: [],
        specifications: [{ key: "Warranty", value: "1 Year" }],
        stock: def.stock,
        lowStockThreshold: def.lowStockThreshold,
        status: "active",
        isFeatured: Math.random() > 0.7,
      });
    } else {
      product.subcategory = def.subcategory;
      await product.save();
    }
    products.push(product);
  }
  console.log(`Ensured ${products.length} products.`);

  const customerDefs = [
    { name: "Alice Johnson", email: "alice@example.com", phone: "+1 555 0110", isVerified: true },
    { name: "Brian Smith", email: "brian@example.com", phone: "+1 555 0111", isVerified: true },
    { name: "Carla Gomez", email: "carla@example.com", phone: "+1 555 0112", isVerified: false },
  ];

  const customers = [];
  for (const def of customerDefs) {
    let customer = await Customer.findOne({ email: def.email });
    if (!customer) {
      customer = await Customer.create({
        ...def,
        addresses: [
          { label: "Home", line1: "456 Elm Street", city: "Austin", state: "TX", postalCode: "73301", country: "USA", isDefault: true },
        ],
      });
    }
    customers.push(customer);
  }
  console.log(`Ensured ${customers.length} customers.`);

  const existingOrders = await Order.countDocuments();
  if (existingOrders === 0) {
    const statuses = ["pending", "confirmed", "processing", "shipped", "delivered"] as const;
    for (let i = 0; i < 6; i++) {
      const customer = customers[i % customers.length];
      const product = products[i % products.length];
      const quantity = (i % 3) + 1;
      const price = product.salePrice ?? product.price;
      const subtotal = price * quantity;
      const shippingFee = 5;
      const total = subtotal + shippingFee;
      const orderNumber = await generateOrderNumber();
      const status = statuses[i % statuses.length];

      const order = await Order.create({
        orderNumber: `${orderNumber}-${i}`,
        customer: customer._id,
        customerSnapshot: { name: customer.name, email: customer.email, phone: customer.phone },
        items: [
          {
            product: product._id,
            name: product.name,
            image: product.images?.[0] || "",
            sku: product.sku,
            price,
            quantity,
            subtotal,
          },
        ],
        billingAddress: customer.addresses[0],
        shippingAddress: customer.addresses[0],
        subtotal,
        shippingFee,
        total,
        paymentMethod: i % 2 === 0 ? "card" : "cod",
        paymentStatus: status === "delivered" ? "paid" : "pending",
        status,
        statusHistory: [{ status, changedAt: new Date(), note: "Seed data" }],
        createdAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
      });

      await Payment.create({
        order: order._id,
        orderNumber: order.orderNumber,
        customer: customer._id,
        amount: total,
        method: order.paymentMethod,
        status: status === "delivered" ? "completed" : "pending",
        gateway: "manual",
        paidAt: status === "delivered" ? new Date() : undefined,
      });

      customer.totalOrders = (customer.totalOrders || 0) + 1;
      customer.totalSpent = (customer.totalSpent || 0) + total;
      await customer.save();
    }
    console.log("Created 6 sample orders with payments.");
  } else {
    console.log("Orders already exist, skipping sample order creation.");
  }

  const notifCount = await Notification.countDocuments();
  if (notifCount === 0) {
    await Notification.create([
      { type: "system", title: "Welcome to RetailAdmin", message: "Your admin dashboard has been set up successfully.", isRead: false },
      { type: "low_stock", title: "Low stock alert", message: "Smart LED Desk Lamp has only 4 unit(s) left.", isRead: false, relatedType: "product", link: "/dashboard/stock" },
      { type: "out_of_stock", title: "Product out of stock", message: "4K Action Camera is now out of stock.", isRead: false, relatedType: "product", link: "/dashboard/stock" },
    ]);
    console.log("Created sample notifications.");
  }

  console.log("\nSeed complete!");
  console.log(`Login with: ${adminEmail} / ${adminPassword}`);
  await mongoose.connection.close();
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
