import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface ISettings extends Document {
  storeName: string;
  storeEmail: string;
  storePhone: string;
  storeAddress: string;
  storeLogo: string;
  currency: string;
  currencySymbol: string;
  timezone: string;
  socialLinks: { facebook: string; instagram: string; twitter: string };
  orderSettings: { autoConfirmOrders: boolean; allowCancellationWindowHours: number; minOrderAmount: number };
  inventorySettings: { defaultLowStockThreshold: number; allowBackorder: boolean };
  emailSettings: {
    lowStockAlerts: boolean;
    newOrderAlerts: boolean;
    orderStatusUpdates: boolean;
    newCustomerAlerts: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const SettingsSchema = new Schema<ISettings>(
  {
    storeName: { type: String, default: "My Retail Store" },
    storeEmail: { type: String, default: "" },
    storePhone: { type: String, default: "" },
    storeAddress: { type: String, default: "" },
    storeLogo: { type: String, default: "" },
    currency: { type: String, default: "LKR" },
    currencySymbol: { type: String, default: "LKR" },
    timezone: { type: String, default: "UTC" },
    socialLinks: {
      facebook: { type: String, default: "" },
      instagram: { type: String, default: "" },
      twitter: { type: String, default: "" },
    },
    orderSettings: {
      autoConfirmOrders: { type: Boolean, default: false },
      allowCancellationWindowHours: { type: Number, default: 24 },
      minOrderAmount: { type: Number, default: 0 },
    },
    inventorySettings: {
      defaultLowStockThreshold: { type: Number, default: 5 },
      allowBackorder: { type: Boolean, default: false },
    },
    emailSettings: {
      lowStockAlerts: { type: Boolean, default: true },
      newOrderAlerts: { type: Boolean, default: true },
      orderStatusUpdates: { type: Boolean, default: true },
      newCustomerAlerts: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

export const Settings: Model<ISettings> =
  mongoose.models.Settings || mongoose.model<ISettings>("Settings", SettingsSchema);
