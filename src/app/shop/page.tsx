import { Category as CategoryModel, Product } from "@/db/schema";
import { ProductCard } from "@/components/ProductCard";
import { ShopFilters } from "@/components/ShopFilters";
import { Pagination } from "@/components/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Category, ProductListItem } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Shop All Products — BulkMart",
  description: "Browse bulk-priced products across electronics, home, grocery, fashion and more.",
};

const PAGE_SIZE = 12;

type SearchParams = Record<string, string | string[] | undefined>;

function getParam(params: SearchParams, key: string) {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

async function getCategories(): Promise<Category[]> {
  const rows = await CategoryModel.find({}).sort({ name: 1 }).lean();
  return Promise.all(rows.map(async (c: any) => ({ id: c._id.toString(), name: c.name, slug: c.slug, description: c.description, image: c.image, productCount: await Product.countDocuments({ categoryId: c._id, isActive: true }) }))) as any;
}

async function getProducts(params: SearchParams) {
  const search = getParam(params, "search");
  const category = getParam(params, "category");
  const sort = getParam(params, "sort") ?? "newest";
  const featured = getParam(params, "featured") === "true";
  const inStock = getParam(params, "inStock") === "true";
  const page = Math.max(1, Number(getParam(params, "page") ?? 1) || 1);

  const filter: any = { isActive: true };
  if (search) filter.$or = [{ name: { $regex: search, $options: "i" } }, { description: { $regex: search, $options: "i" } }, { brand: { $regex: search, $options: "i" } }];
  if (category) { const c = await CategoryModel.findOne({ slug: category }).lean(); filter.categoryId = c?._id ?? null; }
  if (featured) filter.featured = true;
  if (inStock) filter.stock = { $gte: 1 };
  const orderBy: any = sort === "price_asc" ? { price: 1 } : sort === "price_desc" ? { price: -1 } : sort === "rating" ? { rating: -1 } : sort === "popular" ? { reviewCount: -1 } : { createdAt: -1 };
  const [rows, total] = await Promise.all([Product.find(filter).sort(orderBy).skip((page - 1) * PAGE_SIZE).limit(PAGE_SIZE).lean(), Product.countDocuments(filter)]);
  const cats = await CategoryModel.find({ _id: { $in: rows.map((p: any) => p.categoryId).filter(Boolean) } }).lean();
  const cmap = new Map(cats.map((c: any) => [c._id.toString(), c]));
  const mapped = rows.map((p: any) => ({ id: p._id.toString(), name: p.name, slug: p.slug, shortDescription: p.shortDescription, price: p.price, compareAtPrice: p.compareAtPrice, images: p.images, stock: p.stock, rating: p.rating, reviewCount: p.reviewCount, featured: p.featured, brand: p.brand, categoryName: cmap.get(p.categoryId?.toString())?.name ?? null, categorySlug: cmap.get(p.categoryId?.toString())?.slug ?? null }));
  return { products: mapped as ProductListItem[], total, page, totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const resolvedParams = await searchParams;
  const [categoryRows, { products: productRows, total, page, totalPages }] = await Promise.all([
    getCategories(),
    getProducts(resolvedParams),
  ]);

  function buildHref(targetPage: number) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(resolvedParams)) {
      if (typeof value === "string" && value) params.set(key, value);
    }
    params.set("page", String(targetPage));
    return `/shop?${params.toString()}`;
  }

  const activeCategoryName = categoryRows.find((c) => c.slug === getParam(resolvedParams, "category"))?.name;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">
          {activeCategoryName ? activeCategoryName : "All Products"}
        </h1>
        <p className="mt-1 text-sm text-slate-500">{total} product{total === 1 ? "" : "s"} available</p>
      </div>

      <div className="flex flex-col gap-10 lg:flex-row">
        <ShopFilters categories={categoryRows} />

        <div className="flex-1">
          {productRows.length === 0 ? (
            <EmptyState
              icon="🔍"
              title="No products found"
              description="Try adjusting your filters or search terms to find what you're looking for."
              actionLabel="Clear filters"
              actionHref="/shop"
            />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                {productRows.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
              <Pagination page={page} totalPages={totalPages} buildHref={buildHref} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
