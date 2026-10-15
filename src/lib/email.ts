import { Resend } from "resend";

function getResendClient() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

interface SendEmailInput {
  to: string | string[];
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailInput): Promise<{ sent: boolean; error?: string }> {
  const client = getResendClient();
  const fromAddress = process.env.EMAIL_FROM || "RKF Admin <onboarding@resend.dev>";

  if (!client) {
    console.warn(`[email] RESEND_API_KEY not configured. Skipping email to ${to} - "${subject}"`);
    return { sent: false, error: "Email provider not configured" };
  }
  try {
    await client.emails.send({ from: fromAddress, to, subject, html });
    return { sent: true };
  } catch (err) {
    console.error("[email] Failed to send email:", err);
    return { sent: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

function layout(title: string, bodyHtml: string): string {
  return `
  <div style="font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
    <h2 style="color:#111827;">${title}</h2>
    <div style="color:#374151; font-size: 14px; line-height: 1.6;">${bodyHtml}</div>
    <p style="margin-top:32px; font-size:12px; color:#9ca3af;">This is an automated message from your Admin Dashboard.</p>
  </div>`;
}

export const emailTemplates = {
  orderStatusUpdate(orderNumber: string, status: string, customerName: string) {
    return layout(
      "Order Status Update",
      `<p>Hi ${customerName},</p><p>Your order <strong>${orderNumber}</strong> status has been updated to <strong>${status.toUpperCase()}</strong>.</p>`
    );
  },
  lowStockAlert(products: Array<{ name: string; stock: number }>) {
    const rows = products
      .map((p) => `<li>${p.name} &mdash; ${p.stock} unit(s) left</li>`)
      .join("");
    return layout("Low Stock Alert", `<p>The following products are low on stock:</p><ul>${rows}</ul>`);
  },
  newOrderAlert(orderNumber: string, total: string) {
    return layout("New Order Received", `<p>A new order <strong>${orderNumber}</strong> was placed for <strong>${total}</strong>.</p>`);
  },
  newCustomerAlert(name: string, email: string) {
    return layout("New Customer Registered", `<p>${name} (${email}) just created an account.</p>`);
  },
  passwordReset(resetUrl: string) {
    return layout(
      "Reset your password",
      `
      <p style="margin-bottom: 16px;">You requested a password reset.</p>
      <p style="margin-bottom: 12px;">Click the link below (valid for 1 hour):</p>
      <p style="margin: 20px 0;">
        <a href="${resetUrl}" style="background-color: #1e293b; color: #ffffff; padding: 10px 20px; border-radius: 8px; text-decoration: none; display: inline-block; font-weight: 600; font-size: 14px;">Reset Password</a>
      </p>
      <p style="word-break: break-all; margin-bottom: 24px;">
        <a href="${resetUrl}" style="color: #2563eb; text-decoration: underline;">${resetUrl}</a>
      </p>
      <p style="font-size: 13px; color: #6b7280;">If you did not request this, ignore this email.</p>
      `
    );
  },
};
