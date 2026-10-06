import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/db";
import { Product, Category } from "@/db/schema";
import { productFilterSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const searchParams = Object.fromEntries(request.nextUrl.searchParams.entries());
    const parsed = productFilterSchema.safeParse(searchParams);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid filters" }, { status: 400 });
    }

    const { search, category, minPrice, maxPrice, sort, featured, inStock } = parsed.data;
    const page = parsed.data.page ?? 1;
    const limit = parsed.data.limit ?? 12;

    await connectDB();

    const filter: Record<string, any> = { isActive: true };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { brand: { $regex: search, $options: "i" } },
      ];
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined) filter.price.$gte = String(minPrice);
      if (maxPrice !== undefined) filter.price.$lte = String(maxPrice);
    }

    if (featured) filter.featured = true;
    if (inStock) filter.stock = { $gte: 1 };

    if (category) {
      const cat = await Category.findOne({ slug: category }).lean();
      if (cat) filter.categoryId = (cat as any)._id;
      else filter.categoryId = null;
    }

    let sortOption: Record<string, 1 | -1> = { createdAt: -1 };
    if (sort === "price_asc") sortOption = { price: 1 };
    if (sort === "price_desc") sortOption = { price: -1 };
    if (sort === "rating") sortOption = { rating: -1 };
    if (sort === "popular") sortOption = { reviewCount: -1 };

    const [rows, total] = await Promise.all([
      Product.find(filter)
        .sort(sortOption)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Product.countDocuments(filter),
    ]);

    const categoryIds = rows.map((p: any) => p.categoryId).filter(Boolean);
    const categoryRows = await Category.find({ _id: { $in: categoryIds } }).lean();
    const categoryMap = new Map(categoryRows.map((c: any) => [c._id.toString(), c]));
    const products = rows.map((p: any) => ({
      id: p._id.toString(),
      name: p.name,
      slug: p.slug,
      shortDescription: p.shortDescription,
      price: p.price,
      compareAtPrice: p.compareAtPrice,
      images: p.images,
      stock: p.stock,
      rating: p.rating,
      reviewCount: p.reviewCount,
      featured: p.featured,
      brand: p.brand,
      categoryName: categoryMap.get(p.categoryId?.toString())?.name ?? null,
      categorySlug: categoryMap.get(p.categoryId?.toString())?.slug ?? null,
    }));

    return NextResponse.json({
      products,
      pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    });
  } catch (error) {
    console.error("[products] error", error);
    return NextResponse.json({ error: "Failed to load products" }, { status: 500 });
  }
}
