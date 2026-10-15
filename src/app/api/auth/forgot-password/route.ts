import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { connectDB } from "@/lib/db";
import { Admin } from "@/models/Admin";
import { forgotPasswordSchema } from "@/lib/validators";
import { handleApiError } from "@/lib/api-utils";
import { sendEmail, emailTemplates } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { email } = forgotPasswordSchema.parse(body);

    const normalizedEmail = email.toLowerCase().trim();
    const admin = await Admin.findOne({ email: normalizedEmail });

    // Anti-enumeration: If admin not found or inactive, respond with generic success
    if (!admin || !admin.isActive) {
      return NextResponse.json({
        success: true,
        message: "If an account exists with that email, a password reset link has been sent.",
      });
    }

    // Generate secure 32-byte hex token and store SHA-256 hash in DB
    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

    // Token expires in 1 hour
    const tokenExpiry = new Date(Date.now() + 60 * 60 * 1000);

    await Admin.updateOne(
      { _id: admin._id },
      { $set: { resetPasswordToken: hashedToken, resetPasswordExpires: tokenExpiry } }
    );

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
    const resetUrl = `${baseUrl}/reset-password?token=${rawToken}`;

    console.log("\n🔗 [Password Reset Link]:", resetUrl, "\n");

    const emailResult = await sendEmail({
      to: admin.email,
      subject: "Reset your password",
      html: emailTemplates.passwordReset(resetUrl),
    });

    if (!emailResult.sent && emailResult.error) {
      console.error("❌ [forgot-password] Email failed to send via Resend:", emailResult.error);
    } else {
      console.log("✅ [forgot-password] Email successfully dispatched via Resend to:", admin.email);
    }

    return NextResponse.json({
      success: true,
      message: "If an account exists with that email, a password reset link has been sent.",
    });
  } catch (err) {
    return handleApiError(err);
  }
}
