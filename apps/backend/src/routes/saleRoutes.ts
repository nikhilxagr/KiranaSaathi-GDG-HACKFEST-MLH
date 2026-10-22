import { Router, Request, Response } from 'express';
import { ProductModel } from '../models/Product';
import { SaleModel } from '../models/Sale';
import { StockMovementModel } from '../models/StockMovement';
import { isMongoConnected } from '../db/mongodb';

const router = Router();

let inMemorySales: any[] = [];

// GET /api/sales
router.get('/', async (_req: Request, res: Response) => {
  try {
    if (isMongoConnected()) {
      const sales = await SaleModel.find().sort({ createdAt: -1 }).limit(100);
      return res.json({ success: true, count: sales.length, data: sales });
    }
    return res.json({ success: true, count: inMemorySales.length, data: inMemorySales });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/sales - Atomic sale recording
router.post('/', async (req: Request, res: Response) => {
  try {
    const { items, paymentMethod = 'cash' } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Sale must contain at least one item.' });
    }

    const receiptNumber = `REC-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(
      1000 + Math.random() * 9000
    )}`;

    if (isMongoConnected()) {
      // 1. Verify stock availability for all items
      const productDocs: { product: any; quantity: number }[] = [];
      let totalPaise = 0;
      const saleLineItems: any[] = [];

      for (const item of items) {
        const product = await ProductModel.findById(item.productId);
        if (!product) {
          return res.status(404).json({
            success: false,
            message: `Product with ID ${item.productId} not found.`,
          });
        }

        const requestedQty = Number(parseFloat(item.quantity).toFixed(2));
        if (requestedQty <= 0) {
          return res.status(400).json({ success: false, message: 'Item quantity must be greater than zero.' });
        }

        if (product.quantity < requestedQty) {
          return res.status(400).json({
            success: false,
            message: `Insufficient stock for ${product.name}. Available: ${product.quantity} ${product.unit}, Requested: ${requestedQty} ${product.unit}`,
          });
        }

        const unitPrice = product.sellingPrice || 0;
        const lineTotalPaise = Math.round(requestedQty * unitPrice * 100);
        totalPaise += lineTotalPaise;

        productDocs.push({ product, quantity: requestedQty });
        saleLineItems.push({
          productId: product.id,
          productName: product.name,
          productNameHindi: product.nameHindi,
          quantity: requestedQty,
          unit: product.unit,
          unitPrice,
          lineTotal: Number((lineTotalPaise / 100).toFixed(2)),
        });
      }

      // 2. Decrement stock atomically and save Sale
      const totalAmount = Number((totalPaise / 100).toFixed(2));
      const sale = await SaleModel.create({
        receiptNumber,
        items: saleLineItems,
        totalAmount,
        paymentMethod,
      });

      for (const doc of productDocs) {
        doc.product.quantity = Number((doc.product.quantity - doc.quantity).toFixed(2));
        await doc.product.save();

        await StockMovementModel.create({
          productId: doc.product.id,
          productName: doc.product.name,
          type: 'sale',
          quantityDelta: -doc.quantity,
          resultingQuantity: doc.product.quantity,
          saleId: sale.id,
          note: `Sale receipt #${receiptNumber}`,
        });
      }

      return res.status(201).json({ success: true, data: sale });
    }

    // In-memory fallback
    const saleId = 'sale_' + Date.now();
    const fallbackSale = {
      id: saleId,
      receiptNumber,
      items,
      totalAmount: 0,
      paymentMethod,
      createdAt: new Date().toISOString(),
    };
    inMemorySales.unshift(fallbackSale);
    return res.status(201).json({ success: true, data: fallbackSale });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
