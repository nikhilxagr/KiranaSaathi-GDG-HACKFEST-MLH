import { Language } from '../types';

export interface Translations {
  // Brand
  appName: string;
  appHindiName: string;
  tagline: string;
  demoNotice: string;
  demoBadge: string;

  // Nav
  navHome: string;
  navInventory: string;
  navSales: string;
  navReorder: string;
  navSettings: string;

  // Dashboard
  greetingMorning: string;
  greetingAfternoon: string;
  greetingEvening: string;
  shopBadge: string;
  statTotalProducts: string;
  statInStock: string;
  statLowStock: string;
  statSlowMoving: string;
  statTodaySales: string;
  btnQuickSale: string;
  btnAddProduct: string;
  sectionLowStockTitle: string;
  sectionLowStockSubtitle: string;
  sectionSlowMovingTitle: string;
  sectionSlowMovingSubtitle: string;
  sectionRecentSalesTitle: string;
  viewAll: string;
  viewReorder: string;
  noLowStock: string;
  noSlowMoving: string;
  noRecentSales: string;

  // Inventory
  inventoryTitle: string;
  searchPlaceholder: string;
  filterAll: string;
  filterLowStock: string;
  colProduct: string;
  colCategory: string;
  colStock: string;
  colPrice: string;
  colActions: string;
  statusHealthy: string;
  statusLow: string;
  statusOutOfStock: string;
  addNewProductTitle: string;
  editProductTitle: string;
  fieldName: string;
  fieldNameHindi: string;
  fieldCategory: string;
  fieldQuantity: string;
  fieldUnit: string;
  fieldThreshold: string;
  fieldCostPrice: string;
  fieldSellingPrice: string;
  btnSaveProduct: string;
  btnCancel: string;
  msgProductAdded: string;
  errRequiredFields: string;
  errInvalidQuantity: string;

  // Units
  unitKg: string;
  unitGm: string;
  unitLitre: string;
  unitPacket: string;
  unitPiece: string;

  // Categories
  catGrains: string;
  catOil: string;
  catSpices: string;
  catSnacks: string;
  catDairy: string;
  catHousehold: string;

  // Quick Sale
  salesTitle: string;
  salesSubtitle: string;
  cartTitle: string;
  cartEmpty: string;
  totalBill: string;
  btnConfirmSale: string;
  btnClearCart: string;
  errStockExceeded: string;
  receiptTitle: string;
  receiptSubtitle: string;
  btnNewSale: string;
  payCash: string;
  payUpi: string;
  payCredit: string;

  // Reorder & Suppliers
  reorderTitle: string;
  tabLowStock: string;
  tabSlowMoving: string;
  tabSuppliers: string;
  suggestedReorder: string;
  btnOrderWhatsApp: string;
  btnCopyOrder: string;
  orderCopied: string;
  daysIdle: string;
  slowMovingAdvice: string;
  btnManageSuppliers: string;
  btnReceiveStock: string;
  btnShareOrder: string;
  filterAllSuppliers: string;
  filterUnassigned: string;
  supplierLabel: string;
  supplierName: string;
  supplierPhone: string;
  leadTimeDaysLabel: string;
  supplierNotes: string;
  btnAddSupplier: string;
  btnEditSupplier: string;
  btnDeleteSupplier: string;
  noSuppliers: string;
  reorderReasonLabel: string;
  modeThresholdLabel: string;
  modeSalesAwareLabel: string;
  receiveStockTitle: string;
  receivedQuantityLabel: string;
  newTotalStockLabel: string;
  confirmReceiveStock: string;
  orderPreviewTitle: string;
  selectItemsToOrder: string;
  selectedItemsCount: string;

  // Settings
  settingsTitle: string;
  languageSelectTitle: string;
  shopDetailsTitle: string;
  fieldShopName: string;
  fieldOwnerName: string;
  btnResetData: string;
  resetSuccess: string;
  aboutPhase1Title: string;
  aboutPhase1Desc: string;

  // Backend Connection Status
  backendConnected: string;
  backendUnavailable: string;
  backendChecking: string;
}

export const DICTIONARY: Record<Language, Translations> = {
  hi: {
    appName: 'KiranaSathi',
    appHindiName: 'किराना साथी',
    tagline: 'किराना दुकान का भरोसेमंद डिजिटल साथी',
    demoNotice: '💾 ऑफ़लाइन IndexedDB सक्रिय — सभी सामान और बिक्री रिकॉर्ड आपके डिवाइस में सुरक्षित सेव हैं',
    demoBadge: 'IndexedDB सेव्ड',

    navHome: 'होम',
    navInventory: 'स्टॉक',
    navSales: 'बिक्री',
    navReorder: 'ऑर्डर',
    navSettings: 'सेटिंग्स',

    greetingMorning: 'शुभ प्रभात',
    greetingAfternoon: 'नमस्ते',
    greetingEvening: 'शुभ संध्या',
    shopBadge: 'किराना दुकान',
    statTotalProducts: 'कुल उत्पाद',
    statInStock: 'पर्याप्त स्टॉक',
    statLowStock: 'कम स्टॉक अलर्ट',
    statSlowMoving: 'धीमी बिक्री वाले',
    statTodaySales: 'आज की डेमो बिक्री',
    btnQuickSale: 'त्वरित बिक्री करें',
    btnAddProduct: 'नया सामान जोड़ें',
    sectionLowStockTitle: 'जल्द खत्म होने वाले सामान',
    sectionLowStockSubtitle: 'ये उत्पाद न्यूनतम सीमा से कम हैं',
    sectionSlowMovingTitle: 'धीमी बिक्री वाले उत्पाद',
    sectionSlowMovingSubtitle: '15+ दिनों से कोई बिक्री नहीं हुई',
    sectionRecentSalesTitle: 'हाल की बिक्री (डेमो)',
    viewAll: 'सभी देखें',
    viewReorder: 'ऑर्डर सूची देखें',
    noLowStock: 'बहुत बढ़िया! सभी सामान पर्याप्त मात्रा में हैं।',
    noSlowMoving: 'कोई धीमा सामान नहीं मिला।',
    noRecentSales: 'अभी तक कोई बिक्री दर्ज नहीं हुई है।',

    inventoryTitle: 'सामान एवं स्टॉक सूची',
    searchPlaceholder: 'सामान का नाम या बारकोड खोजें...',
    filterAll: 'सभी',
    filterLowStock: 'कम स्टॉक केवल',
    colProduct: 'उत्पाद',
    colCategory: 'श्रेणी',
    colStock: 'स्टॉक मात्रा',
    colPrice: 'कीमत (मूल्य)',
    colActions: 'कार्य',
    statusHealthy: 'पर्याप्त',
    statusLow: 'कम स्टॉक',
    statusOutOfStock: 'खत्म',
    addNewProductTitle: 'नया सामान दर्ज करें',
    editProductTitle: 'सामान की जानकारी बदलें',
    fieldName: 'उत्पाद का नाम (English)',
    fieldNameHindi: 'हिन्दी नाम (वैकल्पिक)',
    fieldCategory: 'श्रेणी चुनें',
    fieldQuantity: 'वर्तमान स्टॉक मात्रा',
    fieldUnit: 'इकाई (Unit)',
    fieldThreshold: 'न्यूनतम स्टॉक सीमा (अलर्ट के लिए)',
    fieldCostPrice: 'खरीद मूल्य (लागत ₹)',
    fieldSellingPrice: 'बिक्री मूल्य (MRP/विक्रय ₹)',
    btnSaveProduct: 'सामान सेव करें',
    btnCancel: 'रद्द करें',
    msgProductAdded: 'सामान सफलता से जोड़ा गया (डेमो सूची में)!',
    errRequiredFields: 'कृपया सभी आवश्यक फ़ील्ड भरें।',
    errInvalidQuantity: 'मात्रा शून्य से अधिक होनी चाहिए।',

    unitKg: 'किलो (kg)',
    unitGm: 'ग्राम (gm)',
    unitLitre: 'लीटर (L)',
    unitPacket: 'पैकेट (pkt)',
    unitPiece: 'नग (pc)',

    catGrains: 'दाल एवं अनाज',
    catOil: 'तेल एवं घी',
    catSpices: 'मसाले व नमक',
    catSnacks: 'बिस्कुट व स्नैक्स',
    catDairy: 'डेयरी व चाय',
    catHousehold: 'घरेलू सामान',

    salesTitle: 'त्वरित काउंटर बिक्री',
    salesSubtitle: 'तेज बिलिंग: सामान चुनें और तुरंत बिल बनाएं',
    cartTitle: 'काउंटर बिल / चुनिंदा सामान',
    cartEmpty: 'अभी तक कोई सामान नहीं चुना गया। बाईं ओर से सामान पर टैप करें।',
    totalBill: 'कुल बिल राशि',
    btnConfirmSale: 'बिक्री पक्की करें (डेमो)',
    btnClearCart: 'खाली करें',
    errStockExceeded: 'मात्रा उपलब्ध स्टॉक से अधिक है!',
    receiptTitle: 'बिक्री पक्की हुई (डेमो रसीद)',
    receiptSubtitle: 'यह फेज़ 1 की डेमो रसीद है। स्थायी लेज़र फेज़ 2 में सेव होगा।',
    btnNewSale: 'अगली बिक्री शुरू करें',
    payCash: 'नकद (Cash)',
    payUpi: 'UPI / क्यूआर कोड',
    payCredit: 'उधार (खाता)',

    reorderTitle: 'पुनः ऑर्डर एवं सप्लायर सूची',
    tabLowStock: 'कम स्टॉक (तुरंत ऑर्डर)',
    tabSlowMoving: 'धीमी बिक्री (सुझाव)',
    tabSuppliers: 'सप्लायर / डीलर सूची',
    suggestedReorder: 'सुझावित ऑर्डर',
    btnOrderWhatsApp: 'सप्लायर को WhatsApp पर भेजें',
    btnCopyOrder: 'ऑर्डर कॉपी करें',
    orderCopied: 'ऑर्डर टेक्स्ट कॉपी हो गया!',
    daysIdle: 'दिनों से नहीं बिका',
    slowMovingAdvice: 'सुझाव: नया स्टॉक कम मंगवाएं या काउंटर पर आगे रखें।',
    btnManageSuppliers: 'सप्लायर प्रबंधन',
    btnReceiveStock: 'स्टॉक प्राप्त करें',
    btnShareOrder: 'ऑर्डर भेजें / साझा करें',
    filterAllSuppliers: 'सभी सप्लायर',
    filterUnassigned: 'बिना सप्लायर वाले',
    supplierLabel: 'सप्लायर',
    supplierName: 'सप्लायर का नाम',
    supplierPhone: 'फोन नंबर',
    leadTimeDaysLabel: 'डिलीवरी समय (दिन)',
    supplierNotes: 'सप्लायर विवरण / नोट्स',
    btnAddSupplier: 'नया सप्लायर जोड़ें',
    btnEditSupplier: 'सप्लायर बदलें',
    btnDeleteSupplier: 'सप्लायर हटाएं',
    noSuppliers: 'कोई सप्लायर नहीं जोड़ा गया है।',
    reorderReasonLabel: 'सुझाव का कारण',
    modeThresholdLabel: 'न्यूनतम सीमा नियम',
    modeSalesAwareLabel: 'मांग-आधारित गणना',
    receiveStockTitle: 'सामान का नया स्टॉक प्राप्त करें',
    receivedQuantityLabel: 'प्राप्त मात्रा',
    newTotalStockLabel: 'नया कुल स्टॉक',
    confirmReceiveStock: 'स्टॉक दर्ज करें',
    orderPreviewTitle: 'होलसेल ऑर्डर पूर्वावलोकन',
    selectItemsToOrder: 'ऑर्डर के लिए सामान चुनें',
    selectedItemsCount: 'चुने गए सामान',

    settingsTitle: 'दुकान प्राथमिकताएं ও सेटिंग्स',
    languageSelectTitle: 'भाषा चुनें (Select Language)',
    shopDetailsTitle: 'दुकान की जानकारी',
    fieldShopName: 'दुकान का नाम',
    fieldOwnerName: 'दुकानदार का नाम',
    btnResetData: 'डेमो डेटा रीसेट करें',
    resetSuccess: 'डेमो डेटा मूल स्थिति में रीसेट हो गया!',
    aboutPhase1Title: 'KiranaSathi फेज़ 1 के बारे में',
    aboutPhase1Desc: 'यह फेज़ 1 का फ्रंटएंड यूआई है जो बिना सर्वर के तुरंत चलता है। फेज़ 2 में डेक्सी (Dexie) डेटाबेस जोड़कर इसे 100% स्थायी ऑफ़लाइन बनाया जाएगा।',
    backendConnected: 'सर्वर कनेक्टेड',
    backendUnavailable: 'सर्वर ऑफलाइन',
    backendChecking: 'जांच हो रही है...',
  },
  en: {
    appName: 'KiranaSathi',
    appHindiName: 'किराना साथी',
    tagline: 'Smart Inventory & Reorder Assistant',
    demoNotice: '💾 Offline IndexedDB Active — All inventory and sales records are saved locally on your device',
    demoBadge: 'IndexedDB Saved',

    navHome: 'Home',
    navInventory: 'Stock',
    navSales: 'Sales',
    navReorder: 'Reorder',
    navSettings: 'Settings',

    greetingMorning: 'Good morning',
    greetingAfternoon: 'Good afternoon',
    greetingEvening: 'Good evening',
    shopBadge: 'Kirana Store',
    statTotalProducts: 'Total Items',
    statInStock: 'In Stock',
    statLowStock: 'Low Stock Alerts',
    statSlowMoving: 'Slow Moving',
    statTodaySales: "Today's Real Sales",
    btnQuickSale: 'Quick Sale',
    btnAddProduct: 'Add New Stock',
    sectionLowStockTitle: 'Low Stock Items',
    sectionLowStockSubtitle: 'Products below minimum reorder threshold',
    sectionSlowMovingTitle: 'Slow Moving Stock',
    sectionSlowMovingSubtitle: 'No sales recorded in 30+ days',
    sectionRecentSalesTitle: 'Recent Sales (Ledger)',
    viewAll: 'View All',
    viewReorder: 'View Reorder List',
    noLowStock: 'Great! All inventory levels are healthy.',
    noSlowMoving: 'No slow moving products found.',
    noRecentSales: 'No sales recorded yet.',

    inventoryTitle: 'Inventory & Stock Catalog',
    searchPlaceholder: 'Search by item name or barcode...',
    filterAll: 'All',
    filterLowStock: 'Low Stock Only',
    colProduct: 'Product',
    colCategory: 'Category',
    colStock: 'Current Stock',
    colPrice: 'Price',
    colActions: 'Actions',
    statusHealthy: 'In Stock',
    statusLow: 'Low Stock',
    statusOutOfStock: 'Out of Stock',
    addNewProductTitle: 'Add New Product',
    editProductTitle: 'Edit Product Details',
    fieldName: 'Product Name (English)',
    fieldNameHindi: 'Hindi Name (Optional)',
    fieldCategory: 'Select Category',
    fieldQuantity: 'Current Stock Quantity',
    fieldUnit: 'Unit',
    fieldThreshold: 'Minimum Stock Threshold',
    fieldCostPrice: 'Cost Price (₹)',
    fieldSellingPrice: 'Selling Price (₹)',
    btnSaveProduct: 'Save Product',
    btnCancel: 'Cancel',
    msgProductAdded: 'Product added successfully (to demo catalog)!',
    errRequiredFields: 'Please fill in all required fields.',
    errInvalidQuantity: 'Quantity must be greater than zero.',

    unitKg: 'Kilogram (kg)',
    unitGm: 'Gram (gm)',
    unitLitre: 'Litre (L)',
    unitPacket: 'Packet (pkt)',
    unitPiece: 'Piece (pc)',

    catGrains: 'Grains & Pulses',
    catOil: 'Oil & Ghee',
    catSpices: 'Spices & Salt',
    catSnacks: 'Biscuits & Snacks',
    catDairy: 'Dairy & Tea',
    catHousehold: 'Household & Cleaning',

    salesTitle: 'Fast Counter Sale',
    salesSubtitle: 'Quick billing: Tap products to add and bill instantly',
    cartTitle: 'Counter Tray / Active Bill',
    cartEmpty: 'No items selected yet. Tap products on the left/above to add.',
    totalBill: 'Total Bill Amount',
    btnConfirmSale: 'Confirm Sale (Demo)',
    btnClearCart: 'Clear Tray',
    errStockExceeded: 'Quantity exceeds available stock!',
    receiptTitle: 'Sale Confirmed (Demo Receipt)',
    receiptSubtitle: 'This is Phase 1 demonstration data. Real persistence will connect in Phase 2.',
    btnNewSale: 'Start Next Sale',
    payCash: 'Cash',
    payUpi: 'UPI / QR Code',
    payCredit: 'Customer Credit (Khata)',

    reorderTitle: 'Reorder & Supplier List',
    tabLowStock: 'Urgent Low Stock',
    tabSlowMoving: 'Slow Moving Advice',
    tabSuppliers: 'Suppliers & Distributors',
    suggestedReorder: 'Suggested Reorder',
    btnOrderWhatsApp: 'Send Order via WhatsApp',
    btnCopyOrder: 'Copy Order List',
    orderCopied: 'Order list copied to clipboard!',
    daysIdle: 'days without sale',
    slowMovingAdvice: 'Tip: Consider promotional pricing or reduce next wholesale order.',
    btnManageSuppliers: 'Manage Suppliers',
    btnReceiveStock: 'Receive Stock',
    btnShareOrder: 'Share / Send Order',
    filterAllSuppliers: 'All Suppliers',
    filterUnassigned: 'Unassigned Suppliers',
    supplierLabel: 'Supplier',
    supplierName: 'Supplier Name',
    supplierPhone: 'Phone Number',
    leadTimeDaysLabel: 'Lead Time (Days)',
    supplierNotes: 'Notes & Terms',
    btnAddSupplier: 'Add Supplier',
    btnEditSupplier: 'Edit Supplier',
    btnDeleteSupplier: 'Delete Supplier',
    noSuppliers: 'No suppliers added yet.',
    reorderReasonLabel: 'Reason for suggestion',
    modeThresholdLabel: 'Minimum Threshold Rule',
    modeSalesAwareLabel: 'Sales-Aware Demand',
    receiveStockTitle: 'Receive Purchased Stock',
    receivedQuantityLabel: 'Quantity Received',
    newTotalStockLabel: 'New Total Stock',
    confirmReceiveStock: 'Confirm & Save Stock',
    orderPreviewTitle: 'Wholesale Order Preview',
    selectItemsToOrder: 'Select items to prepare wholesale order',
    selectedItemsCount: 'Selected Items',

    settingsTitle: 'Shop Preferences & Settings',
    languageSelectTitle: 'Select Language (भाषा)',
    shopDetailsTitle: 'Store Details',
    fieldShopName: 'Store Name',
    fieldOwnerName: 'Owner Name',
    btnResetData: 'Reset Demo Data',
    resetSuccess: 'Demo data has been reset to defaults!',
    aboutPhase1Title: 'About KiranaSathi Phase 1',
    aboutPhase1Desc: 'This is the production-quality frontend UI for Phase 1. It operates standalone in-memory. Phase 2 will bind IndexedDB (Dexie) for true offline persistence.',
    backendConnected: 'Backend connected',
    backendUnavailable: 'Backend unavailable',
    backendChecking: 'Checking connection...',
  },
};

/**
 * Helper to get translated string for a key and language
 */
export const t = (key: keyof Translations, lang: Language = 'hi'): string => {
  return DICTIONARY[lang][key] || DICTIONARY['en'][key] || key;
};

/**
 * Backwards compatibility helper for Phase 0 components
 */
export const i18n = {
  appName: DICTIONARY.en.appName,
  appHindiName: DICTIONARY.hi.appHindiName,
  tagline: DICTIONARY.en.tagline,
  taglineHindi: DICTIONARY.hi.tagline,
};
