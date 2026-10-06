import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { Product } from "@/models/Product";
import { Order } from "@/models/Order";
import { productSchema } from "@/lib/validators";
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
    const product = await Product.findById(id).populate("category", "name slug");
    if (!product) return apiError("Product not found", 404);
    return apiSuccess(product);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();
    const data = productSchema.parse(body);

    const duplicateSku = await Product.findOne({ sku: data.sku.toUpperCase(), _id: { $ne: id } });
    if (duplicateSku) return apiError("A product with this SKU already exists", 409);

    const current = await Product.findById(id);
    if (!current) return apiError("Product not found", 404);

    let slug = current.slug;
    if (current.name !== data.name) {
      slug = slugify(data.name);
      const slugExists = await Product.findOne({ slug, _id: { $ne: id } });
      if (slugExists) slug = `${slug}-${Date.now().toString().slice(-5)}`;
    }

    const removedImages = current.images.filter((img) => !data.images.includes(img));
    const removedKeys = current.imageKeys.filter((_, idx) => removedImages.includes(current.images[idx]));

    const product = await Product.findByIdAndUpdate(
      id,
      { ...data, slug, imageKeys: current.imageKeys.filter((k) => !removedKeys.includes(k)) },
      { new: true }
    );

    for (const key of removedKeys) {
      await deleteFile(key);
    }

    return apiSuccess(product, "Product updated successfully");
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const { id } = await params;

    const usedInOrders = await Order.countDocuments({ "items.product": id });
    if (usedInOrders > 0) {
      return apiError(
        `Cannot delete this product because it appears in ${usedInOrders} order(s). Archive it instead.`,
        409
      );
    }

    const product = await Product.findByIdAndDelete(id);
    if (!product) return apiError("Product not found", 404);

    for (const key of product.imageKeys || []) {
      await deleteFile(key);
    }

    return apiSuccess(null, "Product deleted successfully");
  } catch (err) {
    return handleApiError(err);
  }
}
