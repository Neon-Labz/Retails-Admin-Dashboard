import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/db";
import { User, VerificationToken } from "@/db/schema";
import { sendWelcomeEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();
    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "Missing verification token" }, { status: 400 });
    }

    await connectDB();
    const record = await VerificationToken.findOne({ token, type: "verify_email" }).lean();
    if (!record) {
      return NextResponse.json({ error: "Invalid or expired verification link" }, { status: 400 });
    }

    if ((record.expiresAt as Date).getTime() < Date.now()) {
      await VerificationToken.deleteOne({ _id: record._id });
      return NextResponse.json({ error: "This verification link has expired. Please request a new one." }, { status: 400 });
    }

    const user = await User.findByIdAndUpdate(
      record.userId,
      { emailVerified: true },
      { new: true, lean: true },
    );

    await VerificationToken.deleteMany({ userId: record.userId });

    if (user) {
      await sendWelcomeEmail((user as any).email, (user as any).name);
    }

    return NextResponse.json({ message: "Email verified successfully. You can now log in." });
  } catch (error) {
    console.error("[verify-email] error", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
