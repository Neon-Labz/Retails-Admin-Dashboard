import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { Order } from "@/models/Order";
import { Product } from "@/models/Product";
import { Payment } from "@/models/Payment";
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
    const { status, paymentStatus, note } = orderStatusSchema.parse(body);

    const order = await Order.findById(id);
    if (!order) return apiError("Order not found", 404);

    const previousStatus = order.status;

    if (status && status === "cancelled" && previousStatus !== "cancelled") {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity, totalSold: -item.quantity } });
      }
    }

    // If order is delivered, payment is collected/completed (paid)
    let finalPaymentStatus = paymentStatus;
    if (status === "delivered" && (!paymentStatus || paymentStatus === "pending")) {
      finalPaymentStatus = "paid";
    }

    if (status) {
      order.status = status;
      order.statusHistory.push({ status, changedAt: new Date(), note });
    }

    if (finalPaymentStatus) {
      order.paymentStatus = finalPaymentStatus;
      const paymentRecordStatus =
        finalPaymentStatus === "paid"
          ? "completed"
          : finalPaymentStatus === "failed"
          ? "failed"
          : finalPaymentStatus === "refunded"
          ? "refunded"
          : "pending";
      await Payment.updateOne(
        { order: order._id },
        {
          status: paymentRecordStatus,
          ...(finalPaymentStatus === "paid" ? { paidAt: new Date() } : {}),
        }
      );
    }

    await order.save();

    if (status) {
      await notifyOrderStatusChange(order.orderNumber, status, order.customerSnapshot.email, order.customerSnapshot.name);
    }

    return apiSuccess(order, "Order updated successfully");
  } catch (err) {
    return handleApiError(err);
  }
}
