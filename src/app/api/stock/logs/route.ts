import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { StockLog } from "@/models/StockLog";
import { apiSuccess, handleApiError } from "@/lib/api-utils";
import { getPaginationParams, buildPaginationMeta } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");
    const { page, limit, skip } = getPaginationParams(searchParams);

    const filter: Record<string, unknown> = {};
    if (productId) filter.product = productId;

    const [logs, total] = await Promise.all([
      StockLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      StockLog.countDocuments(filter),
    ]);

    return apiSuccess({ logs, meta: buildPaginationMeta(total, page, limit) });
  } catch (err) {
    return handleApiError(err);
  }
}
