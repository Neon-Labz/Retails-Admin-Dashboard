import { NextResponse } from "next/server";
import { connectDB } from "@/db";
import { Category, Product } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectDB();

    const categories = await Category.find().sort({ name: 1 }).lean();

    const result = await Promise.all(
      categories.map(async (cat: any) => {
        const productCount = await Product.countDocuments({ categoryId: cat._id, isActive: true });
        return {
          id: cat._id.toString(),
          name: cat.name,
          slug: cat.slug,
          description: cat.description,
          image: cat.image,
          productCount,
        };
      }),
    );

    return NextResponse.json({ categories: result });
  } catch (error) {
    console.error("[categories] error", error);
    return NextResponse.json({ error: "Failed to load categories" }, { status: 500 });
  }
}
