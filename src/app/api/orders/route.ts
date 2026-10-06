import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { Order } from "@/models/Order";
import { Product } from "@/models/Product";
import { Customer } from "@/models/Customer";
import { Payment } from "@/models/Payment";
import { createOrderSchema } from "@/lib/validators";
import { apiError, apiSuccess, handleApiError } from "@/lib/api-utils";
import { getPaginationParams, buildPaginationMeta, generateOrderNumber, formatCurrency } from "@/lib/utils";
import { notifyNewOrder, notifyLowStock } from "@/lib/notify";

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const paymentStatus = searchParams.get("paymentStatus") || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortDir = searchParams.get("sortDir") === "asc" ? 1 : -1;
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const { page, limit, skip } = getPaginationParams(searchParams);

    const filter: Record<string, unknown> = {};
    if (search) {
      filter.$or = [
        { orderNumber: { $regex: search, $options: "i" } },
        { "customerSnapshot.name": { $regex: search, $options: "i" } },
        { "customerSnapshot.email": { $regex: search, $options: "i" } },
      ];
    }
    if (status) filter.status = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (dateFrom || dateTo) {
      const range: Record<string, Date> = {};
      if (dateFrom) range.$gte = new Date(dateFrom);
      if (dateTo) range.$lte = new Date(dateTo);
      filter.createdAt = range;
    }

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ [sortBy]: sortDir })
        .skip(skip)
        .limit(limit),
      Order.countDocuments(filter),
    ]);

    return apiSuccess({ orders, meta: buildPaginationMeta(total, page, limit) });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const data = createOrderSchema.parse(body);

    const customer = await Customer.findById(data.customerId);
    if (!customer) return apiError("Customer not found", 404);

    let subtotal = 0;
    const items = [];
    for (const item of data.items) {
      const product = await Product.findById(item.productId);
      if (!product) return apiError(`Product not found: ${item.productId}`, 404);
      if (product.stock < item.quantity) {
        return apiError(`Insufficient stock for ${product.name}. Available: ${product.stock}`, 400);
      }
      const lineSubtotal = (product.salePrice ?? product.price) * item.quantity;
      subtotal += lineSubtotal;
      items.push({
        product: product._id,
        name: product.name,
        image: product.images?.[0] || "",
        sku: product.sku,
        price: product.salePrice ?? product.price,
        quantity: item.quantity,
        subtotal: lineSubtotal,
      });

      product.stock -= item.quantity;
      product.totalSold = (product.totalSold || 0) + item.quantity;
      await product.save();
      if (product.stock <= product.lowStockThreshold) {
        await notifyLowStock({ _id: product._id, name: product.name, stock: product.stock });
      }
    }

    const total = subtotal - data.discount + data.shippingFee + data.tax;
    const orderNumber = await generateOrderNumber();

    const order = await Order.create({
      orderNumber,
      customer: customer._id,
      customerSnapshot: { name: customer.name, email: customer.email, phone: customer.phone },
      items,
      billingAddress: data.billingAddress,
      shippingAddress: data.shippingAddress,
      subtotal,
      discount: data.discount,
      shippingFee: data.shippingFee,
      tax: data.tax,
      total,
      paymentMethod: data.paymentMethod,
      notes: data.notes,
      statusHistory: [{ status: "pending", changedAt: new Date(), note: "Order created" }],
    });

    await Payment.create({
      order: order._id,
      orderNumber: order.orderNumber,
      customer: customer._id,
      amount: total,
      method: data.paymentMethod,
      status: data.paymentMethod === "cod" ? "pending" : "pending",
      gateway: "manual",
    });

    customer.totalOrders = (customer.totalOrders || 0) + 1;
    customer.totalSpent = (customer.totalSpent || 0) + total;
    await customer.save();

    await notifyNewOrder(order.orderNumber, formatCurrency(total));

    return apiSuccess(order, "Order created successfully", 201);
  } catch (err) {
    return handleApiError(err);
  }
}
