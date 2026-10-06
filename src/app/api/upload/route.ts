import { NextRequest, NextResponse } from "next/server";
import { requireUser, AuthError } from "@/lib/auth";
import { isR2Configured, uploadToR2 } from "@/lib/r2";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function POST(request: NextRequest) {
  try {
    await requireUser();

    if (!isR2Configured) {
      return NextResponse.json(
        {
          error:
            "Image storage is not configured yet. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME and R2_PUBLIC_URL to enable uploads.",
        },
        { status: 503 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const extension = file.type.split("/")[1] || "jpg";

    const url = await uploadToR2({
      buffer,
      contentType: file.type,
      keyPrefix: "uploads",
      fileExtension: extension,
    });

    return NextResponse.json({ url });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[upload] error", error);
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
  }
}
