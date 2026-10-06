import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/db";
import { User } from "@/db/schema";
import { requireUser, AuthError, verifyPassword, hashPassword } from "@/lib/auth";
import { profileUpdateSchema, passwordChangeSchema, formatZodError } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireUser();
    const body = await request.json();

    await connectDB();

    if (body.currentPassword || body.newPassword) {
      const parsed = passwordChangeSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
      }
      const dbUser = await User.findById(user.id).lean() as any;
      const valid = await verifyPassword(parsed.data.currentPassword, dbUser.passwordHash);
      if (!valid) {
        return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
      }
      const passwordHash = await hashPassword(parsed.data.newPassword);
      await User.findByIdAndUpdate(user.id, { passwordHash });
      return NextResponse.json({ message: "Password updated successfully" });
    }

    const parsed = profileUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
    }

    const updated = await User.findByIdAndUpdate(
      user.id,
      { name: parsed.data.name, phone: parsed.data.phone || null },
      { new: true, lean: true },
    ) as any;

    return NextResponse.json({
      user: {
        id: updated._id.toString(),
        name: updated.name,
        email: updated.email,
        phone: updated.phone,
        role: updated.role,
        emailVerified: updated.emailVerified,
        createdAt: updated.createdAt,
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[profile] error", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
