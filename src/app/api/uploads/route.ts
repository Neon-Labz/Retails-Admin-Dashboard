import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { apiError, apiSuccess, handleApiError } from "@/lib/api-utils";
import { uploadFile, deleteFile } from "@/lib/r2";

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError("Unauthorized", 401);

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) || "products";

    if (!file) return apiError("No file provided", 400);
    if (!ALLOWED_TYPES.includes(file.type)) return apiError("Unsupported file type. Use JPG, PNG, WEBP or GIF.", 400);
    if (file.size > MAX_SIZE) return apiError("File is too large. Maximum size is 5MB.", 400);

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await uploadFile(buffer, file.name, file.type, folder);

    return apiSuccess(result, "File uploaded successfully", 201);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError("Unauthorized", 401);
    const { key } = await request.json();
    if (!key) return apiError("File key is required", 400);
    await deleteFile(key);
    return apiSuccess(null, "File deleted successfully");
  } catch (err) {
    return handleApiError(err);
  }
}
