import mongoose, { Schema, Document } from 'mongoose';

export interface IStockMovement extends Document {
  productId: string;
  productName: string;
  type: 'sale' | 'restock' | 'adjustment';
  quantityDelta: number;
  resultingQuantity: number;
  saleId?: string;
  note?: string;
  createdAt: Date;
}

const StockMovementSchema: Schema = new Schema(
  {
    productId: { type: String, required: true },
    productName: { type: String, required: true },
    type: {
      type: String,
      required: true,
      enum: ['sale', 'restock', 'adjustment'],
    },
    quantityDelta: { type: Number, required: true },
    resultingQuantity: { type: Number, required: true },
    saleId: { type: String },
    note: { type: String },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
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

StockMovementSchema.index({ productId: 1, createdAt: -1 });

export const StockMovementModel = mongoose.model<IStockMovement>(
  'StockMovement',
  StockMovementSchema
);
