import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { Admin } from "@/models/Admin";
import { getSession, hashPassword, verifyPassword } from "@/lib/auth";
import { apiError, apiSuccess, handleApiError } from "@/lib/api-utils";
import { adminProfileSchema, changePasswordSchema } from "@/lib/validators";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return apiError("Unauthorized", 401);
    await connectDB();
    const admin = await Admin.findById(session.adminId);
    if (!admin) return apiError("Admin not found", 404);
    return apiSuccess({
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      avatar: admin.avatar,
      lastLoginAt: admin.lastLoginAt,
      createdAt: admin.createdAt,
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError("Unauthorized", 401);
    await connectDB();
    const body = await request.json();

    if (body.currentPassword || body.newPassword) {
      const { currentPassword, newPassword } = changePasswordSchema.parse(body);
      const admin = await Admin.findById(session.adminId).select("+passwordHash");
      if (!admin) return apiError("Admin not found", 404);
      const valid = await verifyPassword(currentPassword, admin.passwordHash);
      if (!valid) return apiError("Current password is incorrect", 400);
      admin.passwordHash = await hashPassword(newPassword);
      await admin.save();
      return apiSuccess(null, "Password updated successfully");
    }

    const data = adminProfileSchema.parse(body);
    const admin = await Admin.findByIdAndUpdate(
      session.adminId,
      { name: data.name, email: data.email, avatar: data.avatar },
      { new: true }
    );
    if (!admin) return apiError("Admin not found", 404);
    return apiSuccess(
      { id: admin.id, name: admin.name, email: admin.email, role: admin.role, avatar: admin.avatar },
      "Profile updated successfully"
    );
  } catch (err) {
    return handleApiError(err);
  }
}
