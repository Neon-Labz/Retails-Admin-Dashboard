import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/db";
import { User, VerificationToken } from "@/db/schema";
import { hashPassword, generateToken } from "@/lib/auth";
import { registerSchema, formatZodError } from "@/lib/validation";
import { sendVerificationEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
    }

    const { name, email, password, phone } = parsed.data;
    const normalizedEmail = email.toLowerCase();

    await connectDB();
    const existing = await User.findOne({ email: normalizedEmail }).lean();
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const user = await User.create({ name, email: normalizedEmail, passwordHash, phone: phone || null });

    const token = generateToken();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24);
    await VerificationToken.create({ userId: user._id, token, type: "verify_email", expiresAt });

    await sendVerificationEmail(user.email, user.name, token);

    return NextResponse.json({ message: "Account created. Please check your email to verify your account." });
  } catch (error) {
    console.error("[register] error", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
