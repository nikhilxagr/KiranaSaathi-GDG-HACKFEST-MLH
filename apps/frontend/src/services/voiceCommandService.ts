import { Product } from '../types';

export interface ParsedVoiceCommand {
  rawTranscript: string;
  intent: 'ADD_TO_CART' | 'CLEAR_CART' | 'CONFIRM_SALE' | 'SEARCH';
  matchedProduct?: Product;
  quantity: number;
  unit?: string;
  searchQuery?: string;
  feedbackMessage: string;
  feedbackMessageHindi: string;
}

/**
 * Hindi & English Number Word Map for Counter Speech
 */
const NUMBER_WORDS: Record<string, number> = {
  'आधा': 0.5,
  'aadha': 0.5,
  'adha': 0.5,
  'half': 0.5,
  'एक': 1,
  'ek': 1,
  'one': 1,
  'डेढ़': 1.5,
  'dedh': 1.5,
  'दो': 2,
  'do': 2,
  'two': 2,
  'ढाई': 2.5,
  'dhai': 2.5,
  'तीन': 3,
  'teen': 3,
  'three': 3,
  'चार': 4,
  'char': 4,
  'chaar': 4,
  'four': 4,
  'पांच': 5,
  'panch': 5,
  'paanch': 5,
  'five': 5,
  'छह': 6,
  'chhe': 6,
  'chhah': 6,
  'six': 6,
  'सात': 7,
  'saat': 7,
  'seven': 7,
  'आठ': 8,
  'aath': 8,
  'eight': 8,
  'नौ': 9,
  'nau': 9,
  'nine': 9,
  'दस': 10,
  'das': 10,
  'ten': 10,
  'ग्यारह': 11,
  'gyarah': 11,
  'बारह': 12,
  'barah': 12,
  'पंद्रह': 15,
  'pandrah': 15,
  'बीस': 20,
  'bees': 20,
  'twenty': 20,
  'पच्चीस': 25,
  'pachis': 25,
  'pachees': 25,
  'पचास': 50,
  'pachas': 50,
  'fifty': 50,
  'सौ': 100,
  'sau': 100,
  'hundred': 100,
};

/**
 * Synonyms mapping common spoken words to product search terms
 */
const HINDI_SYNONYMS: Record<string, string[]> = {
  chawal: ['rice', 'basmati', 'चावल'],
  चावल: ['rice', 'basmati'],
  atta: ['atta', 'aashirvaad', 'chakki', 'आटा'],
  आटा: ['atta', 'aashirvaad'],
  tel: ['oil', 'mustard', 'sunflower', 'fortune', 'तेल'],
  तेल: ['oil', 'mustard', 'sunflower', 'fortune'],
  chini: ['sugar', 'चीनी', 'शक्कर'],
  चीनी: ['sugar'],
  shakkar: ['sugar', 'चीनी'],
  dal: ['dal', 'toor', 'chana', 'दाल'],
  दाल: ['dal', 'toor', 'chana'],
  namak: ['salt', 'tata', 'नमक'],
  नमक: ['salt', 'tata'],
  doodh: ['milk', 'amul', 'dairy', 'दूध'],
  दूध: ['milk', 'amul'],
  chai: ['tea', 'tata tea', 'चाय'],
  चाय: ['tea', 'tata tea'],
  haldi: ['turmeric', 'spices', 'हल्दी'],
  हल्दी: ['turmeric', 'spices'],
  mirch: ['chilli', 'spices', 'मिर्च'],
  मिर्च: ['chilli', 'spices'],
  biscuit: ['parle-g', 'biscuit', 'snacks', 'बिस्कुट'],
  बिस्कुट: ['parle-g', 'snacks'],
  maggi: ['maggi', 'noodles', 'मैगी'],
  मैगी: ['maggi', 'noodles'],
};

/**
 * Normalizes speech text for robust token matching
 */
export const normalizeVoiceText = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Extracts quantity and optional unit from speech tokens
 */
export const extractQuantityAndUnit = (
  text: string
): { quantity: number; unit?: string; remainingText: string } => {
  const normalized = normalizeVoiceText(text);
  const tokens = normalized.split(' ');

  let quantity = 1;
  let unit: string | undefined = undefined;
  const remainingTokens: string[] = [];

  let foundQty = false;

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    // 1. Check direct digit (e.g. "2", "2.5", "10")
    if (!foundQty && /^\d+(\.\d+)?$/.test(token)) {
      quantity = parseFloat(token);
      foundQty = true;
      continue;
    }

    // 2. Check Hindi/English word numbers
    if (!foundQty && NUMBER_WORDS[token] !== undefined) {
      quantity = NUMBER_WORDS[token];
      foundQty = true;
      continue;
    }

    // 3. Check unit tokens
    if (['packet', 'पैकेट', 'pkt', 'packets', 'pack'].includes(token)) {
      unit = 'packet';
      continue;
    }
    if (['kilo', 'kg', 'किलो', 'किलोग्राम', 'किग्रा', 'kilogram'].includes(token)) {
      unit = 'kg';
      continue;
    }
    if (['litre', 'liter', 'लीटर', 'ltr'].includes(token)) {
      unit = 'litre';
      continue;
    }
    if (['gram', 'gm', 'ग्राम', 'grams'].includes(token)) {
      unit = 'gm';
      continue;
    }
    if (['piece', 'pc', 'पीस', 'नग', 'pcs'].includes(token)) {
      unit = 'piece';
      continue;
    }

    // Filter out filler words
    if (['का', 'की', 'के', 'वाला', 'वाली', 'दो', 'दे', 'देना', 'डालो', 'जोड़ो', 'add', 'please', 'put', 'and'].includes(token) && remainingTokens.length > 0) {
      continue;
    }

    remainingTokens.push(token);
  }

  return {
    quantity,
    unit,
    remainingText: remainingTokens.join(' ').trim(),
  };
};

/**
 * Finds the best matching product from the catalog given an utterance
 */
export const findBestProductMatch = (
  queryText: string,
  products: Product[]
): Product | undefined => {
  if (!queryText.trim() || products.length === 0) return undefined;

  const cleanQuery = normalizeVoiceText(queryText);
  const queryTokens = cleanQuery.split(' ').filter(Boolean);

  let bestProduct: Product | undefined = undefined;
  let highestScore = 0;

  for (const product of products) {
    let score = 0;
    const nameLower = product.name.toLowerCase();
    const hindiLower = (product.nameHindi || '').toLowerCase();
    const categoryLower = product.category.toLowerCase();

    // 1. Direct exact or substring match (Highest priority)
    if (nameLower.includes(cleanQuery) || hindiLower.includes(cleanQuery)) {
      score += 100;
    }

    // 2. Token overlap scoring
    for (const token of queryTokens) {
      if (nameLower.includes(token)) score += 30;
      if (hindiLower.includes(token)) score += 35;
      if (categoryLower.includes(token)) score += 15;

      // 3. Synonym matching (e.g. "chawal" -> "rice")
      const synonyms = HINDI_SYNONYMS[token];
      if (synonyms) {
        for (const syn of synonyms) {
          if (nameLower.includes(syn) || hindiLower.includes(syn)) {
            score += 25;
          }
        }
      }
    }

    if (score > highestScore) {
      highestScore = score;
      bestProduct = product;
    }
  }

  // Minimum confidence threshold of 25 to avoid spurious matches
  return highestScore >= 25 ? bestProduct : undefined;
};

/**
 * Parses spoken speech transcript into structured action
 */
export const parseVoiceCommand = (
  rawTranscript: string,
  products: Product[]
): ParsedVoiceCommand => {
  const normalized = normalizeVoiceText(rawTranscript);

  // 1. Intent: CLEAR_CART
  if (
    normalized.includes('clear') ||
    normalized.includes('खाली करो') ||
    normalized.includes('साफ करो') ||
    normalized.includes('हटाओ') ||
    normalized.includes('delete all')
  ) {
    return {
      rawTranscript,
      intent: 'CLEAR_CART',
      quantity: 0,
      feedbackMessage: 'Cleared all items from counter bill tray.',
      feedbackMessageHindi: 'बिल ट्रे से सभी सामान हटा दिए गए।',
    };
  }

  // 2. Intent: CONFIRM_SALE
  if (
    normalized.includes('confirm') ||
    normalized.includes('checkout') ||
    normalized.includes('पक्का करो') ||
    normalized.includes('बिल पक्का') ||
    normalized.includes('बिल बनाओ') ||
    normalized.includes('done sale')
  ) {
    return {
      rawTranscript,
      intent: 'CONFIRM_SALE',
      quantity: 0,
      feedbackMessage: 'Ready to confirm counter sale.',
      feedbackMessageHindi: 'बिक्री पक्की करने के लिए तैयार।',
    };
  }

  // 3. Intent: ADD_TO_CART / ITEM SELECTION
  const { quantity, unit, remainingText } = extractQuantityAndUnit(rawTranscript);
  const matchedProduct = findBestProductMatch(remainingText || normalized, products);

  if (matchedProduct) {
    const pName = matchedProduct.name;
    const pNameHi = matchedProduct.nameHindi || pName;
    const chosenUnit = unit || matchedProduct.unit;

    return {
      rawTranscript,
      intent: 'ADD_TO_CART',
      matchedProduct,
      quantity,
      unit: chosenUnit,
      feedbackMessage: `Added ${quantity} ${chosenUnit} of "${pName}" to bill.`,
      feedbackMessageHindi: `बिल में जोड़ा: ${quantity} ${chosenUnit} ${pNameHi}`,
    };
  }

  // 4. Fallback Intent: SEARCH
  return {
    rawTranscript,
    intent: 'SEARCH',
    quantity: 1,
    searchQuery: remainingText || normalized,
    feedbackMessage: `Searching for: "${remainingText || normalized}"`,
    feedbackMessageHindi: `खोज रहे हैं: "${remainingText || normalized}"`,
  };
};
