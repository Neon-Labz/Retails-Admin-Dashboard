import { connectDB } from "@/lib/db";
import { Product } from "@/models/Product";

export async function generateNextSku(): Promise<string> {
  await connectDB();

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

  while (await Product.exists({ sku: { $regex: new RegExp(`^${candidate}$`, "i") } })) {
    nextNum++;
    candidate = `rkf-${String(nextNum).padStart(3, "0")}`;
  }

  return candidate;
}
