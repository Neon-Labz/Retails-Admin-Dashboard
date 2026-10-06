import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IAddress {
  label?: string;
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode?: string;
  country: string;
  isDefault?: boolean;
}

export interface ICustomer extends Document {
  name: string;
  email: string;
  phone?: string;
  passwordHash?: string;
  addresses: IAddress[];
  isVerified: boolean;
  isActive: boolean;
  totalOrders: number;
  totalSpent: number;
  createdAt: Date;
  updatedAt: Date;
}

const AddressSchema = new Schema<IAddress>(
  {
    label: { type: String, default: "Home" },
    line1: { type: String, required: true },
    line2: { type: String, default: "" },
    city: { type: String, required: true },
    state: { type: String, default: "" },
    postalCode: { type: String, default: "" },
    country: { type: String, required: true },
    isDefault: { type: Boolean, default: false },
  },
  { _id: false }
);

const CustomerSchema = new Schema<ICustomer>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, default: "" },
    passwordHash: { type: String, select: false },
    addresses: { type: [AddressSchema], default: [] },
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    totalOrders: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
  },
  { timestamps: true }
);

CustomerSchema.index({ name: "text", email: "text" });

export const Customer: Model<ICustomer> =
  mongoose.models.Customer || mongoose.model<ICustomer>("Customer", CustomerSchema);
