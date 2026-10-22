import mongoose, { Schema, Document } from 'mongoose';

export interface ISaleItem {
  productId: string;
  productName: string;
  productNameHindi?: string;
  quantity: number;
  unit: string;
  unitPrice?: number;
  lineTotal?: number;
}

export interface ISale extends Document {
  receiptNumber: string;
  items: ISaleItem[];
  totalAmount: number;
  paymentMethod: 'cash' | 'upi' | 'credit_udhaar';
  createdAt: Date;
  updatedAt: Date;
}

const SaleItemSchema: Schema = new Schema(
  {
    productId: { type: String, required: true },
    productName: { type: String, required: true },
    productNameHindi: { type: String },
    quantity: { type: Number, required: true, min: 0.01 },
    unit: { type: String, required: true },
    unitPrice: { type: Number },
    lineTotal: { type: Number },
  },
  { _id: false }
);

const SaleSchema: Schema = new Schema(
  {
    receiptNumber: { type: String, required: true, unique: true },
    items: { type: [SaleItemSchema], required: true },
    totalAmount: { type: Number, required: true, min: 0 },
    paymentMethod: {
      type: String,
      required: true,
      enum: ['cash', 'upi', 'credit_udhaar'],
      default: 'cash',
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: any) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

SaleSchema.index({ receiptNumber: 1 });
SaleSchema.index({ createdAt: -1 });

export const SaleModel = mongoose.model<ISale>('Sale', SaleSchema);
