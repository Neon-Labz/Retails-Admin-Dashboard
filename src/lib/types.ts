export type ProductListItem = {
  id: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  price: string;
  compareAtPrice: string | null;
  images: string[];
  stock: number;
  rating: string;
  reviewCount: number;
  featured: boolean;
  brand: string | null;
  categoryName: string | null;
  categorySlug: string | null;
};

export type ProductDetail = {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string | null;
  price: string;
  compareAtPrice: string | null;
  images: string[];
  stock: number;
  sku: string;
  brand: string | null;
  rating: string;
  reviewCount: number;
  tags: string[];
  attributes: Record<string, string>;
  featured: boolean;
  categoryId: string | null;
  categoryName: string | null;
  categorySlug: string | null;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  productCount: number;
};

export type CartItem = {
  productId: string;
  name: string;
  slug: string;
  price: number;
  image: string | null;
  quantity: number;
  stock: number;
};

export type SessionUserClient = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: "customer" | "admin";
  emailVerified: boolean;
  createdAt: string;
};
