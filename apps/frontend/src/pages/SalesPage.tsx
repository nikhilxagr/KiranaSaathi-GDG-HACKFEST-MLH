import React, { useState, useMemo, useDeferredValue } from 'react';
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  Receipt,
  X,
  CreditCard,
  Banknote,
  BookOpen,
  AlertCircle,
  Loader2,
  ChevronDown,
} from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { Button } from '../components/ui/Button';
import { Product, SaleCartItem, Sale } from '../types';

export const SalesPage: React.FC = () => {
  const { products, recordRealSale, t, language } = useShop();

  const [searchQuery, setSearchQuery] = useState('');
  const deferredSearch = useDeferredValue(searchQuery);

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [cart, setCart] = useState<SaleCartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi' | 'credit_udhaar'>('cash');
  const [confirmedTransaction, setConfirmedTransaction] = useState<Sale | null>(null);
  const [validationWarning, setValidationWarning] = useState<string | null>(null);
  const [saleError, setSaleError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Quick categories
  const categories = [
    { key: 'all', label: t('filterAll') },
    { key: 'grains', label: t('catGrains') },
    { key: 'oil', label: t('catOil') },
    { key: 'spices', label: t('catSpices') },
    { key: 'snacks', label: t('catSnacks') },
    { key: 'dairy', label: t('catDairy') },
  ];

  // Filter available items for quick selection using deferred search
  const availableProducts = useMemo(() => {
    const q = deferredSearch.toLowerCase().trim();
    return products.filter((p) => {
      const nameMatch = p.name.toLowerCase().includes(q);
      const hindiMatch = (p.nameHindi || '').toLowerCase().includes(q);
      const barcodeMatch = p.barcode && p.barcode.includes(q);
      const matchesSearch = !q || nameMatch || hindiMatch || barcodeMatch;

      const matchesCategory =
        selectedCategory === 'all' || p.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [products, deferredSearch, selectedCategory]);

  // Add product to active cart
  const handleAddToCart = (product: Product) => {
    setValidationWarning(null);
    setSaleError(null);

    const availableStock = product.quantity ?? product.currentStock ?? 0;
    const price = product.sellingPrice ?? 0;

    if (availableStock <= 0) {
      setValidationWarning(
        `${language === 'hi' ? product.nameHindi || product.name : product.name} ${
          language === 'hi' ? 'खत्म है!' : 'is out of stock!'
        }`
      );
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      const defaultIncrement = 1;

      if (existing) {
        const newQty = Number((existing.quantity + defaultIncrement).toFixed(2));
        return prev.map((item) =>
          item.product.id === product.id
            ? {
                ...item,
                quantity: newQty,
                subtotal: Math.round(newQty * price),
              }
            : item
        );
      } else {
        return [
          ...prev,
          {
            product,
            quantity: defaultIncrement,
            subtotal: Math.round(defaultIncrement * price),
          },
        ];
      }
    });
  };

  // Directly set cart quantity from number input (supports fractional e.g. 2.5 kg)
  const handleSetQuantity = (productId: number, rawQty: number) => {
    setValidationWarning(null);
    setSaleError(null);

    if (isNaN(rawQty) || rawQty <= 0) return;
    const cleanQty = Number(rawQty.toFixed(2));

    setCart((prev) =>
      prev.map((item) => {
        if (item.product.id === productId) {
          const price = item.product.sellingPrice ?? 0;
          return {
            ...item,
            quantity: cleanQty,
            subtotal: Math.round(cleanQty * price),
          };
        }
        return item;
      })
    );
  };

  // Adjust quantity (+ or -) with fractional increment awareness
  const handleAdjustQuantity = (productId: number, delta: number) => {
    setValidationWarning(null);
    setSaleError(null);

    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.product.id === productId) {
            const price = item.product.sellingPrice ?? 0;
            const newQty = Number(Math.max(0, item.quantity + delta).toFixed(2));
            return {
              ...item,
              quantity: newQty,
              subtotal: Math.round(newQty * price),
            };
          }
          return item;
        })
        .filter((item) => item.quantity > 0);
    });
  };

  // Remove single line item
  const handleRemoveItem = (productId: number) => {
    setCart((prev) => prev.filter((i) => i.product.id !== productId));
  };

  // Clear entire counter tray
  const handleClearCart = () => {
    setCart([]);
    setValidationWarning(null);
    setSaleError(null);
  };

  // Total bill amount calculation
  const totalAmount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.subtotal, 0);
  }, [cart]);

  // Execute Real Offline Checkout via Dexie IndexedDB
  const handleConfirmSale = async () => {
    if (cart.length === 0 || isSubmitting) return;

    setIsSubmitting(true);
    setSaleError(null);
    setValidationWarning(null);

    try {
      const itemsPayload = cart.map((i) => ({
        productId: i.product.id!,
        quantity: i.quantity,
      }));

      const txn = await recordRealSale(itemsPayload, paymentMethod);
      setConfirmedTransaction(txn);
      setCart([]); // Clear cart ONLY on confirmed commit
    } catch (err: any) {
      console.error('Sale transaction failed:', err);
      setSaleError(
        err?.message ||
          (language === 'hi'
            ? 'बिक्री दर्ज करने में त्रुटि हुई। कृपया स्टॉक जांचें।'
            : 'Failed to record sale. Insufficient stock.')
      );
      // Cart items are RETAINED so shopkeeper doesn't lose customer basket
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4" data-testid="sales-page">
      {/* 1. Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
          {t('salesTitle')}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">{t('salesSubtitle')}</p>
      </div>

      {/* Validation Banner */}
      {validationWarning && (
        <div
          className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center justify-between gap-2"
          data-testid="validation-warning-banner"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-700" />
            <span className="font-bold">{validationWarning}</span>
          </div>
          <button onClick={() => setValidationWarning(null)} className="p-1">
            <X className="w-4 h-4 text-amber-700" />
          </button>
        </div>
      )}

      {/* Transaction Error Alert (Insufficient stock / invalid sale) */}
      {saleError && (
        <div
          className="p-3.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 text-xs flex items-center justify-between gap-2 shadow-xs"
          data-testid="sale-error-banner"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-700" />
            <span className="font-bold">{saleError}</span>
          </div>
          <button onClick={() => setSaleError(null)} className="p-1">
            <X className="w-4 h-4 text-rose-700" />
          </button>
        </div>
      )}

      {/* Mobile Floating Cart Summary Pill */}
      {cart.length > 0 && (
        <div className="lg:hidden fixed bottom-16 left-3 right-3 z-20">
          <button
            type="button"
            onClick={() => {
              document.getElementById('checkout-tray')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="w-full bg-slate-900 text-white p-3 rounded-2xl shadow-xl flex items-center justify-between gap-3 border border-slate-700 active:scale-[0.98] transition-transform"
          >
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-kirana-600 text-white text-xs font-extrabold flex items-center justify-center">
                {cart.length}
              </span>
              <span className="text-xs font-bold text-slate-200">
                {language === 'hi' ? 'सामान' : 'items'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base font-extrabold text-emerald-400">
                ₹{totalAmount.toLocaleString('en-IN')}
              </span>
              <span className="text-xs font-bold bg-kirana-700 px-3 py-1 rounded-lg text-white flex items-center gap-1">
                <span>{language === 'hi' ? 'बिल देखें' : 'View Bill'}</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </span>
            </div>
          </button>
        </div>
      )}

      {/* Split Counter Layout: Product Selector (Left/Top) & Cart Tray (Right/Bottom) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* LEFT / TOP (Cols 1-7): Fast Product Picker */}
        <div className="lg:col-span-7 space-y-3">
          {/* Quick Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                language === 'hi' ? 'सामान खोजें और जोड़ें...' : 'Search items to add...'
              }
              className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-kirana-600 bg-white"
              data-testid="product-search-input"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                aria-label="Clear Search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
            {categories.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                className={`touch-target px-3 py-1 rounded-xl font-bold whitespace-nowrap transition-colors border ${
                  selectedCategory === cat.key
                    ? 'bg-kirana-700 text-white border-kirana-700'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Product Cards Grid (1-tap add to counter tray) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[550px] overflow-y-auto pr-0.5">
            {availableProducts.map((product) => {
              const stock = product.quantity ?? product.currentStock ?? 0;
              const threshold = product.minimumStock ?? product.minThreshold ?? 0;
              const price = product.sellingPrice ?? 0;
              const isOutOfStock = stock <= 0;
              const inCart = cart.find((i) => i.product.id === product.id);

              return (
                <button
                  key={product.id}
                  onClick={() => handleAddToCart(product)}
                  disabled={isOutOfStock}
                  data-testid={`product-card-${product.name}`}
                  className={`kirana-card p-3 text-left transition-all relative flex flex-col justify-between active:scale-[0.98] select-none ${
                    isOutOfStock
                      ? 'opacity-40 bg-slate-100 cursor-not-allowed border-dashed'
                      : inCart
                      ? 'border-kirana-600 ring-2 ring-kirana-600/20 bg-kirana-50/40'
                      : 'hover:border-kirana-400'
                  }`}
                >
                  {inCart && (
                    <span className="absolute top-2 right-2 px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-kirana-700 text-white shadow-2xs">
                      {inCart.quantity} {product.unit}
                    </span>
                  )}

                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block truncate">
                      {product.category}
                    </span>
                    <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 leading-snug line-clamp-2 mt-0.5">
                      {language === 'hi' ? product.nameHindi || product.name : product.name}
                    </h4>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-xs sm:text-sm font-extrabold text-slate-900">
                        ₹{price}
                      </span>
                      <span className="text-[10px] text-slate-400 block font-medium">
                        /{product.unit}
                      </span>
                    </div>

                    <span
                      data-testid={`stock-${product.name}`}
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        isOutOfStock
                          ? 'bg-rose-100 text-rose-800'
                          : stock <= threshold
                          ? 'bg-amber-100 text-amber-900'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {stock} {product.unit}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* RIGHT / BOTTOM (Cols 8-12): Active Bill / Counter Tray */}
        <div className="lg:col-span-5" id="checkout-tray">
          <div className="kirana-card p-4 sm:p-5 sticky top-20 flex flex-col justify-between shadow-xs border-kirana-200">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-kirana-700" />
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                    {t('cartTitle')}
                  </h3>
                </div>
                {cart.length > 0 && (
                  <button
                    onClick={handleClearCart}
                    className="touch-target px-2 py-1 text-xs text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1 rounded-lg hover:bg-rose-50"
                    data-testid="clear-cart-button"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{t('btnClearCart')}</span>
                  </button>
                )}
              </div>

              {/* Cart Items List */}
              {cart.length > 0 ? (
                <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
                  {cart.map((item) => {
                    const isFractional =
                      item.product.unit === 'kg' || item.product.unit === 'litre';
                    const price = item.product.sellingPrice ?? 0;
                    const stock = item.product.quantity ?? item.product.currentStock ?? 0;

                    return (
                      <div
                        key={item.product.id}
                        data-testid={`cart-item-${item.product.name}`}
                        className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h4 className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                              {language === 'hi'
                                ? item.product.nameHindi || item.product.name
                                : item.product.name}
                            </h4>
                            <span className="text-[11px] text-slate-500 block">
                              ₹{price} / {item.product.unit} (उपलब्ध: {stock} {item.product.unit})
                            </span>
                          </div>
                          <span className="font-extrabold text-sm text-slate-900 shrink-0">
                            ₹{item.subtotal}
                          </span>
                        </div>

                        {/* Quantity Controls: Direct Input + Steppers */}
                        <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 flex-wrap gap-1">
                          {/* Unit Buttons */}
                          <div className="flex items-center gap-1">
                            {isFractional && (
                              <button
                                type="button"
                                onClick={() => handleAdjustQuantity(item.product.id!, 0.5)}
                                className="px-2 py-0.5 rounded bg-white hover:bg-slate-100 text-[11px] font-bold text-slate-700 border border-slate-200"
                              >
                                +0.5
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleAdjustQuantity(item.product.id!, 1)}
                              className="px-2 py-0.5 rounded bg-white hover:bg-slate-100 text-[11px] font-bold text-slate-700 border border-slate-200"
                            >
                              +1
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAdjustQuantity(item.product.id!, 5)}
                              className="px-2 py-0.5 rounded bg-white hover:bg-slate-100 text-[11px] font-bold text-slate-700 border border-slate-200"
                            >
                              +5
                            </button>
                          </div>

                          {/* Direct Input + Stepper */}
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() =>
                                handleAdjustQuantity(
                                  item.product.id!,
                                  isFractional ? -0.5 : -1
                                )
                              }
                              className="touch-target w-8 h-8 rounded-lg bg-white border border-slate-300 flex items-center justify-center text-slate-700 hover:bg-slate-100 active:scale-95"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>

                            {/* Direct Number Input allows typing exact 2.5 kg or testing insufficient stock */}
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                step="any"
                                min="0.1"
                                value={item.quantity}
                                onChange={(e) =>
                                  handleSetQuantity(item.product.id!, parseFloat(e.target.value))
                                }
                                className="w-14 px-1.5 py-0.5 text-center text-xs font-extrabold rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-kirana-600"
                                data-testid={`cart-quantity-input-${item.product.name}`}
                              />
                              <span className="text-[11px] font-bold text-slate-500">
                                {item.product.unit}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                handleAdjustQuantity(
                                  item.product.id!,
                                  isFractional ? 0.5 : 1
                                )
                              }
                              className="touch-target w-8 h-8 rounded-lg bg-kirana-700 text-white flex items-center justify-center hover:bg-kirana-800 active:scale-95"
                              aria-label="Increase quantity"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item.product.id!)}
                              className="touch-target text-slate-400 hover:text-rose-600 p-1 ml-0.5"
                              aria-label="Remove item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 text-center text-slate-400 text-xs">
                  <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p>{t('cartEmpty')}</p>
                </div>
              )}
            </div>

            {/* Bill Summary & Payment Method */}
            {cart.length > 0 && (
              <div className="mt-4 pt-3 border-t border-slate-100 space-y-3">
                {/* Payment Mode Selector */}
                <div>
                  <span className="text-[11px] font-bold text-slate-600 block mb-1">
                    {language === 'hi' ? 'भुगतान का तरीका (Payment Mode)' : 'Payment Mode'}
                  </span>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('cash')}
                      className={`touch-target px-2 py-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1 transition-all ${
                        paymentMethod === 'cash'
                          ? 'border-kirana-700 bg-kirana-50 text-kirana-900 ring-1 ring-kirana-600'
                          : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <Banknote className="w-3.5 h-3.5" />
                      <span>{t('payCash')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('upi')}
                      className={`touch-target px-2 py-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1 transition-all ${
                        paymentMethod === 'upi'
                          ? 'border-kirana-700 bg-kirana-50 text-kirana-900 ring-1 ring-kirana-600'
                          : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>{t('payUpi')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('credit_udhaar')}
                      className={`touch-target px-2 py-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1 transition-all ${
                        paymentMethod === 'credit_udhaar'
                          ? 'border-kirana-700 bg-kirana-50 text-kirana-900 ring-1 ring-kirana-600'
                          : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>{t('payCredit')}</span>
                    </button>
                  </div>
                </div>

                {/* Grand Total */}
                <div className="flex items-center justify-between py-2 border-t border-slate-100">
                  <span className="text-sm font-bold text-slate-700">{t('totalBill')}</span>
                  <span
                    className="text-2xl font-extrabold text-slate-900"
                    data-testid="grand-total-amount"
                  >
                    ₹{totalAmount.toLocaleString('en-IN')}
                  </span>
                </div>

                {/* Confirm Sale Button */}
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  disabled={isSubmitting}
                  className="font-extrabold gap-2 shadow-xs tracking-wide"
                  onClick={handleConfirmSale}
                  data-testid="confirm-sale-button"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5" />
                  )}
                  <span>
                    {isSubmitting
                      ? language === 'hi'
                        ? 'दर्ज हो रहा है...'
                        : 'Recording...'
                      : t('btnConfirmSale')}
                  </span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Official Offline Receipt Modal Dialog */}
      {confirmedTransaction && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
          data-testid="receipt-modal"
        >
          <div className="kirana-card w-full max-w-md p-6 bg-white animate-in fade-in zoom-in-95 duration-150 shadow-2xl">
            <div className="text-center pb-4 border-b border-dashed border-slate-200">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-800 rounded-full mx-auto flex items-center justify-center mb-2">
                <Receipt className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-extrabold text-slate-900">
                {t('receiptTitle')}
              </h2>
              <div className="flex items-center justify-center gap-2 mt-1">
                <span
                  className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 font-bold text-[11px]"
                  data-testid="receipt-number"
                >
                  {confirmedTransaction.receiptNumber || `KS-${confirmedTransaction.id}`}
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-[10px] border border-slate-200">
                  {language === 'hi' ? 'ऑफलाइन सुरक्षित' : 'IndexedDB Saved'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">{t('receiptSubtitle')}</p>
            </div>

            {/* Receipt Items Breakdown */}
            <div className="py-4 space-y-2 border-b border-dashed border-slate-200 text-xs">
              <div className="flex justify-between text-slate-400 text-[11px] font-semibold">
                <span>सामान (Item)</span>
                <span>राशि (Amount)</span>
              </div>
              {confirmedTransaction.items.map((i, idx) => {
                const lineAmt = i.lineTotal ?? i.subtotal ?? (i.quantity * (i.unitPrice ?? 0));
                return (
                  <div key={idx} className="flex justify-between text-slate-800 font-medium">
                    <span>
                      {language === 'hi'
                        ? i.productNameHindi || i.productName
                        : i.productName}{' '}
                      ({i.quantity} {i.unit})
                    </span>
                    <span className="font-bold">₹{lineAmt}</span>
                  </div>
                );
              })}
              <div className="pt-2 flex justify-between font-extrabold text-sm text-slate-900 border-t border-slate-100">
                <span>{t('totalBill')}</span>
                <span className="text-kirana-800 font-extrabold text-base" data-testid="receipt-total">
                  ₹{confirmedTransaction.totalAmount ?? 0}
                </span>
              </div>
              <div className="flex justify-between text-slate-500 text-[11px]">
                <span>भुगतान मोड (Mode):</span>
                <span className="uppercase font-bold text-slate-700">{confirmedTransaction.paymentMethod}</span>
              </div>
              <div className="flex justify-between text-slate-400 text-[10px] pt-1">
                <span>तारीख व समय (Time):</span>
                <span>
                  {new Date(
                    confirmedTransaction.createdAt || confirmedTransaction.timestamp || Date.now()
                  ).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div className="mt-5">
              <Button
                variant="primary"
                size="md"
                fullWidth
                onClick={() => setConfirmedTransaction(null)}
                className="font-bold"
                data-testid="new-sale-button"
              >
                {t('btnNewSale')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
