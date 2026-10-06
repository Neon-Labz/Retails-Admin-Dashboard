import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/db";
import { User } from "@/db/schema";
import { verifyPassword, createSession, setSessionCookie } from "@/lib/auth";
import { loginSchema, formatZodError } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
    }

    const { email, password } = parsed.data;
    const normalizedEmail = email.toLowerCase();

    await connectDB();
    const user = await User.findOne({ email: normalizedEmail }).lean();
    if (!user) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const valid = await verifyPassword(password, user.passwordHash as string);
    if (!valid) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    if (!user.emailVerified) {
      return NextResponse.json(
        { error: "Please verify your email before logging in.", code: "EMAIL_NOT_VERIFIED" },
        { status: 403 },
      );
    }

    const userAgent = request.headers.get("user-agent");
    const { token, expiresAt } = await createSession((user._id as any).toString(), userAgent);
    await setSessionCookie(token, expiresAt);

    return NextResponse.json({
      user: {
        id: (user._id as any).toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
      },
    });
  } catch (error) {
    console.error("[login] error", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
