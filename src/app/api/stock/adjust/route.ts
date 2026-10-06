import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { Product } from "@/models/Product";
import { StockLog } from "@/models/StockLog";
import { stockAdjustSchema } from "@/lib/validators";
import { apiError, apiSuccess, handleApiError } from "@/lib/api-utils";
import { getSession } from "@/lib/auth";
import { notifyLowStock } from "@/lib/notify";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError("Unauthorized", 401);

    await connectDB();
    const body = await request.json();
    const data = stockAdjustSchema.parse(body);

    const product = await Product.findById(data.productId);
    if (!product) return apiError("Product not found", 404);

    const previousStock = product.stock;
    let newStock = previousStock;

    if (data.type === "increase" || data.type === "return") {
      newStock = previousStock + Math.abs(data.quantity);
    } else if (data.type === "decrease" || data.type === "sale") {
      newStock = Math.max(0, previousStock - Math.abs(data.quantity));
    } else {
      newStock = Math.max(0, data.quantity);
    }

    product.stock = newStock;
    await product.save();

    await StockLog.create({
      product: product._id,
      productName: product.name,
      type: data.type,
      quantity: data.quantity,
      previousStock,
      newStock,
      reason: data.reason,
      admin: session.adminId,
      adminName: session.name,
    });

    if (newStock <= product.lowStockThreshold) {
      await notifyLowStock({ _id: product._id, name: product.name, stock: newStock });
    }

    return apiSuccess(product, "Stock updated successfully");
  } catch (err) {
    return handleApiError(err);
  }
}
