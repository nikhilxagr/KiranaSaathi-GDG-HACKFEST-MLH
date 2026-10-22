import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  nameHindi?: string;
  barcode?: string;
  category: string;
  quantity: number;
  unit: string;
  minimumStock: number;
  costPrice?: number;
  sellingPrice?: number;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    nameHindi: { type: String, trim: true },
    barcode: { type: String, trim: true },
    category: {
      type: String,
      required: true,
      enum: ['grains', 'oil', 'spices', 'snacks', 'dairy', 'household'],
      default: 'grains',
    },
    quantity: { type: Number, required: true, min: 0, default: 0 },
    unit: {
      type: String,
      required: true,
      enum: ['kg', 'gm', 'litre', 'packet', 'piece'],
      default: 'packet',
    },
    minimumStock: { type: Number, required: true, min: 0, default: 5 },
    costPrice: { type: Number, min: 0 },
    sellingPrice: { type: Number, min: 0 },
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

// Indexes for fast searching and low-stock filters
ProductSchema.index({ name: 'text', nameHindi: 'text', barcode: 1 });
ProductSchema.index({ category: 1 });
ProductSchema.index({ quantity: 1, minimumStock: 1 });

export const ProductModel = mongoose.model<IProduct>('Product', ProductSchema);
