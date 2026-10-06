import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { Payment } from "@/models/Payment";
import { apiSuccess, handleApiError } from "@/lib/api-utils";
import { getPaginationParams, buildPaginationMeta } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const method = searchParams.get("method") || "";
    const { page, limit, skip } = getPaginationParams(searchParams);

    const filter: Record<string, unknown> = {};
    if (search) filter.orderNumber = { $regex: search, $options: "i" };
    if (status) filter.status = status;
    if (method) filter.method = method;

    const [payments, total, summary] = await Promise.all([
      Payment.find(filter)
        .populate("customer", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Payment.countDocuments(filter),
      Payment.aggregate([{ $group: { _id: "$status", total: { $sum: "$amount" }, count: { $sum: 1 } } }]),
    ]);

    return apiSuccess({ payments, meta: buildPaginationMeta(total, page, limit), summary });
  } catch (err) {
    return handleApiError(err);
  }
}
