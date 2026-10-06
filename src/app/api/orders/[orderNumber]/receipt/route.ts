import { NextRequest, NextResponse } from "next/server";
import PDFDocument from "pdfkit";
import { connectDB } from "@/db";
import { Order, OrderItem } from "@/db/schema";
import { requireVerifiedUser, AuthError } from "@/lib/auth";
import { formatCurrency, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> },
) {
  try {
    const user = await requireVerifiedUser();
    const { orderNumber } = await params;

    await connectDB();
    const order = await Order.findOne({ orderNumber }).lean() as any;

    if (!order || order.userId.toString() !== user.id) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const items = await OrderItem.find({ orderId: order._id }).lean() as any[];

    const pdfBuffer = await generateReceiptPdf(order, items);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="receipt-${order.orderNumber}.pdf"`,
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[receipt] error", error);
    return NextResponse.json({ error: "Failed to generate receipt" }, { status: 500 });
  }
}

function generateReceiptPdf(order: any, items: any[]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const billing = order.billingAddress instanceof Map
      ? Object.fromEntries(order.billingAddress)
      : order.billingAddress as Record<string, string>;
    const shipping = order.shippingAddress instanceof Map
      ? Object.fromEntries(order.shippingAddress)
      : order.shippingAddress as Record<string, string>;

    doc.fillColor("#1e3a8a").fontSize(24).font("Helvetica-Bold").text("BulkMart", 50, 50);
    doc.fillColor("#64748b").fontSize(10).font("Helvetica").text("Bulk-bought, better priced.", 50, 78);
    doc.fillColor("#0f172a").fontSize(18).font("Helvetica-Bold").text("Order Receipt", 350, 50, { align: "right" });
    doc.fontSize(10).font("Helvetica").fillColor("#334155")
      .text(`Order #: ${order.orderNumber}`, 350, 75, { align: "right" })
      .text(`Date: ${formatDate(order.createdAt)}`, 350, 90, { align: "right" })
      .text(`Payment: ${order.paymentMethod.replace(/_/g, " ")}`, 350, 105, { align: "right" });

    doc.moveTo(50, 130).lineTo(545, 130).strokeColor("#e2e8f0").stroke();

    doc.fontSize(11).font("Helvetica-Bold").fillColor("#0f172a").text("Billing to", 50, 145);
    doc.font("Helvetica").fontSize(10).fillColor("#334155")
      .text(billing.fullName || order.customerName, 50, 162)
      .text(billing.line1 || "", 50, 176)
      .text(`${billing.city || ""}, ${billing.state || ""} ${billing.postalCode || ""}`, 50, 190)
      .text(billing.country || "", 50, 204)
      .text(billing.phone || "", 50, 218);

    doc.fontSize(11).font("Helvetica-Bold").fillColor("#0f172a").text("Shipping to", 300, 145);
    doc.font("Helvetica").fontSize(10).fillColor("#334155")
      .text(shipping.fullName || order.customerName, 300, 162)
      .text(shipping.line1 || "", 300, 176)
      .text(`${shipping.city || ""}, ${shipping.state || ""} ${shipping.postalCode || ""}`, 300, 190)
      .text(shipping.country || "", 300, 204)
      .text(shipping.phone || "", 300, 218);

    let y = 250;
    doc.rect(50, y, 495, 24).fill("#0f172a");
    doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(10)
      .text("Item", 60, y + 7)
      .text("Qty", 330, y + 7, { width: 40, align: "right" })
      .text("Price", 390, y + 7, { width: 60, align: "right" })
      .text("Total", 470, y + 7, { width: 65, align: "right" });

    y += 24;
    doc.font("Helvetica").fontSize(10).fillColor("#0f172a");

    items.forEach((item, idx) => {
      const rowHeight = 24;
      if (idx % 2 === 0) { doc.rect(50, y, 495, rowHeight).fill("#f8fafc"); doc.fillColor("#0f172a"); }
      doc.fillColor("#0f172a")
        .text(item.name, 60, y + 7, { width: 260 })
        .text(String(item.quantity), 330, y + 7, { width: 40, align: "right" })
        .text(formatCurrency(item.price), 390, y + 7, { width: 60, align: "right" })
        .text(formatCurrency(item.lineTotal), 470, y + 7, { width: 65, align: "right" });
      y += rowHeight;
    });

    y += 10;
    doc.moveTo(300, y).lineTo(545, y).strokeColor("#e2e8f0").stroke();
    y += 10;

    const summaryRow = (label: string, value: string, bold = false) => {
      doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(bold ? 12 : 10).fillColor("#0f172a")
        .text(label, 350, y, { width: 100 })
        .text(value, 470, y, { width: 65, align: "right" });
      y += bold ? 20 : 16;
    };

    summaryRow("Subtotal", formatCurrency(order.subtotal));
    summaryRow("Discount", `-${formatCurrency(order.discount)}`);
    summaryRow("Shipping", formatCurrency(order.shippingFee));
    summaryRow("Tax", formatCurrency(order.tax));
    y += 4;
    doc.moveTo(350, y).lineTo(545, y).strokeColor("#0f172a").stroke();
    y += 8;
    summaryRow("Total", formatCurrency(order.total), true);

    y += 30;
    doc.font("Helvetica").fontSize(9).fillColor("#94a3b8")
      .text("Thank you for shopping with BulkMart. For questions about this order, contact support@bulkmart.example with your order number.", 50, y, { width: 495 });

    doc.end();
  });
}
