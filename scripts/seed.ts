/**
 * Seed script — populates the database with an initial admin account and
 * default store settings.
 *
 * Dummy products, categories, customers, and orders have been removed
 * so you can add your own catalog manually through the dashboard.
 *
 * Run with: yarn seeds
 */
import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../src/lib/db";
import { Admin } from "../src/models/Admin";
import { Settings } from "../src/models/Settings";
import { hashPassword } from "../src/lib/auth";

async function main() {
  await connectDB();
  console.log("Connected to MongoDB. Initializing admin and settings...");

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
  console.log("Store settings ensured.");

  console.log("\nSetup complete! No dummy products or categories were added.");
  console.log(`Login with: ${adminEmail} / ${adminPassword}`);
  await mongoose.connection.close();
  process.exit(0);
}

main().catch((err) => {
  console.error("Setup failed:", err);
  process.exit(1);
});
