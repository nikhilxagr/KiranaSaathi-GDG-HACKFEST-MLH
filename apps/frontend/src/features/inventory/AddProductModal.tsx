import React, { useState } from 'react';
import { X, CheckCircle2, AlertCircle } from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import { Button } from '../../components/ui/Button';
import { ProductCategory, ProductUnit } from '../../types';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddProductModal: React.FC<AddProductModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { addProduct, t, language } = useShop();

  const [name, setName] = useState('');
  const [nameHindi, setNameHindi] = useState('');
  const [category, setCategory] = useState<ProductCategory>('grains');
  const [currentStock, setCurrentStock] = useState<string>('10');
  const [unit, setUnit] = useState<ProductUnit>('packet');
  const [minThreshold, setMinThreshold] = useState<string>('5');
  const [costPrice, setCostPrice] = useState<string>('50');
  const [sellingPrice, setSellingPrice] = useState<string>('60');

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!name.trim()) {
      setError(t('errRequiredFields'));
      return;
    }

    const parsedStock = parseFloat(currentStock);
    const parsedThreshold = parseFloat(minThreshold);
    const parsedCost = parseFloat(costPrice);
    const parsedSelling = parseFloat(sellingPrice);

    if (isNaN(parsedStock) || parsedStock < 0) {
      setError(t('errInvalidQuantity'));
      return;
    }

    if (isNaN(parsedThreshold) || parsedThreshold < 0) {
      setError('Threshold must be zero or a positive number.');
      return;
    }

    addProduct({
      name: name.trim(),
      nameHindi: nameHindi.trim() || name.trim(),
      category,
      currentStock: parsedStock,
      unit,
      minThreshold: parsedThreshold,
      costPrice: isNaN(parsedCost) ? 0 : parsedCost,
      sellingPrice: isNaN(parsedSelling) ? 0 : parsedSelling,
    });

    setSuccessMsg(t('msgProductAdded'));

    // Reset and close after brief feedback
    setTimeout(() => {
      setName('');
      setNameHindi('');
      setCurrentStock('10');
      setMinThreshold('5');
      setCostPrice('50');
      setSellingPrice('60');
      setSuccessMsg(null);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div
        className="kirana-card w-full max-w-lg p-5 sm:p-6 bg-white my-auto max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div>
            <h2 id="modal-title" className="text-lg font-bold text-slate-900">
              {t('addNewProductTitle')}
            </h2>
            <span className="text-[11px] font-semibold text-kirana-800 bg-kirana-50 px-2 py-0.5 rounded">
              {t('demoBadge')}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Alerts */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-bold animate-pulse">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Product Names (English & Hindi) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('fieldName')} *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Fortune Mustard Oil 1L"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-kirana-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('fieldNameHindi')}
              </label>
              <input
                type="text"
                value={nameHindi}
                onChange={(e) => setNameHindi(e.target.value)}
                placeholder="उदा. सरसों का तेल (1L)"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-kirana-500 font-['Noto_Sans_Devanagari']"
              />
            </div>
          </div>

          {/* Category & Unit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('fieldCategory')} *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ProductCategory)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-kirana-500 bg-white"
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
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('fieldUnit')} *
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as ProductUnit)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-kirana-500 bg-white"
              >
                <option value="packet">{t('unitPacket')}</option>
                <option value="kg">{t('unitKg')}</option>
                <option value="gm">{t('unitGm')}</option>
                <option value="litre">{t('unitLitre')}</option>
                <option value="piece">{t('unitPiece')}</option>
              </select>
            </div>
          </div>

          {/* Stock Quantity & Threshold (Supports Decimals e.g. 2.5 kg) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('fieldQuantity')} *
              </label>
              <input
                type="number"
                step="any"
                min="0"
                value={currentStock}
                onChange={(e) => setCurrentStock(e.target.value)}
                placeholder="10"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-kirana-500"
                required
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                {language === 'hi' ? 'दशमलव मान्य है (उदा. 2.5)' : 'Decimals allowed (e.g. 2.5)'}
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('fieldThreshold')} *
              </label>
              <input
                type="number"
                step="any"
                min="0"
                value={minThreshold}
                onChange={(e) => setMinThreshold(e.target.value)}
                placeholder="5"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-kirana-500"
                required
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                {language === 'hi' ? 'कम होने पर चेतावनी' : 'Alert threshold'}
              </span>
            </div>
          </div>

          {/* Cost Price & Selling Price (₹) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('fieldCostPrice')}
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                placeholder="₹"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-kirana-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('fieldSellingPrice')}
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                placeholder="₹"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-kirana-500"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={onClose}
              disabled={Boolean(successMsg)}
            >
              {t('btnCancel')}
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              className="gap-2 font-bold"
              disabled={Boolean(successMsg)}
            >
              {t('btnSaveProduct')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
