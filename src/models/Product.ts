import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";
import { PRODUCT_STATUSES, type ProductStatus } from "@/lib/constants";

export interface ISpecification {
  key: string;
  value: string;
}

export interface IProduct extends Document {
  name: string;
  slug: string;
  description?: string;
  category: Types.ObjectId;
  price: number;
  salePrice?: number | null;
  sku: string;
  images: string[];
  imageKeys: string[];
  specifications: ISpecification[];
  stock: number;
  lowStockThreshold: number;
  status: ProductStatus;
  isFeatured: boolean;
  totalSold: number;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    description: { type: String, default: "" },
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    price: { type: Number, required: true, min: 0 },
    salePrice: { type: Number, min: 0, default: null },
    sku: { type: String, required: true, unique: true, uppercase: true, trim: true },
    images: { type: [String], default: [] },
    imageKeys: { type: [String], default: [] },
    specifications: {
      type: [{ key: { type: String }, value: { type: String } }],
      default: [],
    },
    stock: { type: Number, default: 0, min: 0 },
    lowStockThreshold: { type: Number, default: 5, min: 0 },
    status: { type: String, enum: PRODUCT_STATUSES, default: "active" },
    isFeatured: { type: Boolean, default: false },
    totalSold: { type: Number, default: 0 },
  },
  { timestamps: true }
);

ProductSchema.index({ name: "text", sku: "text" });

export const Product: Model<IProduct> =
  mongoose.models.Product || mongoose.model<IProduct>("Product", ProductSchema);
