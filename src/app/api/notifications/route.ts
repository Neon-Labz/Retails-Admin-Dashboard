import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { Notification } from "@/models/Notification";
import { apiSuccess, handleApiError } from "@/lib/api-utils";
import { getPaginationParams, buildPaginationMeta } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "";
    const unreadOnly = searchParams.get("unreadOnly") === "true";
    const { page, limit, skip } = getPaginationParams(searchParams);

    const filter: Record<string, unknown> = {};
    if (type) filter.type = type;
    if (unreadOnly) filter.isRead = false;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Notification.countDocuments(filter),
      Notification.countDocuments({ isRead: false }),
    ]);

    return apiSuccess({ notifications, meta: buildPaginationMeta(total, page, limit), unreadCount });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await connectDB();
    const { action } = await request.json();
    if (action === "mark-all-read") {
      await Notification.updateMany({ isRead: false }, { isRead: true });
      return apiSuccess(null, "All notifications marked as read");
    }
    return apiSuccess(null, "No action taken");
  } catch (err) {
    return handleApiError(err);
  }
}
