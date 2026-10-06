import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { Product } from "@/models/Product";
import { productSchema } from "@/lib/validators";
import { apiError, apiSuccess, handleApiError } from "@/lib/api-utils";
import { slugify, getPaginationParams, buildPaginationMeta } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const status = searchParams.get("status") || "";
    const stockFilter = searchParams.get("stockFilter") || ""; // low | out
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortDir = searchParams.get("sortDir") === "asc" ? 1 : -1;
    const { page, limit, skip } = getPaginationParams(searchParams);

    const filter: Record<string, unknown> = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { sku: { $regex: search, $options: "i" } },
      ];
    }
    if (category) filter.category = category;
    if (status) filter.status = status;
    if (stockFilter === "out") filter.stock = { $lte: 0 };
    if (stockFilter === "low") {
      filter.$expr = { $and: [{ $gt: ["$stock", 0] }, { $lte: ["$stock", "$lowStockThreshold"] }] };
    }

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate("category", "name slug")
        .sort({ [sortBy]: sortDir })
        .skip(skip)
        .limit(limit),
      Product.countDocuments(filter),
    ]);

    return apiSuccess({ products, meta: buildPaginationMeta(total, page, limit) });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const data = productSchema.parse(body);

    const existingSku = await Product.findOne({ sku: data.sku.toUpperCase() });
    if (existingSku) return apiError("A product with this SKU already exists", 409);

    let slug = slugify(data.name);
    const slugExists = await Product.findOne({ slug });
    if (slugExists) slug = `${slug}-${Date.now().toString().slice(-5)}`;

    const product = await Product.create({ ...data, slug });
    return apiSuccess(product, "Product created successfully", 201);
  } catch (err) {
    return handleApiError(err);
  }
}
