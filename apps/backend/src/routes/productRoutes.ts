import { Router, Request, Response } from 'express';
import { ProductModel } from '../models/Product';
import { StockMovementModel } from '../models/StockMovement';
import { isMongoConnected } from '../db/mongodb';

const router = Router();

// In-memory fallback repository when MongoDB is not connected
let inMemoryProducts: any[] = [];
let inMemoryMovements: any[] = [];

// GET /api/products
router.get('/', async (req: Request, res: Response) => {
  try {
    const { category, search } = req.query;

    if (isMongoConnected()) {
      const filter: any = {};
      if (category && category !== 'all') {
        filter.category = category;
      }
      if (search) {
        const regex = new RegExp(String(search), 'i');
        filter.$or = [{ name: regex }, { nameHindi: regex }, { barcode: regex }];
      }
      const products = await ProductModel.find(filter).sort({ name: 1 });
      return res.json({ success: true, count: products.length, data: products });
    }

    // In-memory fallback
    let list = [...inMemoryProducts];
    if (category && category !== 'all') {
      list = list.filter((p) => p.category === category);
    }
    if (search) {
      const q = String(search).toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.nameHindi && p.nameHindi.toLowerCase().includes(q))
      );
    }
    return res.json({ success: true, count: list.length, data: list });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/products/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (isMongoConnected()) {
      const product = await ProductModel.findById(id);
      if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }
      return res.json({ success: true, data: product });
    }

    const p = inMemoryProducts.find((item) => item.id === id || item._id === id);
    if (!p) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    return res.json({ success: true, data: p });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/products
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      name,
      nameHindi,
      barcode,
      category,
      quantity,
      unit,
      minimumStock,
      costPrice,
      sellingPrice,
    } = req.body;

    if (!name || quantity === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Name and quantity are required.',
      });
    }

    const parsedQty = Number(parseFloat(quantity).toFixed(2));
    const parsedMin = minimumStock !== undefined ? Number(parseFloat(minimumStock).toFixed(2)) : 5;

    if (isMongoConnected()) {
      const product = await ProductModel.create({
        name: name.trim(),
        nameHindi: nameHindi?.trim(),
        barcode: barcode?.trim(),
        category: category || 'grains',
        quantity: parsedQty,
        unit: unit || 'kg',
        minimumStock: parsedMin,
        costPrice: costPrice !== undefined ? parseFloat(costPrice) : undefined,
        sellingPrice: sellingPrice !== undefined ? parseFloat(sellingPrice) : undefined,
      });

      if (parsedQty > 0) {
        await StockMovementModel.create({
          productId: product.id,
          productName: product.name,
          type: 'restock',
          quantityDelta: parsedQty,
          resultingQuantity: parsedQty,
          note: 'Initial catalog creation',
        });
      }

      return res.status(201).json({ success: true, data: product });
    }

    // In-memory fallback
    const id = 'prod_' + Date.now() + '_' + Math.random().toString(36).substring(7);
    const newProduct = {
      id,
      _id: id,
      name: name.trim(),
      nameHindi: nameHindi?.trim(),
      barcode: barcode?.trim(),
      category: category || 'grains',
      quantity: parsedQty,
      unit: unit || 'kg',
      minimumStock: parsedMin,
      costPrice: costPrice !== undefined ? parseFloat(costPrice) : undefined,
      sellingPrice: sellingPrice !== undefined ? parseFloat(sellingPrice) : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    inMemoryProducts.push(newProduct);
    return res.status(201).json({ success: true, data: newProduct });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/products/:id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (isMongoConnected()) {
      const product = await ProductModel.findByIdAndUpdate(id, updates, {
        new: true,
        runValidators: true,
      });
      if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }
      return res.json({ success: true, data: product });
    }

    const idx = inMemoryProducts.findIndex((p) => p.id === id || p._id === id);
    if (idx === -1) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    inMemoryProducts[idx] = {
      ...inMemoryProducts[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    return res.json({ success: true, data: inMemoryProducts[idx] });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/products/:id/stock (Add stock)
router.post('/:id/stock', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { quantityDelta, note } = req.body;

    const delta = parseFloat(quantityDelta);
    if (isNaN(delta) || delta <= 0) {
      return res.status(400).json({ success: false, message: 'Valid positive quantity required.' });
    }

    if (isMongoConnected()) {
      const product = await ProductModel.findById(id);
      if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }

      product.quantity = Number((product.quantity + delta).toFixed(2));
      await product.save();

      await StockMovementModel.create({
        productId: product.id,
        productName: product.name,
        type: 'restock',
        quantityDelta: delta,
        resultingQuantity: product.quantity,
        note: note || 'Stock restock',
      });

      return res.json({ success: true, data: product });
    }

    const p = inMemoryProducts.find((item) => item.id === id || item._id === id);
    if (!p) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    p.quantity = Number((p.quantity + delta).toFixed(2));
    p.updatedAt = new Date().toISOString();
    return res.json({ success: true, data: p });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/products/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (isMongoConnected()) {
      await ProductModel.findByIdAndDelete(id);
      return res.json({ success: true, message: 'Product deleted' });
    }
    inMemoryProducts = inMemoryProducts.filter((p) => p.id !== id && p._id !== id);
    return res.json({ success: true, message: 'Product deleted' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
