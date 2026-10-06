import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";
import { STOCK_LOG_TYPES, type StockLogType } from "@/lib/constants";

export interface IStockLog extends Document {
  product: Types.ObjectId;
  productName: string;
  type: StockLogType;
  quantity: number;
  previousStock: number;
  newStock: number;
  reason?: string;
  admin?: Types.ObjectId;
  adminName?: string;
  createdAt: Date;
}

const StockLogSchema = new Schema<IStockLog>(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    productName: { type: String, required: true },
    type: { type: String, enum: STOCK_LOG_TYPES, required: true },
    quantity: { type: Number, required: true },
    previousStock: { type: Number, required: true },
    newStock: { type: Number, required: true },
    reason: { type: String, default: "" },
    admin: { type: Schema.Types.ObjectId, ref: "Admin" },
    adminName: { type: String, default: "" },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const StockLog: Model<IStockLog> =
  mongoose.models.StockLog || mongoose.model<IStockLog>("StockLog", StockLogSchema);
