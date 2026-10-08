import { connectDB } from "@/lib/db";
import { Product } from "@/models/Product";

/**
 * Automatically generates the next sequential SKU code with format: rkf-001, rkf-002, etc.
 * Finds the highest number among existing rkf-XXX SKUs, increments by 1, and pads to at least 3 digits.
 */
export async function generateNextSku(): Promise<string> {
  await connectDB();

  // Find all products where SKU matches rkf-<number> case-insensitively
  const products = await Product.find(
    { sku: { $regex: /^rkf-(\d+)$/i } },
    { sku: 1 }
  ).lean();

  let maxNum = 0;
  for (const p of products) {
    if (typeof p.sku === "string") {
      const match = p.sku.match(/^rkf-(\d+)$/i);
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    }
  }

  let nextNum = maxNum + 1;
  let candidate = `rkf-${String(nextNum).padStart(3, "0")}`;

  // Double check candidate does not clash with any existing product
  while (await Product.exists({ sku: { $regex: new RegExp(`^${candidate}$`, "i") } })) {
    nextNum++;
    candidate = `rkf-${String(nextNum).padStart(3, "0")}`;
  }

  return candidate;
}
