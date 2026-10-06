import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { Order } from "@/models/Order";
import { Product } from "@/models/Product";
import { orderStatusSchema } from "@/lib/validators";
import { apiError, apiSuccess, handleApiError } from "@/lib/api-utils";
import { notifyOrderStatusChange } from "@/lib/notify";

interface Params {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();
    const { status, note } = orderStatusSchema.parse(body);

    const order = await Order.findById(id);
    if (!order) return apiError("Order not found", 404);

    const previousStatus = order.status;

    if (status === "cancelled" && previousStatus !== "cancelled") {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity, totalSold: -item.quantity } });
      }
    }

    order.status = status;
    order.statusHistory.push({ status, changedAt: new Date(), note });
    await order.save();

    await notifyOrderStatusChange(order.orderNumber, status, order.customerSnapshot.email, order.customerSnapshot.name);

    return apiSuccess(order, "Order status updated successfully");
  } catch (err) {
    return handleApiError(err);
  }
}
