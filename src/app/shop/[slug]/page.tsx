import { notFound } from "next/navigation";
import Link from "next/link";
import { Category, Product } from "@/db/schema";
import { ProductGallery } from "@/components/ProductGallery";
import { AddToCartSection } from "@/components/AddToCartSection";
import { ProductCard } from "@/components/ProductCard";
import { StarRating } from "@/components/ui/StarRating";
import { formatCurrency } from "@/lib/utils";
import type { ProductDetail, ProductListItem } from "@/lib/types";

export const dynamic = "force-dynamic";

async function getProduct(slug: string) {
  const raw = await Product.findOne({ slug, isActive: true }).lean();
  const product = raw ? { ...(raw as any), id: (raw as any)._id.toString(), categoryId: (raw as any).categoryId?.toString() ?? null, attributes: (raw as any).attributes ?? {}, categoryName: null, categorySlug: null } : null;
  if (!product) return null;
  const category = product.categoryId ? await Category.findById(product.categoryId).lean() : null;
  product.categoryName = category?.name ?? null; product.categorySlug = category?.slug ?? null;
  const relatedRows = product.categoryId ? await Product.find({ categoryId: product.categoryId, _id: { $ne: raw?._id }, isActive: true }).limit(4).lean() : [];
  const related = relatedRows.map((p: any) => ({ ...p, id: p._id.toString(), categoryName: category?.name ?? null, categorySlug: category?.slug ?? null }));

  return { product: product as ProductDetail, related: related as ProductListItem[] };
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getProduct(slug);
  if (!data) return { title: "Product not found — BulkMart" };
  return {
    title: `${data.product.name} — BulkMart`,
    description: data.product.shortDescription || data.product.description.slice(0, 150),
  };
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getProduct(slug);
  if (!data) notFound();

  const { product, related } = data;
  const discount =
    product.compareAtPrice && Number(product.compareAtPrice) > Number(product.price)
      ? Math.round(100 - (Number(product.price) / Number(product.compareAtPrice)) * 100)
      : 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <nav className="mb-6 text-xs text-slate-500">
        <Link href="/" className="hover:text-slate-800">Home</Link> /{" "}
        <Link href="/shop" className="hover:text-slate-800">Shop</Link>
        {product.categoryName && (
          <>
            {" "}
            / <Link href={`/shop?category=${product.categorySlug}`} className="hover:text-slate-800">{product.categoryName}</Link>
          </>
        )}
        {" "}/ <span className="text-slate-700">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        <ProductGallery images={product.images} name={product.name} />

        <div>
          {product.categoryName && (
            <Link
              href={`/shop?category=${product.categorySlug}`}
              className="text-xs font-semibold uppercase tracking-wide text-blue-800"
            >
              {product.categoryName}
            </Link>
          )}
          <h1 className="mt-2 text-2xl font-extrabold text-slate-900 sm:text-3xl">{product.name}</h1>

          <div className="mt-3 flex items-center gap-3">
            <StarRating rating={product.rating} />
            <span className="text-sm text-slate-500">{product.reviewCount} reviews</span>
            {product.brand && <span className="text-sm text-slate-400">· {product.brand}</span>}
          </div>

          <div className="mt-5 flex items-baseline gap-3">
            <span className="text-3xl font-extrabold text-slate-900">{formatCurrency(product.price)}</span>
            {product.compareAtPrice && Number(product.compareAtPrice) > Number(product.price) && (
              <>
                <span className="text-lg text-slate-400 line-through">{formatCurrency(product.compareAtPrice)}</span>
                <span className="rounded-full bg-rose-100 px-2.5 py-1 text-xs font-bold text-rose-700">
                  Save {discount}%
                </span>
              </>
            )}
          </div>

          <p className="mt-4 text-sm leading-relaxed text-slate-600">
            {product.shortDescription || product.description.slice(0, 200)}
          </p>

          <div className="mt-4">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                product.stock > 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${product.stock > 0 ? "bg-emerald-500" : "bg-rose-500"}`} />
              {product.stock > 0 ? `In stock (${product.stock} available)` : "Out of stock"}
            </span>
          </div>

          <div className="mt-6 border-t border-slate-100 pt-6">
            <AddToCartSection product={product} />
          </div>

          {Object.keys(product.attributes || {}).length > 0 && (
            <div className="mt-8 border-t border-slate-100 pt-6">
              <h3 className="mb-3 text-sm font-semibold text-slate-900">Specifications</h3>
              <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {Object.entries(product.attributes).map(([key, value]) => (
                  <div key={key} className="flex justify-between rounded-lg bg-slate-50 px-3 py-2 text-xs">
                    <dt className="font-medium text-slate-500">{key}</dt>
                    <dd className="text-slate-800">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>
      </div>

      <div className="mt-14 border-t border-slate-100 pt-10">
        <h2 className="mb-4 text-lg font-bold text-slate-900">Product description</h2>
        <p className="max-w-3xl text-sm leading-relaxed text-slate-600">{product.description}</p>
        {product.sku && <p className="mt-4 text-xs text-slate-400">SKU: {product.sku}</p>}
        {product.tags?.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {product.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {related.length > 0 && (
        <div className="mt-14 border-t border-slate-100 pt-10">
          <h2 className="mb-6 text-lg font-bold text-slate-900">You might also like</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
