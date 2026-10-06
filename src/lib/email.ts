import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
const fromAddress = process.env.EMAIL_FROM || "Admin Dashboard <onboarding@resend.dev>";

const resend = apiKey ? new Resend(apiKey) : null;

interface SendEmailInput {
  to: string | string[];
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailInput): Promise<{ sent: boolean; error?: string }> {
  if (!resend) {
    console.warn(`[email] RESEND_API_KEY not configured. Skipping email to ${to} - "${subject}"`);
    return { sent: false, error: "Email provider not configured" };
  }
  try {
    await resend.emails.send({ from: fromAddress, to, subject, html });
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
};
