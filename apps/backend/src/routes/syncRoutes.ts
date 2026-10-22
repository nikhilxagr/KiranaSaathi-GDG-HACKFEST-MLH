import { Router, Request, Response } from 'express';
import { ProductModel } from '../models/Product';
import { SaleModel } from '../models/Sale';
import { StockMovementModel } from '../models/StockMovement';
import { isMongoConnected } from '../db/mongodb';

const router = Router();

// POST /api/sync - Bidirectional synchronization between IndexedDB and MongoDB
router.post('/', async (req: Request, res: Response) => {
  try {
    const { products = [], sales = [] } = req.body;

    if (!isMongoConnected()) {
      return res.json({
        success: true,
        synced: false,
        message: 'MongoDB is offline. Operating in local mode.',
        products: [],
        sales: [],
      });
    }

    // 1. Upsert products from frontend
    for (const p of products) {
      if (p.name) {
        await ProductModel.findOneAndUpdate(
          { name: p.name.trim() },
          {
            name: p.name.trim(),
            nameHindi: p.nameHindi,
            barcode: p.barcode,
            category: p.category || 'grains',
            quantity: p.quantity ?? p.currentStock ?? 0,
            unit: p.unit || 'packet',
            minimumStock: p.minimumStock ?? p.minThreshold ?? 5,
            costPrice: p.costPrice,
            sellingPrice: p.sellingPrice,
          },
          { upsert: true, new: true }
        );
      }
    }

    // 2. Upsert sales from frontend
    for (const s of sales) {
      if (s.receiptNumber) {
        await SaleModel.findOneAndUpdate(
          { receiptNumber: s.receiptNumber },
          {
            receiptNumber: s.receiptNumber,
            items: s.items || [],
            totalAmount: s.totalAmount || 0,
            paymentMethod: s.paymentMethod || 'cash',
          },
          { upsert: true }
        );
      }
    }

    // 3. Return full list of products and sales from MongoDB
    const allProducts = await ProductModel.find().sort({ name: 1 });
    const allSales = await SaleModel.find().sort({ createdAt: -1 }).limit(100);

    return res.json({
      success: true,
      synced: true,
      count: allProducts.length,
      products: allProducts,
      sales: allSales,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
