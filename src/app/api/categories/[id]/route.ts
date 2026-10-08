import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { Category } from "@/models/Category";
import { Product } from "@/models/Product";
import { categorySchema } from "@/lib/validators";
import { apiError, apiSuccess, handleApiError } from "@/lib/api-utils";
import { slugify } from "@/lib/utils";
import { deleteFile } from "@/lib/r2";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const { id } = await params;
    const category = await Category.findById(id);
    if (!category) return apiError("Category not found", 404);
    return apiSuccess(category);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();
    const data = categorySchema.parse(body);
    const slug = slugify(data.name);

    const duplicate = await Category.findOne({ slug, _id: { $ne: id } });
    if (duplicate) return apiError("A category with this name already exists", 409);

    const current = await Category.findById(id);
    if (!current) return apiError("Category not found", 404);

    if (current.image && data.image && current.image !== data.image) {
      await deleteFile(current.image);
    }

    const rawSubcategories = data.subcategories || [];
    const subcategories = rawSubcategories.map((sub) => {
      if (typeof sub === "string") {
        const trimmed = sub.trim();
        return { name: trimmed, slug: slugify(trimmed) };
      }
      const trimmed = sub.name.trim();
      return {
        ...(sub._id ? { _id: sub._id } : {}),
        name: trimmed,
        slug: sub.slug ? slugify(sub.slug) : slugify(trimmed),
        description: sub.description || "",
      };
    });

    const category = await Category.findByIdAndUpdate(
      id,
      { ...data, slug, subcategories },
      { new: true }
    );
    if (!category) return apiError("Category not found", 404);
    return apiSuccess(category, "Category updated successfully");
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const { id } = await params;
    const productCount = await Product.countDocuments({ category: id });
    if (productCount > 0) {
      return apiError(
        `Cannot delete this category because it is associated with ${productCount} product(s). Reassign or delete those products first.`,
        409
      );
    }
    const category = await Category.findByIdAndDelete(id);
    if (!category) return apiError("Category not found", 404);

    if (category.image) {
      await deleteFile(category.image);
    }

    return apiSuccess(null, "Category deleted successfully");
  } catch (err) {
    return handleApiError(err);
  }
}
