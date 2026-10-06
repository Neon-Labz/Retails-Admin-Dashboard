import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/db";
import { Product, Category } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    await connectDB();

    const raw = await Product.findOne({ slug, isActive: true }).lean();

    if (!raw) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const p = raw as any;
    const category = p.categoryId ? await Category.findById(p.categoryId).lean() : null;
    const product = {
      id: p._id.toString(),
      name: p.name,
      slug: p.slug,
      description: p.description,
      shortDescription: p.shortDescription,
      price: p.price,
      compareAtPrice: p.compareAtPrice,
      images: p.images,
      stock: p.stock,
      sku: p.sku,
      brand: p.brand,
      rating: p.rating,
      reviewCount: p.reviewCount,
      tags: p.tags,
      attributes: p.attributes ? Object.fromEntries(p.attributes) : {},
      featured: p.featured,
      categoryId: p.categoryId?.toString() ?? null,
      categoryName: category?.name ?? null,
      categorySlug: category?.slug ?? null,
    };

    const related = p.categoryId
      ? await Product.find({
          categoryId: p.categoryId,
          _id: { $ne: p._id },
          isActive: true,
        })
          .select("_id name slug shortDescription price compareAtPrice images rating reviewCount featured brand stock")
          .limit(4)
          .lean()
          .then((items) =>
            items.map((r: any) => ({
              id: r._id.toString(),
              name: r.name,
              slug: r.slug,
              price: r.price,
              compareAtPrice: r.compareAtPrice,
              images: r.images,
              rating: r.rating,
              stock: r.stock,
            })),
          )
      : [];

    return NextResponse.json({ product, related });
  } catch (error) {
    console.error("[product-detail] error", error);
    return NextResponse.json({ error: "Failed to load product" }, { status: 500 });
  }
}
