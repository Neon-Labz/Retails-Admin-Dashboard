import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/db";
import { Address } from "@/db/schema";
import { requireUser, AuthError } from "@/lib/auth";
import { addressSchema, formatZodError } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireUser();
    await connectDB();
    const rows = await Address.find({ userId: user.id }).lean();
    const addresses = rows.map((a: any) => ({ ...a, id: a._id.toString() }));
    return NextResponse.json({ addresses });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[addresses:list] error", error);
    return NextResponse.json({ error: "Failed to load addresses" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const parsed = addressSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
    }

    await connectDB();

    if (parsed.data.isDefault) {
      await Address.updateMany({ userId: user.id }, { isDefault: false });
    }

    const created = await Address.create({
      userId: user.id,
      label: parsed.data.label,
      fullName: parsed.data.fullName,
      phone: parsed.data.phone,
      line1: parsed.data.line1,
      line2: parsed.data.line2 || null,
      city: parsed.data.city,
      state: parsed.data.state,
      postalCode: parsed.data.postalCode,
      country: parsed.data.country,
      isDefault: parsed.data.isDefault,
    });

    return NextResponse.json({ address: { ...created.toObject(), id: created._id.toString() } }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[addresses:create] error", error);
    return NextResponse.json({ error: "Failed to save address" }, { status: 500 });
  }
}
