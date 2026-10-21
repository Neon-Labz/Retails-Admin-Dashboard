import path from "node:path";
import fs from "node:fs/promises";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import sharp from "sharp";
import mongoose from "mongoose";
import dns from "node:dns";

try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch {}

const TARGET_PRODUCTS = [
  "Sweet Bunny Kids Stationery Set with Coin Purse",
  "Space Astronaut Stationery Set No. 907 (Dream Space Edition)",
];

async function run() {
  const { Product } = await import("../src/models/Product");
  const { uploadFile, isR2Configured } = await import("../src/lib/r2");

  console.log("=== RESIZING 2 STATIONERY PRODUCTS ===");
  console.log(`Cloudflare R2 configured: ${isR2Configured ? "YES" : "NO"}`);

  await mongoose.connect(process.env.MONGODB_URI as string, { serverSelectionTimeoutMS: 25000 });
  console.log("Connected to MongoDB Atlas.");

  for (const name of TARGET_PRODUCTS) {
    const cleanSearchName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const product = await Product.findOne({
      name: { $regex: new RegExp(cleanSearchName, "i") },
    });

    if (!product) {
      console.warn(`Product not found: "${name}"`);
      continue;
    }

    const currentUrl = product.images[0];
    console.log(`\nProcessing: "${product.name}"`);
    console.log(`  Source: ${currentUrl}`);

    let inputBuffer: Buffer;
    if (currentUrl.startsWith("http://") || currentUrl.startsWith("https://")) {
      console.log(`  Fetching from R2...`);
      const res = await fetch(currentUrl);
      if (!res.ok) throw new Error("Fetch failed: " + res.statusText);
      inputBuffer = Buffer.from(await res.arrayBuffer());
    } else {
      const localRel = currentUrl.replace(/^\/+/, "");
      inputBuffer = await fs.readFile(path.join(process.cwd(), "public", localRel));
    }

    const metadata = await sharp(inputBuffer).metadata();
    console.log(`  Original size: ${metadata.width}w x ${metadata.height}h`);

    const canvasSize = 1000;
    const innerMaxSize = 880;

    const resizedInner = await sharp(inputBuffer)
      .resize({
        width: innerMaxSize,
        height: innerMaxSize,
        fit: "inside",
        withoutEnlargement: false,
      })
      .toBuffer();

    const finalSquareBuffer = await sharp(resizedInner)
      .resize({
        width: canvasSize,
        height: canvasSize,
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png({ compressionLevel: 8 })
      .toBuffer();

    const newFilename = `${product.slug}-sq-${Date.now()}.png`;
    console.log(`  Uploading 1000x1000 square to Cloudflare R2...`);
    const uploadRes = await uploadFile(finalSquareBuffer, newFilename, "image/png", "products");
    console.log(`  ✓ New R2 URL: ${uploadRes.url}`);

    product.images = [uploadRes.url];
    product.imageKeys = [uploadRes.key];
    await product.save();

    console.log(`  ✓ Database updated for "${product.name}"!`);
  }

  await mongoose.disconnect();
  console.log("\nDone!");
  process.exit(0);
}

run().catch((e) => {
  console.error("Error:", e);
  process.exit(1);
});
