import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/db";
import { Order, OrderItem, Product } from "@/db/schema";
import { requireVerifiedUser, AuthError } from "@/lib/auth";
import { checkoutSchema, formatZodError } from "@/lib/validation";
import { generateOrderNumber } from "@/lib/utils";
import { sendOrderConfirmationEmail } from "@/lib/email";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

const FREE_SHIPPING_THRESHOLD = 100;
const STANDARD_SHIPPING_FEE = 9.99;
const BULK_DISCOUNT_THRESHOLD = 300;
const BULK_DISCOUNT_RATE = 0.05;

export async function GET() {
  try {
    const user = await requireVerifiedUser();
    await connectDB();

    const orders = await Order.find({ userId: user.id }).sort({ createdAt: -1 }).lean();

    const result = await Promise.all(
      orders.map(async (order: any) => {
        const itemCount = await OrderItem.countDocuments({ orderId: order._id });
        return {
          id: order._id.toString(),
          orderNumber: order.orderNumber,
          status: order.status,
          paymentStatus: order.paymentStatus,
          total: order.total,
          currency: order.currency,
          createdAt: order.createdAt,
          itemCount,
        };
      }),
    );

    return NextResponse.json({ orders: result });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[orders:list] error", error);
    return NextResponse.json({ error: "Failed to load orders" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireVerifiedUser();
    const body = await request.json();
    const parsed = checkoutSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
    }

    const { items, billingAddress, shippingAddress, paymentMethod, notes, sameAsBilling } = parsed.data;
    const finalShippingAddress = sameAsBilling ? billingAddress : shippingAddress;

    const toAddressRecord = (addr: typeof billingAddress): Record<string, string> => ({
      label: addr.label,
      fullName: addr.fullName,
      phone: addr.phone,
      line1: addr.line1,
      line2: addr.line2 || "",
      city: addr.city,
      state: addr.state,
      postalCode: addr.postalCode,
      country: addr.country,
    });

    await connectDB();

    const productIds = items.map((item) => new mongoose.Types.ObjectId(item.productId));
    const dbProducts = await Product.find({ _id: { $in: productIds } }).lean();
    const productMap = new Map(dbProducts.map((p: any) => [p._id.toString(), p]));

    const lineItems: {
      productId: string;
      name: string;
      image: string | null;
      price: number;
      quantity: number;
      lineTotal: number;
    }[] = [];

    for (const item of items) {
      const product = productMap.get(item.productId) as any;
      if (!product || !product.isActive) {
        return NextResponse.json({ error: "One of the products in your cart is no longer available." }, { status: 400 });
      }
      if (product.stock < item.quantity) {
        return NextResponse.json(
          { error: `Only ${product.stock} unit(s) of "${product.name}" left in stock.` },
          { status: 409 },
        );
      }
      const price = Number(product.price);
      lineItems.push({
        productId: product._id.toString(),
        name: product.name,
        image: product.images?.[0] ?? null,
        price,
        quantity: item.quantity,
        lineTotal: Number((price * item.quantity).toFixed(2)),
      });
    }

    const subtotal = Number(lineItems.reduce((sum, item) => sum + item.lineTotal, 0).toFixed(2));
    const discount = subtotal >= BULK_DISCOUNT_THRESHOLD ? Number((subtotal * BULK_DISCOUNT_RATE).toFixed(2)) : 0;
    const shippingFee = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_FEE;
    const tax = 0;
    const total = Number((subtotal - discount + shippingFee + tax).toFixed(2));
    const orderNumber = generateOrderNumber();

    const order = await Order.create({
      orderNumber,
      userId: user.id,
      status: "pending",
      paymentStatus: "unpaid",
      paymentMethod,
      subtotal: subtotal.toFixed(2),
      discount: discount.toFixed(2),
      shippingFee: shippingFee.toFixed(2),
      tax: tax.toFixed(2),
      total: total.toFixed(2),
      billingAddress: toAddressRecord(billingAddress),
      shippingAddress: toAddressRecord(finalShippingAddress!),
      customerEmail: user.email,
      customerName: user.name,
      notes: notes || null,
    });

    await OrderItem.insertMany(
      lineItems.map((item) => ({
        orderId: order._id,
        productId: item.productId,
        name: item.name,
        image: item.image,
        price: item.price.toFixed(2),
        quantity: item.quantity,
        lineTotal: item.lineTotal.toFixed(2),
      })),
    );

    for (const item of lineItems) {
      await Product.findByIdAndUpdate(item.productId, { $inc: { stock: -item.quantity } });
    }

    sendOrderConfirmationEmail({
      to: user.email,
      name: user.name,
      orderNumber: order.orderNumber,
      items: lineItems,
      subtotal,
      discount,
      shippingFee,
      tax,
      total,
      createdAt: order.createdAt,
      paymentMethod,
      shippingAddress: toAddressRecord(finalShippingAddress!),
    }).catch((err) => console.error("[orders] failed to send confirmation email", err));

    return NextResponse.json({ order: { ...order.toObject(), id: order._id.toString() } }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[orders:create] error", error);
    return NextResponse.json({ error: "Failed to place order. Please try again." }, { status: 500 });
  }
}
