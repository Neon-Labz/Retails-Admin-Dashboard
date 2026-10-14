import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { connectDB } from "@/lib/db";
import { Admin } from "@/models/Admin";
import { resetPasswordSchema } from "@/lib/validators";
import { apiError, handleApiError } from "@/lib/api-utils";
import { hashPassword } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token");
    if (!token) {
      return apiError("Reset token is required", 400);
    }

    await connectDB();
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const admin = await Admin.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!admin) {
      return apiError("This password reset link is invalid or has expired.", 400);
    }

    return NextResponse.json({
      success: true,
      message: "Token is valid",
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { token, password } = resetPasswordSchema.parse(body);

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const admin = await Admin.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    }).select("+passwordHash");

    if (!admin) {
      return apiError("This password reset link is invalid or has expired.", 400);
    }

    // Hash the new password with bcrypt
    const newPasswordHash = await hashPassword(password);
    await Admin.updateOne(
      { _id: admin._id },
      {
        $set: { passwordHash: newPasswordHash },
        $unset: { resetPasswordToken: 1, resetPasswordExpires: 1 },
      }
    );

    return NextResponse.json({
      success: true,
      message: "Your password has been successfully reset. You can now sign in.",
    });
  } catch (err) {
    return handleApiError(err);
  }
}
