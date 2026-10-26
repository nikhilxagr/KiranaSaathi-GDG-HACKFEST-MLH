import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  Clock,
  Share2,
  Copy,
  Check,
  CheckCircle2,
  PackageCheck,
  Sparkles,
  Plus,
  Loader2,
  X,
  ShieldCheck,
  Truck,
  Users,
  TrendingUp,
  Filter,
  Phone,
  Edit2,
  Trash2,
  Info,
  Calendar,
} from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Product, Supplier, ReorderRecommendation } from '../types';
import {
  generateDistributorOrderText,
  buildWhatsAppOrderUrl,
} from '../services/reorderService';

export const ReorderPage: React.FC = () => {
  const {
    products,
    suppliers,
    reorderRecommendations,
    slowMovingAnalysis,
    preferences,
    receiveStock,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    assignSupplier,
    t,
    language,
  } = useShop();

  const isHindi = language === 'hi';

  // Navigation Tabs: 'reorder' (low stock & smart orders), 'suppliers' (distributor CRM), 'slowMoving'
  const [activeTab, setActiveTab] = useState<'lowStock' | 'suppliers' | 'slowMoving'>('lowStock');

  // Filtering State
  const [selectedSupplierFilter, setSelectedSupplierFilter] = useState<string>('all');
  const [onlyUrgentShortfall, setOnlyUrgentShortfall] = useState<boolean>(true);

  // Selection for batch distributor order
  const [selectedProductIds, setSelectedProductIds] = useState<Set<number>>(new Set());
  const [customQuantities, setCustomQuantities] = useState<Record<number, number>>({});

  // Share / Order Preview Dialog
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Receive Stock Dialog
  const [receiveItem, setReceiveItem] = useState<{
    productId: number;
    productName: string;
    productNameHindi?: string;
    unit: string;
    currentStock: number;
    suggestedQty: number;
  } | null>(null);
  const [receivedQtyInput, setReceivedQtyInput] = useState<string>('5');
  const [receiveNoteInput, setReceiveNoteInput] = useState<string>('Wholesale delivery receipt');
  const [isReceiving, setIsReceiving] = useState<boolean>(false);
  const [receiveSuccessMsg, setReceiveSuccessMsg] = useState<string | null>(null);

  // Supplier Management Dialogs
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [supplierName, setSupplierName] = useState('');
  const [supplierPhone, setSupplierPhone] = useState('');
  const [supplierLeadTime, setSupplierLeadTime] = useState<string>('2');
  const [supplierNotes, setSupplierNotes] = useState('');
  const [isSavingSupplier, setIsSavingSupplier] = useState(false);

  // Quick Supplier Assign Dialog
  const [assigningProductId, setAssigningProductId] = useState<number | null>(null);

  // 1. Filtered Reorder Items
  const filteredRecommendations = useMemo(() => {
    return reorderRecommendations.filter((rec) => {
      // Urgent shortfall filter
      if (onlyUrgentShortfall && rec.recommendedQuantity <= 0) {
        return false;
      }
      // Supplier filter
      if (selectedSupplierFilter === 'all') return true;
      if (selectedSupplierFilter === 'unassigned') return !rec.supplierId;
      return rec.supplierId === selectedSupplierFilter;
    });
  }, [reorderRecommendations, onlyUrgentShortfall, selectedSupplierFilter]);

  // Pre-select items needing restock on initial view
  const itemsNeedingRestock = useMemo(() => {
    return reorderRecommendations.filter((r) => r.recommendedQuantity > 0);
  }, [reorderRecommendations]);

  const toggleSelectProduct = (productId: number) => {
    setSelectedProductIds((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedProductIds.size === filteredRecommendations.length) {
      setSelectedProductIds(new Set());
    } else {
      setSelectedProductIds(new Set(filteredRecommendations.map((r) => r.productId)));
    }
  };

  // Get current order quantity for a product (custom edited or default recommended)
  const getOrderQty = (rec: ReorderRecommendation): number => {
    if (customQuantities[rec.productId] !== undefined) {
      return customQuantities[rec.productId];
    }
    return rec.recommendedQuantity > 0 ? rec.recommendedQuantity : 1;
  };

  const handleUpdateQty = (productId: number, newQty: number) => {
    const validQty = Math.max(0.1, Number(newQty.toFixed(2)));
    setCustomQuantities((prev) => ({
      ...prev,
      [productId]: validQty,
    }));
  };

  // 2. Prepare Order List for Sharing
  const selectedOrderItems = useMemo(() => {
    return filteredRecommendations
      .filter((r) => selectedProductIds.has(r.productId))
      .map((r) => ({
        productName: r.productName,
        productNameHindi: r.productNameHindi,
        quantity: getOrderQty(r),
        unit: r.unit,
        currentStock: r.currentStock,
        supplierName: r.supplierName,
        supplierPhone: r.supplierPhone,
      }));
  }, [filteredRecommendations, selectedProductIds, customQuantities]);

  // Selected supplier contact if filtered to single supplier
  const activeSupplier = useMemo(() => {
    if (selectedSupplierFilter !== 'all' && selectedSupplierFilter !== 'unassigned') {
      return suppliers.find((s) => s.id === selectedSupplierFilter);
    }
    return undefined;
  }, [suppliers, selectedSupplierFilter]);

  const generatedOrderText = useMemo(() => {
    const storeTitle = isHindi ? preferences.shopNameHindi : preferences.shopName;
    return generateDistributorOrderText({
      shopName: storeTitle,
      ownerName: preferences.ownerName,
      supplierName: activeSupplier?.name,
      items: selectedOrderItems.length > 0 ? selectedOrderItems : filteredRecommendations.slice(0, 10).map((r) => ({
        productName: r.productName,
        productNameHindi: r.productNameHindi,
        quantity: getOrderQty(r),
        unit: r.unit,
        currentStock: r.currentStock,
      })),
      language,
    });
  }, [preferences, isHindi, activeSupplier, selectedOrderItems, filteredRecommendations, language, customQuantities]);

  const handleCopyOrder = () => {
    navigator.clipboard.writeText(generatedOrderText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsAppShare = () => {
    const url = buildWhatsAppOrderUrl(activeSupplier?.phone, generatedOrderText);
    window.open(url, '_blank');
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${preferences.shopName} Wholesale Order`,
          text: generatedOrderText,
        });
      } catch {
        // User cancelled share
      }
    } else {
      handleCopyOrder();
    }
  };

  // 3. Receive Stock Actions
  const handleOpenReceiveModal = (rec: ReorderRecommendation) => {
    const defaultQty = rec.recommendedQuantity > 0 ? rec.recommendedQuantity : 5;
    setReceiveItem({
      productId: rec.productId,
      productName: rec.productName,
      productNameHindi: rec.productNameHindi,
      unit: rec.unit,
      currentStock: rec.currentStock,
      suggestedQty: defaultQty,
    });
    setReceivedQtyInput(String(defaultQty));
    setReceiveNoteInput(isHindi ? 'होलसेल स्टॉक रसीद' : 'Wholesale delivery receipt');
    setReceiveSuccessMsg(null);
  };

  const handleConfirmReceiveStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiveItem) return;

    const parsedQty = parseFloat(receivedQtyInput);
    if (isNaN(parsedQty) || parsedQty <= 0) return;

    setIsReceiving(true);
    try {
      await receiveStock(receiveItem.productId, parsedQty, receiveNoteInput);
      setReceiveSuccessMsg(
        isHindi
          ? `+${parsedQty} ${receiveItem.unit} स्टॉक सफलतापूर्वक जुड़ गया!`
          : `Restocked +${parsedQty} ${receiveItem.unit} successfully!`
      );
      setTimeout(() => {
        setReceiveItem(null);
        setReceiveSuccessMsg(null);
      }, 1200);
    } catch (err) {
      console.error('Failed to receive stock:', err);
    } finally {
      setIsReceiving(false);
    }
  };

  // 4. Supplier Management Actions
  const handleOpenAddSupplier = () => {
    setEditingSupplier(null);
    setSupplierName('');
    setSupplierPhone('');
    setSupplierLeadTime('2');
    setSupplierNotes('');
    setIsSupplierModalOpen(true);
  };

  const handleOpenEditSupplier = (s: Supplier) => {
    setEditingSupplier(s);
    setSupplierName(s.name);
    setSupplierPhone(s.phone || '');
    setSupplierLeadTime(String(s.leadTimeDays ?? 2));
    setSupplierNotes(s.notes || '');
    setIsSupplierModalOpen(true);
  };

  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierName.trim()) return;

    setIsSavingSupplier(true);
    try {
      const parsedLeadTime = supplierLeadTime ? parseInt(supplierLeadTime, 10) : undefined;
      if (editingSupplier) {
        await updateSupplier(editingSupplier.id, {
          name: supplierName.trim(),
          phone: supplierPhone.trim() || undefined,
          leadTimeDays: parsedLeadTime,
          notes: supplierNotes.trim() || undefined,
        });
      } else {
        await addSupplier({
          name: supplierName.trim(),
          phone: supplierPhone.trim() || undefined,
          leadTimeDays: parsedLeadTime,
          notes: supplierNotes.trim() || undefined,
        });
      }
      setIsSupplierModalOpen(false);
    } catch (err) {
      console.error('Failed to save supplier:', err);
    } finally {
      setIsSavingSupplier(false);
    }
  };

  const handleDeleteSupplier = async (id: string) => {
    if (window.confirm(isHindi ? 'क्या आप इस सप्लायर को हटाना चाहते हैं?' : 'Delete this supplier?')) {
      await deleteSupplier(id);
    }
  };

  const handleAssignSupplier = async (productId: number, supplierId: string | undefined) => {
    try {
      await assignSupplier(productId, supplierId);
      setAssigningProductId(null);
    } catch (err) {
      console.error('Failed to assign supplier:', err);
    }
  };

  const slowMovingItems = slowMovingAnalysis.filter((i) => i.isSlowMoving);
  const newlyAddedItems = slowMovingAnalysis.filter((i) => i.isNewlyAdded);

  return (
    <div className="space-y-4">
      {/* 1. Header & Primary Wholesale Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            {t('reorderTitle')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            {isHindi
              ? 'सप्लायर को मांग-आधारित ऑर्डर भेजने और नया स्टॉक दर्ज करने का स्मार्ट केंद्र'
              : 'Smart reorder intelligence, supplier directory & purchase receipt ledger'}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="md"
            onClick={handleCopyOrder}
            className="gap-2 font-semibold text-xs sm:text-sm"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? t('orderCopied') : t('btnCopyOrder')}</span>
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={() => setIsShareModalOpen(true)}
            className="gap-2 font-bold text-xs sm:text-sm shadow-sm"
          >
            <Share2 className="w-4 h-4" />
            <span>{t('btnShareOrder')}</span>
          </Button>
        </div>
      </div>

      {/* 2. Top Navigation Tabs */}
      <div className="flex items-center gap-1 sm:gap-2 border-b border-slate-200 overflow-x-auto">
        <button
          onClick={() => setActiveTab('lowStock')}
          data-testid="low-stock-tab"
          className={`touch-target px-3 sm:px-4 py-2.5 font-bold text-xs sm:text-sm border-b-2 transition-colors flex items-center gap-1.5 shrink-0 ${
            activeTab === 'lowStock'
              ? 'border-emerald-700 text-emerald-950 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          <span>{t('tabLowStock')}</span>
          <span className="px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-800 font-extrabold">
            {itemsNeedingRestock.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('suppliers')}
          data-testid="suppliers-tab"
          className={`touch-target px-3 sm:px-4 py-2.5 font-bold text-xs sm:text-sm border-b-2 transition-colors flex items-center gap-1.5 shrink-0 ${
            activeTab === 'suppliers'
              ? 'border-kirana-700 text-kirana-950 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Truck className="w-4 h-4 text-kirana-700" />
          <span>{t('tabSuppliers')}</span>
          <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-700 font-bold">
            {suppliers.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('slowMoving')}
          data-testid="slow-moving-tab"
          className={`touch-target px-3 sm:px-4 py-2.5 font-bold text-xs sm:text-sm border-b-2 transition-colors flex items-center gap-1.5 shrink-0 ${
            activeTab === 'slowMoving'
              ? 'border-blue-600 text-blue-900 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="w-4 h-4 text-blue-600" />
          <span>{t('tabSlowMoving')}</span>
          <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800 font-extrabold">
            {slowMovingItems.length}
          </span>
        </button>
      </div>

      {/* 3. Tab 1: Smart Reorder & Wholesale Restock List */}
      {activeTab === 'lowStock' && (
        <div className="space-y-3" data-testid="low-stock-list">
          {/* Controls Bar: Supplier Filter + Urgent Toggle + Batch Selection */}
          <div className="p-3 bg-white rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
            <div className="flex flex-wrap items-center gap-2">
              {/* Supplier Dropdown Filter */}
              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-semibold">{t('supplierLabel')}:</span>
                <select
                  value={selectedSupplierFilter}
                  onChange={(e) => setSelectedSupplierFilter(e.target.value)}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-kirana-700"
                >
                  <option value="all">{t('filterAllSuppliers')}</option>
                  <option value="unassigned">{t('filterUnassigned')}</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Show only items needing stock toggle */}
              <button
                type="button"
                onClick={() => setOnlyUrgentShortfall(!onlyUrgentShortfall)}
                className={`touch-target px-2.5 py-1 rounded-lg text-xs font-bold transition-colors border ${
                  onlyUrgentShortfall
                    ? 'bg-amber-100 border-amber-300 text-amber-900'
                    : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {onlyUrgentShortfall ? '⚠️ ' + t('tabLowStock') : '📋 ' + t('filterAll')}
              </button>
            </div>

            {/* Batch Select Controls */}
            {filteredRecommendations.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSelectAll}
                  className="text-xs font-bold text-kirana-800 hover:underline"
                >
                  {selectedProductIds.size === filteredRecommendations.length
                    ? isHindi ? 'सभी हटाएं' : 'Deselect All'
                    : isHindi ? 'सभी चुनें' : 'Select All'}
                </button>
                <span className="text-xs text-slate-400">|</span>
                <span className="text-xs font-extrabold text-slate-700">
                  {selectedProductIds.size} {t('selectedItemsCount')}
                </span>
              </div>
            )}
          </div>

          {/* Reorder Items List */}
          {filteredRecommendations.length > 0 ? (
            <div className="space-y-2.5">
              {filteredRecommendations.map((rec) => {
                const isSelected = selectedProductIds.has(rec.productId);
                const orderQty = getOrderQty(rec);
                const isOutOfStock = rec.currentStock === 0;

                return (
                  <div
                    key={rec.productId}
                    data-testid={`low-stock-item-${rec.productName}`}
                    className={`kirana-card p-4 transition-all duration-150 border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs ${
                      isSelected
                        ? 'border-kirana-500 bg-kirana-50/20 ring-1 ring-kirana-500/20'
                        : rec.recommendedQuantity > 0
                        ? 'border-amber-200 bg-white'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    {/* Left: Checkbox + Product Details + Supplier Badge */}
                    <div className="flex items-start gap-3 min-w-0">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectProduct(rec.productId)}
                        aria-label={`Select ${rec.productName}`}
                        className="mt-1 w-4 h-4 rounded text-kirana-700 focus:ring-kirana-500 border-slate-300 shrink-0"
                      />

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 mb-1">
                          {isOutOfStock ? (
                            <Badge variant="warning" dot className="bg-rose-100 text-rose-800 border-rose-300">
                              {t('statusOutOfStock')}
                            </Badge>
                          ) : rec.recommendedQuantity > 0 ? (
                            <Badge variant="warning" dot>
                              {t('statusLow')}
                            </Badge>
                          ) : (
                            <Badge variant="success" dot>
                              {t('statusHealthy')}
                            </Badge>
                          )}

                          {/* Reorder Mode Indicator Badge */}
                          {rec.mode === 'sales_aware' ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                              <TrendingUp className="w-2.5 h-2.5 text-blue-600" />
                              {t('modeSalesAwareLabel')}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              <Info className="w-2.5 h-2.5 text-amber-600" />
                              {t('modeThresholdLabel')}
                            </span>
                          )}

                          <span className="text-[11px] font-semibold text-slate-400">
                            {rec.category}
                          </span>
                        </div>

                        <h3 className="font-bold text-base text-slate-900 leading-snug">
                          {isHindi ? rec.productNameHindi || rec.productName : rec.productName}
                        </h3>
                        <p className="text-xs text-slate-500">
                          {isHindi ? rec.productName : rec.productNameHindi || ''}
                        </p>

                        {/* Current vs Minimum Stock */}
                        <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-600">
                          <span>
                            {isHindi ? 'मौजूदा स्टॉक:' : 'Current:'}{' '}
                            <strong
                              data-testid={`current-stock-${rec.productName}`}
                              className={isOutOfStock ? 'text-rose-700 font-extrabold' : 'text-slate-800 font-bold'}
                            >
                              {rec.currentStock} {rec.unit}
                            </strong>
                          </span>
                          <span>•</span>
                          <span>
                            {isHindi ? 'सुरक्षा सीमा:' : 'Min Stock:'}{' '}
                            <strong className="text-slate-700">{rec.minimumStock} {rec.unit}</strong>
                          </span>
                        </div>

                        {/* Supplier Assignment Badge */}
                        <div className="mt-2 flex items-center gap-2">
                          {rec.supplierName ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                              <Truck className="w-3 h-3 text-kirana-700" />
                              <span>{rec.supplierName}</span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setAssigningProductId(rec.productId)}
                              className="text-[11px] font-bold text-kirana-800 hover:underline flex items-center gap-1"
                            >
                              <Plus className="w-3 h-3" />
                              <span>{isHindi ? 'सप्लायर जोड़ें' : 'Assign Supplier'}</span>
                            </button>
                          )}

                          {assigningProductId === rec.productId && (
                            <div className="flex items-center gap-1 animate-in fade-in">
                              <select
                                onChange={(e) => handleAssignSupplier(rec.productId, e.target.value || undefined)}
                                defaultValue=""
                                className="text-xs px-2 py-1 rounded border border-kirana-700 bg-white font-medium"
                              >
                                <option value="" disabled>{isHindi ? 'सप्लायर चुनें...' : 'Select Supplier...'}</option>
                                <option value="">{isHindi ? 'कोई नहीं (Unassign)' : 'None (Unassign)'}</option>
                                {suppliers.map((s) => (
                                  <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                              </select>
                              <button
                                onClick={() => setAssigningProductId(null)}
                                className="p-1 text-slate-400 hover:text-slate-600"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Reason Explanation */}
                        <p className="text-[11px] text-slate-500 mt-1 italic leading-tight">
                          💡 {isHindi ? rec.reasonHindi : rec.reason}
                        </p>
                      </div>
                    </div>

                    {/* Right: Quantity Adjuster + Receive Stock Action */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100 bg-amber-50/30 p-2.5 rounded-xl sm:bg-transparent sm:p-0">
                      <div className="text-left sm:text-right">
                        <span className="text-[11px] font-bold text-slate-600 flex items-center sm:justify-end gap-1">
                          <Sparkles className="w-3 h-3 text-amber-600" />
                          {t('suggestedReorder')}
                        </span>

                        {/* Editable order quantity */}
                        <div className="flex items-center sm:justify-end gap-1.5 mt-0.5">
                          <button
                            type="button"
                            onClick={() => handleUpdateQty(rec.productId, orderQty - 1)}
                            className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs"
                          >
                            -
                          </button>
                          <span
                            data-testid={`suggested-reorder-${rec.productName}`}
                            className="text-base font-extrabold text-kirana-800 min-w-14 text-center"
                          >
                            +{orderQty} {rec.unit}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdateQty(rec.productId, orderQty + 1)}
                            className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleOpenReceiveModal(rec)}
                        className="gap-1 font-bold text-xs shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{t('btnReceiveStock')}</span>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="kirana-card p-12 text-center max-w-md mx-auto my-6">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-2xl mx-auto flex items-center justify-center mb-3">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800">{t('noLowStock')}</h3>
              <p className="text-xs text-slate-500 mt-1">
                {isHindi
                  ? 'सभी उत्पाद पर्याप्त मात्रा में उपलब्ध हैं या चुने गए फिल्टर में कोई सामान नहीं है।'
                  : 'All inventory levels are healthy according to demand and safety thresholds.'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* 4. Tab 2: Wholesale Suppliers CRM Directory */}
      {activeTab === 'suppliers' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Truck className="w-4 h-4 text-kirana-700" />
              <span>{t('tabSuppliers')} ({suppliers.length})</span>
            </h2>

            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenAddSupplier}
              className="gap-1.5 font-bold text-xs"
            >
              <Plus className="w-4 h-4" />
              <span>{t('btnAddSupplier')}</span>
            </Button>
          </div>

          {suppliers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {suppliers.map((s) => {
                const assignedCount = products.filter((p) => p.supplierId === s.id).length;

                return (
                  <div
                    key={s.id}
                    className="kirana-card p-4 border border-slate-200 bg-white flex flex-col justify-between gap-3 shadow-2xs"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-base text-slate-900">{s.name}</h3>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditSupplier(s)}
                            className="p-1 text-slate-400 hover:text-slate-600 rounded"
                            title={t('btnEditSupplier')}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteSupplier(s.id)}
                            className="p-1 text-rose-400 hover:text-rose-600 rounded"
                            title={t('btnDeleteSupplier')}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {s.phone && (
                        <p className="text-xs text-slate-600 flex items-center gap-1.5 mt-1 font-medium">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{s.phone}</span>
                        </p>
                      )}

                      <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {s.leadTimeDays ? `${s.leadTimeDays} ${isHindi ? 'दिन डिलीवरी' : 'days lead time'}` : isHindi ? 'डिलीवरी समय अनिर्धारित' : 'Lead time: 2d'}
                          </span>
                        </span>
                        <span>•</span>
                        <span className="font-semibold text-kirana-800">
                          {assignedCount} {isHindi ? 'सामान जुड़े हैं' : 'products linked'}
                        </span>
                      </div>

                      {s.notes && (
                        <p className="text-xs text-slate-500 mt-2 p-2 bg-slate-50 rounded-lg border border-slate-100">
                          {s.notes}
                        </p>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedSupplierFilter(s.id);
                          setActiveTab('lowStock');
                        }}
                        className="text-xs font-bold"
                      >
                        {isHindi ? 'ऑर्डर सूची देखें' : 'View Reorder List'}
                      </Button>

                      {s.phone && (
                        <a
                          href={`tel:${s.phone}`}
                          className="text-xs font-bold text-kirana-800 hover:underline flex items-center gap-1"
                        >
                          <Phone className="w-3 h-3" />
                          <span>{isHindi ? 'कॉल करें' : 'Call'}</span>
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="kirana-card p-12 text-center max-w-md mx-auto my-6">
              <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-2xl mx-auto flex items-center justify-center mb-3">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800">{t('noSuppliers')}</h3>
              <p className="text-xs text-slate-500 mt-1">
                {isHindi
                  ? 'अपने थोक व्यापारियों और सप्लायरों को यहां जोड़ें ताकि आसानी से WhatsApp ऑर्डर भेजा जा सके।'
                  : 'Add your local wholesale distributors here to organize orders by supplier.'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* 5. Tab 3: Slow-Moving Stock Section (Preserved from Phase 5) */}
      {activeTab === 'slowMoving' && (
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-blue-50/80 border border-blue-200 text-xs text-blue-900">
            <span className="font-bold block mb-0.5">ℹ️ {t('slowMovingAdvice')}</span>
            <span>
              {isHindi
                ? 'इन उत्पादों की बिक्री पिछले 30 या अधिक दिनों से नहीं हुई है। नए जुड़े उत्पाद (< 30 दिन) इस चेतावनी से सुरक्षित रखे गए हैं।'
                : 'These items have had zero sales for 30+ days based on actual sales records. Newly added products are excluded from slow-moving alerts.'}
            </span>
          </div>

          {slowMovingItems.length > 0 ? (
            <div className="space-y-2.5">
              {slowMovingItems.map((item) => {
                const p = item.product;
                const stock = p.quantity ?? p.currentStock ?? 0;
                return (
                  <div
                    key={p.id}
                    className="kirana-card p-4 border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-slate-400 block mb-0.5">
                        {p.category}
                      </span>
                      <h3 className="font-bold text-base text-slate-900">
                        {isHindi ? p.nameHindi || p.name : p.name}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {isHindi ? p.name : p.nameHindi || ''}
                      </p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-6 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      <div className="text-left sm:text-right">
                        <span className="text-xs text-slate-400 block">{t('colStock')}</span>
                        <span className="text-sm font-bold text-slate-800">
                          {stock} {p.unit}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-xs text-slate-400 block">
                          {isHindi ? 'निष्क्रिय अवधि' : 'Inactive Period'}
                        </span>
                        <span className="text-sm font-bold text-blue-800 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                          {item.daysSinceLastSale !== null
                            ? `${item.daysSinceLastSale} ${t('daysIdle')}`
                            : isHindi
                            ? '30+ दिनों से कोई बिक्री नहीं'
                            : '30+ days no sales'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="kirana-card p-12 text-center max-w-md mx-auto my-6">
              <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-2xl mx-auto flex items-center justify-center mb-3">
                <PackageCheck className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800">{t('noSlowMoving')}</h3>
              <p className="text-xs text-slate-500 mt-1">
                {isHindi
                  ? 'आपकी दुकान का सारा स्टॉक नियमित रूप से बिक रहा है!'
                  : 'All stock has healthy movement!'}
              </p>
            </div>
          )}

          {/* Newly Added Products Section */}
          {newlyAddedItems.length > 0 && (
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2 mt-4">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>
                  {isHindi
                    ? `हाल ही में जोड़े गए उत्पाद (${newlyAddedItems.length}) — धीमे स्टॉक से बाहर रखे गए`
                    : `Newly Added Items (${newlyAddedItems.length}) — Protected from slow-moving alerts`}
                </span>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {newlyAddedItems.map((item) => (
                  <span
                    key={item.product.id}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-white border border-slate-200 text-slate-700 font-medium"
                  >
                    <span>
                      {isHindi
                        ? item.product.nameHindi || item.product.name
                        : item.product.name}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      ({item.product.quantity ?? item.product.currentStock ?? 0} {item.product.unit})
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: Distributor Order Preview & WhatsApp Sharing */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div className="kirana-card w-full max-w-lg p-5 sm:p-6 bg-white max-h-[90vh] flex flex-col shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <Share2 className="w-4 h-4 text-kirana-700" />
                <span>{t('orderPreviewTitle')}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsShareModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-3 overflow-y-auto flex-1 space-y-3">
              <p className="text-xs text-slate-500">
                {isHindi
                  ? 'यह संदेश सुरक्षित रूप से तैयार किया गया है। इसमें आपकी दुकान के गोपनीय आंकड़े शामिल नहीं हैं।'
                  : 'Formatted wholesale order ready for WhatsApp or direct copy. No sensitive internal metrics are included.'}
              </p>

              {activeSupplier && (
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs flex items-center justify-between">
                  <span className="font-bold text-slate-800">🚚 {activeSupplier.name}</span>
                  {activeSupplier.phone && <span className="text-slate-600 font-semibold">{activeSupplier.phone}</span>}
                </div>
              )}

              {/* Formatted Text Preview */}
              <div className="p-3 bg-slate-950 text-emerald-400 font-mono text-xs rounded-xl whitespace-pre-wrap max-h-56 overflow-y-auto border border-slate-800 select-all">
                {generatedOrderText}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-end gap-2 shrink-0">
              <Button
                variant="outline"
                size="md"
                onClick={handleCopyOrder}
                className="gap-2 font-bold text-xs"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? t('orderCopied') : t('btnCopyOrder')}</span>
              </Button>

              <Button
                variant="primary"
                size="md"
                onClick={handleWhatsAppShare}
                className="gap-2 font-bold text-xs bg-emerald-700 hover:bg-emerald-800"
              >
                <Share2 className="w-4 h-4" />
                <span>{t('btnOrderWhatsApp')}</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Receive Stock Workflow (Step 5) */}
      {receiveItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div className="kirana-card w-full max-w-sm p-5 sm:p-6 bg-white shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-kirana-700" />
                <span>{t('receiveStockTitle')}</span>
              </h3>
              <button
                type="button"
                onClick={() => setReceiveItem(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-3 space-y-3">
              <div>
                <h4 className="font-bold text-base text-slate-900">
                  {isHindi ? receiveItem.productNameHindi || receiveItem.productName : receiveItem.productName}
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isHindi ? 'मौजूदा स्टॉक:' : 'Current Stock:'}{' '}
                  <strong className="text-slate-800">
                    {receiveItem.currentStock} {receiveItem.unit}
                  </strong>
                </p>
              </div>

              {receiveSuccessMsg ? (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in zoom-in-95">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{receiveSuccessMsg}</span>
                </div>
              ) : (
                <form onSubmit={handleConfirmReceiveStock} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {t('receivedQuantityLabel')} ({receiveItem.unit}) *
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0.01"
                      required
                      value={receivedQtyInput}
                      onChange={(e) => setReceivedQtyInput(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-base font-bold focus:outline-none focus:ring-2 focus:ring-kirana-700"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {isHindi ? 'रसीद / चालान विवरण (वैकल्पिक)' : 'Delivery Note / Bill # (Optional)'}
                    </label>
                    <input
                      type="text"
                      value={receiveNoteInput}
                      onChange={(e) => setReceiveNoteInput(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-kirana-700"
                    />
                  </div>

                  {/* Dynamic calculation preview */}
                  {parseFloat(receivedQtyInput) > 0 && (
                    <div className="p-2.5 bg-kirana-50/50 rounded-xl border border-kirana-200 text-xs text-kirana-900 flex items-center justify-between">
                      <span>{t('newTotalStockLabel')}:</span>
                      <strong className="text-sm font-extrabold text-kirana-800">
                        {Number((receiveItem.currentStock + (parseFloat(receivedQtyInput) || 0)).toFixed(2))} {receiveItem.unit}
                      </strong>
                    </div>
                  )}

                  <div className="pt-2 flex items-center justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setReceiveItem(null)}
                    >
                      {t('btnCancel')}
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      disabled={isReceiving}
                      className="gap-1 font-bold"
                    >
                      {isReceiving ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Check className="w-3.5 h-3.5" />
                      )}
                      <span>{t('confirmReceiveStock')}</span>
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Supplier Add / Edit Dialog */}
      {isSupplierModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div className="kirana-card w-full max-w-sm p-5 sm:p-6 bg-white shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <Truck className="w-4 h-4 text-kirana-700" />
                <span>{editingSupplier ? t('btnEditSupplier') : t('btnAddSupplier')}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsSupplierModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSupplier} className="py-3 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('supplierName')} *
                </label>
                <input
                  type="text"
                  required
                  placeholder={isHindi ? 'उदा: कल्यान किराना होलसेल' : 'e.g. Kalyan Grocery Wholesale'}
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-kirana-700"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('supplierPhone')} (WhatsApp)
                </label>
                <input
                  type="tel"
                  placeholder="+91 98201 12345"
                  value={supplierPhone}
                  onChange={(e) => setSupplierPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-kirana-700"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('leadTimeDaysLabel')}
                </label>
                <input
                  type="number"
                  min="0"
                  max="30"
                  value={supplierLeadTime}
                  onChange={(e) => setSupplierLeadTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-kirana-700"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('supplierNotes')}
                </label>
                <textarea
                  rows={2}
                  placeholder={isHindi ? 'उदा: आटा, दाल, तेल सप्लायर' : 'e.g. Main pulses & grains distributor'}
                  value={supplierNotes}
                  onChange={(e) => setSupplierNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-kirana-700"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsSupplierModalOpen(false)}
                >
                  {t('btnCancel')}
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isSavingSupplier}
                  className="gap-1 font-bold"
                >
                  {isSavingSupplier ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>{editingSupplier ? t('btnEditSupplier') : t('btnAddSupplier')}</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
