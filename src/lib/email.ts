import "server-only";
import { Resend } from "resend";
import { formatCurrency, formatDateTime } from "@/lib/utils";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "BulkMart <onboarding@resend.dev>";
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

async function sendEmail(options: { to: string; subject: string; html: string }) {
  if (!resend) {
    console.warn(
      `[email] RESEND_API_KEY not configured. Skipping send to ${options.to} - "${options.subject}"`,
    );
    return { skipped: true };
  }

  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
    return result;
  } catch (error) {
    console.error("[email] Failed to send email", error);
    return { error };
  }
}

function layout(title: string, bodyHtml: string) {
  return `
  <div style="background:#f4f5f7;padding:32px 16px;font-family:'Helvetica Neue',Arial,sans-serif;">
    <table style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 10px 30px rgba(15,23,42,0.08);">
      <tr>
        <td style="background:linear-gradient(135deg,#0f172a,#1e3a8a);padding:28px 32px;">
          <span style="color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.02em;">BulkMart</span>
        </td>
      </tr>
      <tr>
        <td style="padding:32px;color:#0f172a;">
          <h1 style="font-size:20px;margin:0 0 16px;">${title}</h1>
          ${bodyHtml}
        </td>
      </tr>
      <tr>
        <td style="padding:20px 32px;background:#f8fafc;color:#64748b;font-size:12px;">
          © ${new Date().getFullYear()} BulkMart. Bulk-bought, better priced.
        </td>
      </tr>
    </table>
  </div>`;
}

export async function sendVerificationEmail(to: string, name: string, token: string) {
  const verifyUrl = `${APP_URL}/verify-email?token=${token}`;
  const html = layout(
    `Hi ${name}, verify your email`,
    `
      <p style="font-size:14px;line-height:1.6;color:#334155;">
        Thanks for creating an account with BulkMart. Please confirm your email address to
        activate your account and start shopping bulk-priced products.
      </p>
      <p style="text-align:center;margin:28px 0;">
        <a href="${verifyUrl}" style="background:#1e3a8a;color:#fff;padding:12px 28px;border-radius:999px;text-decoration:none;font-weight:600;font-size:14px;display:inline-block;">
          Verify my email
        </a>
      </p>
      <p style="font-size:12px;color:#94a3b8;">
        Or copy this link into your browser: <br/>
        <a href="${verifyUrl}" style="color:#1e3a8a;">${verifyUrl}</a>
      </p>
      <p style="font-size:12px;color:#94a3b8;">This link expires in 24 hours.</p>
    `,
  );

  return sendEmail({ to, subject: "Verify your email address – BulkMart", html });
}

export async function sendWelcomeEmail(to: string, name: string) {
  const html = layout(
    `Welcome aboard, ${name}!`,
    `<p style="font-size:14px;line-height:1.6;color:#334155;">Your email has been verified. You can now sign in and start shopping bulk-priced products on BulkMart.</p>`,
  );
  return sendEmail({ to, subject: "Your BulkMart account is verified", html });
}

type ReceiptItem = {
  name: string;
  quantity: number;
  price: string | number;
  lineTotal: string | number;
};

export async function sendOrderConfirmationEmail(params: {
  to: string;
  name: string;
  orderNumber: string;
  items: ReceiptItem[];
  subtotal: string | number;
  discount: string | number;
  shippingFee: string | number;
  tax: string | number;
  total: string | number;
  createdAt: Date | string;
  paymentMethod: string;
  shippingAddress: Record<string, string>;
}) {
  const rows = params.items
    .map(
      (item) => `
        <tr>
          <td style="padding:8px 0;font-size:13px;color:#0f172a;">${item.name} × ${item.quantity}</td>
          <td style="padding:8px 0;font-size:13px;color:#0f172a;text-align:right;">${formatCurrency(item.lineTotal)}</td>
        </tr>`,
    )
    .join("");

  const html = layout(
    `Order confirmed 🎉`,
    `
      <p style="font-size:14px;line-height:1.6;color:#334155;">
        Hi ${params.name}, thanks for your order! We're getting it ready. Here's your receipt.
      </p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <tr>
          <td style="font-size:12px;color:#64748b;padding:4px 0;">Order number</td>
          <td style="font-size:12px;color:#0f172a;text-align:right;font-weight:600;">${params.orderNumber}</td>
        </tr>
        <tr>
          <td style="font-size:12px;color:#64748b;padding:4px 0;">Order date</td>
          <td style="font-size:12px;color:#0f172a;text-align:right;">${formatDateTime(params.createdAt)}</td>
        </tr>
        <tr>
          <td style="font-size:12px;color:#64748b;padding:4px 0;">Payment method</td>
          <td style="font-size:12px;color:#0f172a;text-align:right;">${params.paymentMethod}</td>
        </tr>
      </table>
      <table style="width:100%;border-collapse:collapse;border-top:1px solid #e2e8f0;padding-top:8px;">
        ${rows}
      </table>
      <table style="width:100%;border-collapse:collapse;margin-top:12px;border-top:1px solid #e2e8f0;padding-top:8px;">
        <tr><td style="font-size:13px;color:#64748b;padding:4px 0;">Subtotal</td><td style="font-size:13px;text-align:right;">${formatCurrency(params.subtotal)}</td></tr>
        <tr><td style="font-size:13px;color:#64748b;padding:4px 0;">Discount</td><td style="font-size:13px;text-align:right;">-${formatCurrency(params.discount)}</td></tr>
        <tr><td style="font-size:13px;color:#64748b;padding:4px 0;">Shipping</td><td style="font-size:13px;text-align:right;">${formatCurrency(params.shippingFee)}</td></tr>
        <tr><td style="font-size:13px;color:#64748b;padding:4px 0;">Tax</td><td style="font-size:13px;text-align:right;">${formatCurrency(params.tax)}</td></tr>
        <tr><td style="font-size:15px;font-weight:700;padding:8px 0;">Total</td><td style="font-size:15px;font-weight:700;text-align:right;">${formatCurrency(params.total)}</td></tr>
      </table>
      <p style="font-size:13px;color:#334155;margin-top:20px;">
        Shipping to: ${params.shippingAddress.fullName}, ${params.shippingAddress.line1}, ${params.shippingAddress.city}, ${params.shippingAddress.state} ${params.shippingAddress.postalCode}, ${params.shippingAddress.country}
      </p>
      <p style="text-align:center;margin:28px 0 8px;">
        <a href="${APP_URL}/dashboard/orders/${params.orderNumber}" style="background:#1e3a8a;color:#fff;padding:12px 28px;border-radius:999px;text-decoration:none;font-weight:600;font-size:14px;display:inline-block;">
          View order & download receipt
        </a>
      </p>
    `,
  );

  return sendEmail({
    to: params.to,
    subject: `Order confirmed – ${params.orderNumber}`,
    html,
  });
}

export async function sendOrderStatusUpdateEmail(params: {
  to: string;
  name: string;
  orderNumber: string;
  status: string;
}) {
  const html = layout(
    `Your order is ${params.status}`,
    `<p style="font-size:14px;line-height:1.6;color:#334155;">Hi ${params.name}, your order <strong>${params.orderNumber}</strong> status has been updated to <strong>${params.status}</strong>.</p>
     <p style="text-align:center;margin:28px 0 8px;">
        <a href="${APP_URL}/dashboard/orders/${params.orderNumber}" style="background:#1e3a8a;color:#fff;padding:12px 28px;border-radius:999px;text-decoration:none;font-weight:600;font-size:14px;display:inline-block;">
          Track my order
        </a>
      </p>`,
  );
  return sendEmail({ to: params.to, subject: `Order ${params.orderNumber} update`, html });
}
