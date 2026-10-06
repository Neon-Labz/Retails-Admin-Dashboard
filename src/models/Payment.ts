import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";
import { PAYMENT_METHODS, PAYMENT_RECORD_STATUSES, type PaymentMethod, type PaymentRecordStatus } from "@/lib/constants";

export interface IPayment extends Document {
  order: Types.ObjectId;
  orderNumber: string;
  customer: Types.ObjectId;
  amount: number;
  method: PaymentMethod;
  status: PaymentRecordStatus;
  transactionId?: string;
  gateway: string;
  paidAt?: Date;
  meta?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    order: { type: Schema.Types.ObjectId, ref: "Order", required: true },
    orderNumber: { type: String, required: true },
    customer: { type: Schema.Types.ObjectId, ref: "Customer", required: true },
    amount: { type: Number, required: true, min: 0 },
    method: { type: String, enum: PAYMENT_METHODS, default: "cod" },
    status: { type: String, enum: PAYMENT_RECORD_STATUSES, default: "pending" },
    transactionId: { type: String, default: "" },
    gateway: { type: String, default: "manual" },
    paidAt: { type: Date },
    meta: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

export const Payment: Model<IPayment> =
  mongoose.models.Payment || mongoose.model<IPayment>("Payment", PaymentSchema);
