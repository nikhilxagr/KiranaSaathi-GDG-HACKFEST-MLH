import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import { Button } from '../../components/ui/Button';
import { Product, ProductCategory, ProductUnit } from '../../types';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: Product | null;
}

export const AddProductModal: React.FC<AddProductModalProps> = ({
  isOpen,
  onClose,
  productToEdit,
}) => {
  const { addProduct, updateProduct, suppliers, t, language } = useShop();

  const [name, setName] = useState('');
  const [nameHindi, setNameHindi] = useState('');
  const [barcode, setBarcode] = useState('');
  const [category, setCategory] = useState<ProductCategory>('grains');
  const [supplierId, setSupplierId] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('10');
  const [unit, setUnit] = useState<ProductUnit>('kg');
  const [minimumStock, setMinimumStock] = useState<string>('5');
  const [costPrice, setCostPrice] = useState<string>('50');
  const [sellingPrice, setSellingPrice] = useState<string>('60');

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const isEditing = Boolean(productToEdit && productToEdit.id);

  useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name);
      setNameHindi(productToEdit.nameHindi || '');
      setBarcode(productToEdit.barcode || '');
      setCategory(productToEdit.category);
      setSupplierId(productToEdit.supplierId || '');
      setQuantity(String(productToEdit.quantity ?? productToEdit.currentStock ?? 0));
      setUnit(productToEdit.unit);
      setMinimumStock(String(productToEdit.minimumStock ?? productToEdit.minThreshold ?? 0));
      setCostPrice(productToEdit.costPrice !== undefined ? String(productToEdit.costPrice) : '');
      setSellingPrice(
        productToEdit.sellingPrice !== undefined ? String(productToEdit.sellingPrice) : ''
      );
    } else {
      setName('');
      setNameHindi('');
      setBarcode('');
      setCategory('grains');
      setSupplierId('');
      setQuantity('10');
      setUnit('kg');
      setMinimumStock('5');
      setCostPrice('50');
      setSellingPrice('60');
    }
    setError(null);
    setSuccessMsg(null);
  }, [productToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!name.trim()) {
      setError(t('errRequiredFields'));
      return;
    }

    const parsedStock = parseFloat(quantity);
    const parsedThreshold = parseFloat(minimumStock);
    const parsedCost = costPrice.trim() !== '' ? parseFloat(costPrice) : undefined;
    const parsedSelling = sellingPrice.trim() !== '' ? parseFloat(sellingPrice) : undefined;

    if (isNaN(parsedStock) || parsedStock < 0) {
      setError(t('errInvalidQuantity'));
      return;
    }

    if (isNaN(parsedThreshold) || parsedThreshold < 0) {
      setError(
        language === 'hi'
          ? 'न्यूनतम सीमा शून्य या धनात्मक होनी चाहिए।'
          : 'Threshold must be non-negative.'
      );
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEditing && productToEdit?.id) {
        await updateProduct(productToEdit.id, {
          name: name.trim(),
          nameHindi: nameHindi.trim() || undefined,
          barcode: barcode.trim() || undefined,
          category,
          supplierId: supplierId || undefined,
          quantity: parsedStock,
          unit,
          minimumStock: parsedThreshold,
          costPrice: parsedCost,
          sellingPrice: parsedSelling,
        });
      } else {
        await addProduct({
          name: name.trim(),
          nameHindi: nameHindi.trim() || undefined,
          barcode: barcode.trim() || undefined,
          category,
          supplierId: supplierId || undefined,
          quantity: parsedStock,
          unit,
          minimumStock: parsedThreshold,
          costPrice: parsedCost,
          sellingPrice: parsedSelling,
        });
      }

      // Close modal immediately so automated tests and fast users are never blocked
      setIsSubmitting(false);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save product';
      setError(msg);
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      data-testid="add-product-modal"
    >
      <div
        className="kirana-card w-full max-w-lg p-5 sm:p-6 bg-white my-auto max-h-[92vh] overflow-y-auto shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div>
            <h2 id="modal-title" className="text-base sm:text-lg font-extrabold text-slate-900">
              {isEditing
                ? language === 'hi'
                  ? 'सामान बदलें (Edit Item)'
                  : 'Edit Product Details'
                : t('addNewProductTitle')}
            </h2>
            <p className="text-xs text-slate-500">
              {language === 'hi'
                ? 'यह सामान आपके ब्राउज़र के IndexedDB में तुरंत सुरक्षित होगा।'
                : 'This product will be saved directly to offline IndexedDB.'}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Close modal"
            data-testid="close-modal-button"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2"
            data-testid="product-error-banner"
          >
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div
            className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2"
            data-testid="product-success-banner"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5" data-testid="add-product-form">
          {/* Product Names: English & Hindi */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="product-name" className="block text-xs font-bold text-slate-700 mb-1">
                {t('fieldName')} (English) *
              </label>
              <input
                id="product-name"
                name="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rice or Fortune Oil"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-kirana-500"
                required
                disabled={isSubmitting}
                data-testid="product-name-input"
              />
            </div>
            <div>
              <label htmlFor="product-name-hindi" className="block text-xs font-bold text-slate-700 mb-1">
                {t('fieldNameHindi')}
              </label>
              <input
                id="product-name-hindi"
                name="nameHindi"
                type="text"
                value={nameHindi}
                onChange={(e) => setNameHindi(e.target.value)}
                placeholder="उदा. चावल या आटा"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-kirana-500 font-['Noto_Sans_Devanagari']"
                disabled={isSubmitting}
                data-testid="product-hindi-name-input"
              />
            </div>
          </div>

          {/* Barcode / Code (Optional) */}
          <div>
            <label htmlFor="product-barcode" className="block text-xs font-bold text-slate-700 mb-1">
              {language === 'hi' ? 'बारकोड / कोड (वैकल्पिक)' : 'Barcode / SKU (Optional)'}
            </label>
            <input
              id="product-barcode"
              name="barcode"
              type="text"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              placeholder="8901030383123"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-kirana-500"
              disabled={isSubmitting}
              data-testid="product-barcode-input"
            />
          </div>

          {/* Category, Supplier & Unit */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label htmlFor="product-category" className="block text-xs font-bold text-slate-700 mb-1">
                {t('fieldCategory')} *
              </label>
              <select
                id="product-category"
                name="category"
                value={category}
                onChange={(e) => setCategory(e.target.value as ProductCategory)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-kirana-500 bg-white"
                disabled={isSubmitting}
                data-testid="product-category-select"
              >
                <option value="grains">{t('catGrains')}</option>
                <option value="oil">{t('catOil')}</option>
                <option value="spices">{t('catSpices')}</option>
                <option value="snacks">{t('catSnacks')}</option>
                <option value="dairy">{t('catDairy')}</option>
                <option value="household">{t('catHousehold')}</option>
              </select>
            </div>

            <div>
              <label htmlFor="product-supplier" className="block text-xs font-bold text-slate-700 mb-1">
                {t('supplierLabel')}
              </label>
              <select
                id="product-supplier"
                name="supplier"
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-kirana-500 bg-white"
                disabled={isSubmitting}
                data-testid="product-supplier-select"
              >
                <option value="">{language === 'hi' ? 'कोई सप्लायर नहीं (None)' : 'None (Unassigned)'}</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="product-unit" className="block text-xs font-bold text-slate-700 mb-1">
                {t('fieldUnit')} *
              </label>
              <select
                id="product-unit"
                name="unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value as ProductUnit)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-kirana-500 bg-white"
                disabled={isSubmitting}
                data-testid="product-unit-select"
              >
                <option value="kg">{t('unitKg')}</option>
                <option value="gm">{t('unitGm')}</option>
                <option value="packet">{t('unitPacket')}</option>
                <option value="litre">{t('unitLitre')}</option>
                <option value="piece">{t('unitPiece')}</option>
              </select>
            </div>
          </div>

          {/* Stock Quantity & Threshold (Supports Decimals e.g. 2.5 kg) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="product-quantity" className="block text-xs font-bold text-slate-700 mb-1">
                {t('fieldQuantity')} *
              </label>
              <input
                id="product-quantity"
                name="quantity"
                type="number"
                step="any"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="10"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-kirana-500 font-bold"
                required
                disabled={isSubmitting}
                data-testid="product-quantity-input"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                {language === 'hi' ? 'दशमलव मान्य है (उदा. 2.5)' : 'Decimals allowed (e.g. 2.5)'}
              </span>
            </div>

            <div>
              <label htmlFor="product-minimum-stock" className="block text-xs font-bold text-slate-700 mb-1">
                {t('fieldThreshold')} *
              </label>
              <input
                id="product-minimum-stock"
                name="minimumStock"
                type="number"
                step="any"
                min="0"
                value={minimumStock}
                onChange={(e) => setMinimumStock(e.target.value)}
                placeholder="5"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-kirana-500 font-bold"
                required
                disabled={isSubmitting}
                data-testid="product-min-stock-input"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                {language === 'hi' ? 'कम होने पर चेतावनी' : 'Alert threshold'}
              </span>
            </div>
          </div>

          {/* Cost Price & Selling Price (₹) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="product-cost-price" className="block text-xs font-bold text-slate-700 mb-1">
                {t('fieldCostPrice')}
              </label>
              <input
                id="product-cost-price"
                name="costPrice"
                type="number"
                step="any"
                min="0"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                placeholder="50"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-kirana-500"
                disabled={isSubmitting}
                data-testid="product-cost-price-input"
              />
            </div>

            <div>
              <label htmlFor="product-selling-price" className="block text-xs font-bold text-slate-700 mb-1">
                {t('fieldSellingPrice')}
              </label>
              <input
                id="product-selling-price"
                name="sellingPrice"
                type="number"
                step="any"
                min="0"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                placeholder="60"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-kirana-500"
                disabled={isSubmitting}
                data-testid="product-price-input"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={onClose}
              disabled={isSubmitting}
              data-testid="cancel-product-button"
            >
              {language === 'hi' ? 'रद्द करें' : 'Cancel'}
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={isSubmitting}
              className="gap-2 font-bold shadow-sm"
              data-testid="save-product-button"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{isEditing ? (language === 'hi' ? 'सेव करें' : 'Update') : t('btnSaveProduct')}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
