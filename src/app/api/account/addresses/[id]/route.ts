import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/db";
import { Address } from "@/db/schema";
import { requireUser, AuthError } from "@/lib/auth";
import { addressSchema, formatZodError } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const body = await request.json();
    const parsed = addressSchema.partial().safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
    }

    await connectDB();
    const existing = await Address.findOne({ _id: id, userId: user.id }).lean();
    if (!existing) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 });
    }

    if (parsed.data.isDefault) {
      await Address.updateMany({ userId: user.id }, { isDefault: false });
    }

    const updated = await Address.findByIdAndUpdate(
      id,
      { ...parsed.data, line2: parsed.data.line2 || null },
      { new: true, lean: true },
    ) as any;

    return NextResponse.json({ address: { ...updated, id: updated._id.toString() } });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[addresses:update] error", error);
    return NextResponse.json({ error: "Failed to update address" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    const { id } = await params;

    await connectDB();
    await Address.deleteOne({ _id: id, userId: user.id });

    return NextResponse.json({ message: "Address removed" });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[addresses:delete] error", error);
    return NextResponse.json({ error: "Failed to delete address" }, { status: 500 });
  }
}
