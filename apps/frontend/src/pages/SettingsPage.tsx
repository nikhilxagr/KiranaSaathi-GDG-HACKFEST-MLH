import React, { useState } from 'react';
import {
  Languages,
  Store,
  RotateCcw,
  CheckCircle2,
  Layers,
  Database,
  ShieldCheck,
  Loader2,
} from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { Button } from '../components/ui/Button';

export const SettingsPage: React.FC = () => {
  const {
    preferences,
    language,
    setLanguage,
    setShopName,
    setOwnerName,
    resetToSampleData,
    products,
    sales,
    t,
  } = useShop();

  const [shopNameInput, setShopNameInput] = useState(preferences.shopName);
  const [shopNameHindiInput, setShopNameHindiInput] = useState(preferences.shopNameHindi);
  const [ownerInput, setOwnerInput] = useState(preferences.ownerName);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleSaveDetails = (e: React.FormEvent) => {
    e.preventDefault();
    setShopName(
      shopNameInput.trim() || 'Radhe Kirana Store',
      shopNameHindiInput.trim() || 'राधे किराना स्टोर'
    );
    setOwnerName(ownerInput.trim() || 'Ramesh Gupta');
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleReset = async () => {
    setIsResetting(true);
    try {
      await resetToSampleData();
      setShopNameInput('Radhe Kirana Store');
      setShopNameHindiInput('राधे किराना स्टोर');
      setOwnerInput('Ramesh Gupta');
      setResetSuccess(true);
      setTimeout(() => setResetSuccess(false), 2500);
    } catch (err) {
      console.error('Failed to reset database:', err);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      {/* Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
          {t('settingsTitle')}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          {language === 'hi'
            ? 'भाषा, दुकान का नाम एवं ऑफ़लाइन IndexedDB डेटा प्रबंधन'
            : 'Language, store identity, and offline IndexedDB data controls'}
        </p>
      </div>

      {/* 1. Language Preference Card */}
      <section className="kirana-card p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-3">
          <Languages className="w-5 h-5 text-kirana-700" />
          <h2 className="font-bold text-base text-slate-900">
            {t('languageSelectTitle')}
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Hindi Selector */}
          <button
            type="button"
            onClick={() => setLanguage('hi')}
            className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
              language === 'hi'
                ? 'border-kirana-700 bg-kirana-50/70 ring-2 ring-kirana-600/30 text-kirana-900 font-bold'
                : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
            }`}
          >
            <span className="text-base font-extrabold font-['Noto_Sans_Devanagari']">
              हिन्दी (Hindi)
            </span>
            <span className="text-xs text-slate-500 mt-1">
              भारतीय किराना दुकानों के लिए अनुकूल
            </span>
          </button>

          {/* English Selector */}
          <button
            type="button"
            onClick={() => setLanguage('en')}
            className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
              language === 'en'
                ? 'border-kirana-700 bg-kirana-50/70 ring-2 ring-kirana-600/30 text-kirana-900 font-bold'
                : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
            }`}
          >
            <span className="text-base font-extrabold">English</span>
            <span className="text-xs text-slate-500 mt-1">
              Standard English interface
            </span>
          </button>
        </div>
      </section>

      {/* 2. Shop Identity Form */}
      <section className="kirana-card p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-3">
          <Store className="w-5 h-5 text-kirana-700" />
          <h2 className="font-bold text-base text-slate-900">
            {t('shopDetailsTitle')}
          </h2>
        </div>

        {savedSuccess && (
          <div className="mb-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              {language === 'hi'
                ? 'दुकान की जानकारी अपडेट हो गई!'
                : 'Store details updated successfully!'}
            </span>
          </div>
        )}

        <form onSubmit={handleSaveDetails} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {t('fieldShopName')} (English)
            </label>
            <input
              type="text"
              value={shopNameInput}
              onChange={(e) => setShopNameInput(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-kirana-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {t('fieldShopName')} (हिन्दी)
            </label>
            <input
              type="text"
              value={shopNameHindiInput}
              onChange={(e) => setShopNameHindiInput(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-kirana-500 font-['Noto_Sans_Devanagari']"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {t('fieldOwnerName')}
            </label>
            <input
              type="text"
              value={ownerInput}
              onChange={(e) => setOwnerInput(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-kirana-500"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <Button type="submit" variant="primary" size="md" className="font-bold">
              {language === 'hi' ? 'जानकारी सेव करें' : 'Save Details'}
            </Button>
          </div>
        </form>
      </section>

      {/* 3. IndexedDB Offline Storage & Reset Controls */}
      <section className="kirana-card p-4 sm:p-5 border-amber-200 bg-amber-50/20">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-amber-700" />
            <h2 className="font-bold text-base text-slate-900">
              {language === 'hi' ? 'ऑफ़लाइन डेटाबेस प्रबंधन' : 'Offline Database Controls'}
            </h2>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
            IndexedDB v2
          </span>
        </div>

        <p className="text-xs text-slate-600 mb-3">
          {language === 'hi'
            ? `वर्तमान में आपके ब्राउज़र के IndexedDB में ${products.length} उत्पाद और ${sales.length} बिक्री लेन-देन स्थायी रूप से सुरक्षित हैं। यदि आप डेटाबेस को रीसेट करके पुनः 16 डिफ़ॉल्ट नमूना उत्पाद लोड करना चाहते हैं, तो नीचे दिए गए बटन पर टैप करें।`
            : `Currently ${products.length} products and ${sales.length} sales transactions are safely stored in your browser's local IndexedDB. Reset clears custom data and restores 16 default sample products.`}
        </p>

        {resetSuccess && (
          <div className="mb-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{t('resetSuccess')}</span>
          </div>
        )}

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isResetting}
          onClick={handleReset}
          className="gap-2 border-amber-300 text-amber-900 hover:bg-amber-100 font-bold"
        >
          {isResetting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RotateCcw className="w-4 h-4" />
          )}
          <span>
            {isResetting
              ? language === 'hi'
                ? 'डेटाबेस रीसेट हो रहा है...'
                : 'Resetting Database...'
              : t('btnResetData')}
          </span>
        </Button>
      </section>

      {/* 4. Architecture & Roadmap Information */}
      <section className="kirana-card p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-2">
          <Layers className="w-5 h-5 text-kirana-700" />
          <h2 className="font-bold text-base text-slate-900">
            {language === 'hi'
              ? 'आर्किटेक्चर एवं प्रगति (Phase 2)'
              : 'Architecture & Progress (Phase 2)'}
          </h2>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          {language === 'hi'
            ? 'KiranaSathi अब पूरी तरह से स्थानीय IndexedDB (Dexie.js v2) द्वारा संचालित है। उत्पाद जोड़ना/बदलना, स्टॉक समायोजन, परमाणु बिक्री लेन-देन (Atomic Transactions), और स्टॉक मूवमेंट लेज़र बिना इंटरनेट के 100% ऑफ़लाइन कार्य करते हैं।'
            : 'KiranaSathi is now fully powered by local IndexedDB (Dexie.js v2). Adding/editing products, stock adjustments, atomic sale transactions, and the stock movement audit ledger operate 100% offline with zero cloud dependency.'}
        </p>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            {language === 'hi'
              ? 'KiranaSathi v0.2.0 • फेज़ 2: वास्तविक इन्वेंटरी, बिक्री एवं IndexedDB पूर्ण'
              : 'KiranaSathi v0.2.0 • Phase 2: Real Inventory, Sales & IndexedDB Complete'}
          </span>
        </div>
      </section>
    </div>
  );
};
