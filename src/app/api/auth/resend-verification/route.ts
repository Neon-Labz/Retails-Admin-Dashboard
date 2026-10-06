import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/db";
import { User, VerificationToken } from "@/db/schema";
import { generateToken } from "@/lib/auth";
import { sendVerificationEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    await connectDB();
    const user = await User.findOne({ email: normalizedEmail }).lean();

    if (!user || (user as any).emailVerified) {
      return NextResponse.json({
        message: "If an account exists and is unverified, a new verification email has been sent.",
      });
    }

    await VerificationToken.deleteMany({ userId: (user as any)._id });

    const token = generateToken();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24);
    await VerificationToken.create({ userId: (user as any)._id, token, type: "verify_email", expiresAt });

    await sendVerificationEmail((user as any).email, (user as any).name, token);

    return NextResponse.json({
      message: "If an account exists and is unverified, a new verification email has been sent.",
    });
  } catch (error) {
    console.error("[resend-verification] error", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
