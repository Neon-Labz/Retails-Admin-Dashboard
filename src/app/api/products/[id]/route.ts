import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { Product } from "@/models/Product";
import { Order } from "@/models/Order";
import { productSchema } from "@/lib/validators";
import { apiError, apiSuccess, handleApiError } from "@/lib/api-utils";
import { slugify, escapeRegex } from "@/lib/utils";
import { deleteFile, getKeyFromUrl } from "@/lib/r2";

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

    const duplicateSku = await Product.findOne({
      sku: { $regex: new RegExp(`^${escapeRegex(data.sku.trim())}$`, "i") },
      _id: { $ne: id },
    });
    if (duplicateSku) return apiError("A product with this SKU already exists", 409);

    const current = await Product.findById(id);
    if (!current) return apiError("Product not found", 404);

    let slug = current.slug;
    if (current.name !== data.name) {
      slug = slugify(data.name);
      const slugExists = await Product.findOne({ slug, _id: { $ne: id } });
      if (slugExists) slug = `${slug}-${Date.now().toString().slice(-5)}`;
    }

    // Delete removed images from R2
    const removedImages = (current.images || []).filter((img) => !data.images.includes(img));
    for (const img of removedImages) {
      await deleteFile(img);
    }

    const updatedImageKeys = (data.images || [])
      .map((img) => getKeyFromUrl(img))
      .filter((k): k is string => Boolean(k));

    const product = await Product.findByIdAndUpdate(
      id,
      { ...data, slug, imageKeys: updatedImageKeys },
      { new: true }
    );

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

    // Delete all images associated with this product from R2/storage
    const targetsToDelete = new Set<string>();
    for (const key of product.imageKeys || []) {
      if (key) targetsToDelete.add(key);
    }
    for (const imgUrl of product.images || []) {
      if (imgUrl) targetsToDelete.add(imgUrl);
    }

    for (const target of targetsToDelete) {
      await deleteFile(target);
    }

    return apiSuccess(null, "Product deleted successfully");
  } catch (err) {
    return handleApiError(err);
  }
}
