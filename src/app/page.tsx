import Image from "next/image";
import Link from "next/link";
import { Category as CategoryModel, Product } from "@/db/schema";
import { ProductCard } from "@/components/ProductCard";
import { CategoryCard } from "@/components/CategoryCard";
import type { Category, ProductListItem } from "@/lib/types";

export const dynamic = "force-dynamic";

async function getHomeData() {
  const [featuredRows, arrivals, cats] = await Promise.all([Product.find({ featured: true }).sort({ createdAt: -1 }).limit(8).lean(), Product.find({}).sort({ createdAt: -1 }).limit(8).lean(), CategoryModel.find({}).sort({ name: 1 }).lean()]);
  const categoryRows = await Promise.all(cats.map(async (c: any) => ({ id: c._id.toString(), name: c.name, slug: c.slug, description: c.description, image: c.image, productCount: await Product.countDocuments({ categoryId: c._id, isActive: true }) })));
  const ids = [...featuredRows, ...arrivals].map((p: any) => p.categoryId).filter(Boolean);
  const categoryDocs = await CategoryModel.find({ _id: { $in: ids } }).lean();
  const cmap = new Map(categoryDocs.map((c: any) => [c._id.toString(), c]));
  const mapProduct = (p: any) => ({ ...p, id: p._id.toString(), categoryName: cmap.get(p.categoryId?.toString())?.name ?? null, categorySlug: cmap.get(p.categoryId?.toString())?.slug ?? null });

  return {
    featured: featuredRows.map(mapProduct) as ProductListItem[],
    newArrivals: arrivals.map(mapProduct) as ProductListItem[],
    categoryRows: categoryRows as Category[],
  };
}

const PERKS = [
  {
    icon: "📦",
    title: "Buy in bulk, save more",
    description: "We purchase directly from suppliers and pass the wholesale discount to you.",
  },
  {
    icon: "🚚",
    title: "Free shipping over $100",
    description: "Enjoy complimentary delivery on qualifying orders, nationwide.",
  },
  {
    icon: "🛡️",
    title: "Verified & secure checkout",
    description: "Your data is protected with secure, cookie-based authentication.",
  },
  {
    icon: "↩️",
    title: "Hassle-free order tracking",
    description: "Track every order from pending to delivered, right from your dashboard.",
  },
];

export default async function HomePage() {
  const { featured, newArrivals, categoryRows } = await getHomeData();

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-slate-950">
        <Image
          src="/images/hero-bg.jpg"
          alt="BulkMart warehouse"
          fill
          priority
          className="object-cover opacity-50"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent" />
        <div className="relative mx-auto flex max-w-7xl flex-col gap-6 px-4 py-24 sm:px-6 lg:py-32 lg:px-8">
          <span className="w-fit rounded-full bg-blue-900/60 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-blue-200">
            Bulk-bought, better priced
          </span>
          <h1 className="max-w-2xl text-4xl font-extrabold leading-tight text-white sm:text-5xl lg:text-6xl">
            Wholesale prices. Retail experience.
          </h1>
          <p className="max-w-xl text-base text-slate-200 sm:text-lg">
            BulkMart buys directly from manufacturers in bulk so you can shop electronics, home
            goods, groceries and more — without the markup.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/shop"
              className="rounded-full bg-white px-7 py-3 text-sm font-bold text-slate-900 transition hover:bg-slate-100"
            >
              Shop all products
            </Link>
            <Link
              href="/shop?featured=true"
              className="rounded-full border border-white/30 px-7 py-3 text-sm font-bold text-white transition hover:bg-white/10"
            >
              View featured deals
            </Link>
          </div>
        </div>
      </section>

      {/* Perks */}
      <section className="border-b border-slate-100 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-10 sm:px-6 lg:grid-cols-4 lg:px-8">
          {PERKS.map((perk) => (
            <div key={perk.title} className="flex flex-col gap-2">
              <span className="text-2xl">{perk.icon}</span>
              <h3 className="text-sm font-semibold text-slate-900">{perk.title}</h3>
              <p className="text-xs text-slate-500">{perk.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">Shop by category</h2>
            <p className="mt-1 text-sm text-slate-500">Explore our full bulk-priced catalog.</p>
          </div>
          <Link href="/shop" className="hidden text-sm font-semibold text-blue-900 hover:underline sm:block">
            View all →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {categoryRows.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      </section>

      {/* Featured products */}
      {featured.length > 0 && (
        <section className="bg-white py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8 flex items-end justify-between">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">Featured deals</h2>
                <p className="mt-1 text-sm text-slate-500">Hand-picked bulk savings, while supplies last.</p>
              </div>
              <Link href="/shop?featured=true" className="hidden text-sm font-semibold text-blue-900 hover:underline sm:block">
                View all →
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {featured.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Promo banner */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-6 rounded-3xl bg-gradient-to-br from-blue-900 to-indigo-950 px-6 py-14 text-center text-white sm:px-16">
          <span className="rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide">
            Limited time
          </span>
          <h2 className="max-w-xl text-2xl font-extrabold sm:text-4xl">
            Free shipping on every order over $100
          </h2>
          <p className="max-w-lg text-sm text-blue-100 sm:text-base">
            Plus, orders over $300 automatically unlock an extra 5% bulk discount at checkout.
          </p>
          <Link
            href="/shop"
            className="rounded-full bg-white px-7 py-3 text-sm font-bold text-blue-950 transition hover:bg-blue-50"
          >
            Start shopping
          </Link>
        </div>
      </section>

      {/* New arrivals */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">New arrivals</h2>
            <p className="mt-1 text-sm text-slate-500">Freshly stocked and ready to ship.</p>
          </div>
          <Link href="/shop?sort=newest" className="hidden text-sm font-semibold text-blue-900 hover:underline sm:block">
            View all →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {newArrivals.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-8 text-center text-2xl font-extrabold text-slate-900 sm:text-3xl">
            Loved by thousands of shoppers
          </h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              {
                quote: "I've cut my household shopping budget in half since switching to BulkMart.",
                name: "Jordan M.",
              },
              {
                quote: "Fast shipping, great prices, and the dashboard makes tracking orders so easy.",
                name: "Priya S.",
              },
              {
                quote: "As a small business owner, buying bulk office supplies here is a no-brainer.",
                name: "Alex T.",
              },
            ].map((t) => (
              <div key={t.name} className="rounded-2xl border border-slate-100 bg-slate-50 p-6">
                <p className="text-sm text-slate-700">“{t.quote}”</p>
                <p className="mt-4 text-sm font-semibold text-slate-900">— {t.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
