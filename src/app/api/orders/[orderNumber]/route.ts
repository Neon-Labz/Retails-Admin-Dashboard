import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/db";
import { Order, OrderItem } from "@/db/schema";
import { requireVerifiedUser, AuthError } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> },
) {
  try {
    const user = await requireVerifiedUser();
    const { orderNumber } = await params;

    await connectDB();
    const order = await Order.findOne({ orderNumber }).lean();

    if (!order || (order as any).userId.toString() !== user.id) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const items = await OrderItem.find({ orderId: (order as any)._id }).lean();

    return NextResponse.json({
      order: { ...(order as any), id: (order as any)._id.toString() },
      items: items.map((i: any) => ({ ...i, id: i._id.toString() })),
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[order-detail] error", error);
    return NextResponse.json({ error: "Failed to load order" }, { status: 500 });
  }
}
