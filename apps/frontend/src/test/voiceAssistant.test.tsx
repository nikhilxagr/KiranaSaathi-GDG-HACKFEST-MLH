// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import 'fake-indexeddb/auto';
import {
  normalizeVoiceText,
  extractQuantityAndUnit,
  findBestProductMatch,
  parseVoiceCommand,
} from '../services/voiceCommandService';
import { VoiceCounterAssistant } from '../components/ui/VoiceCounterAssistant';
import { Product } from '../types';

const mockCatalog: Product[] = [
  {
    id: 1,
    name: 'Aashirvaad Shudh Chakki Atta',
    nameHindi: 'आशीर्वाद चक्की आटा',
    category: 'grains',
    sellingPrice: 220,
    costPrice: 195,
    quantity: 25,
    unit: 'packet',
    minimumStock: 5,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 2,
    name: 'India Gate Basmati Rice',
    nameHindi: 'बासमती चावल',
    category: 'grains',
    sellingPrice: 110,
    costPrice: 90,
    quantity: 30,
    unit: 'kg',
    minimumStock: 10,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 3,
    name: 'Fortune Mustard Oil 1L',
    nameHindi: 'फॉर्च्यून सरसों तेल',
    category: 'oil',
    sellingPrice: 145,
    costPrice: 130,
    quantity: 15,
    unit: 'litre',
    minimumStock: 4,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 4,
    name: 'Tata Salt 1kg',
    nameHindi: 'टाटा नमक',
    category: 'spices',
    sellingPrice: 28,
    costPrice: 22,
    quantity: 40,
    unit: 'packet',
    minimumStock: 10,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 5,
    name: 'Maggi 2-Minute Noodles',
    nameHindi: 'मैगी नूडल्स',
    category: 'snacks',
    sellingPrice: 14,
    costPrice: 11,
    quantity: 50,
    unit: 'packet',
    minimumStock: 12,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 6,
    name: 'Toor Dal Premium',
    nameHindi: 'तूर दाल',
    category: 'grains',
    sellingPrice: 160,
    costPrice: 140,
    quantity: 20,
    unit: 'kg',
    minimumStock: 5,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

describe('Voice-Assisted Counter Billing System', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  // TEST 1: normalizeVoiceText
  it('1. correctly normalizes speech text by stripping punctuation and casing', () => {
    const raw = '  2 Packet Atta, Please!  ';
    expect(normalizeVoiceText(raw)).toBe('2 packet atta please');

    const hindiRaw = '  २ पैकेट आटा, देना।  ';
    expect(normalizeVoiceText(hindiRaw)).toContain('२ पैकेट आटा देना');
  });

  // TEST 2: extractQuantityAndUnit with English & digits
  it('2. extracts numeric quantity and unit from English transcript', () => {
    const res1 = extractQuantityAndUnit('2 packet atta');
    expect(res1.quantity).toBe(2);
    expect(res1.unit).toBe('packet');
    expect(res1.remainingText).toBe('atta');

    const res2 = extractQuantityAndUnit('5 kg rice');
    expect(res2.quantity).toBe(5);
    expect(res2.unit).toBe('kg');
    expect(res2.remainingText).toBe('rice');
  });

  // TEST 3: extractQuantityAndUnit with Hindi words and fractions
  it('3. extracts Hindi number words including fractions (aadha, dhai, teen)', () => {
    const resHalf = extractQuantityAndUnit('आधा किलो दाल');
    expect(resHalf.quantity).toBe(0.5);
    expect(resHalf.unit).toBe('kg');
    expect(resHalf.remainingText).toBe('दाल');

    const resDhai = extractQuantityAndUnit('ढाई लीटर तेल');
    expect(resDhai.quantity).toBe(2.5);
    expect(resDhai.unit).toBe('litre');
    expect(resDhai.remainingText).toBe('तेल');

    const resDo = extractQuantityAndUnit('दो पैकेट मैगी');
    expect(resDo.quantity).toBe(2);
    expect(resDo.unit).toBe('packet');
    expect(resDo.remainingText).toBe('मैगी');
  });

  // TEST 4: Filler words removal in Hindi speech
  it('4. strips filler words like "देना", "वाला", "add" in counter speech', () => {
    const res = extractQuantityAndUnit('2 पैकेट आटा देना');
    expect(res.quantity).toBe(2);
    expect(res.unit).toBe('packet');
    expect(res.remainingText).toBe('आटा');
  });

  // TEST 5: Synonym-based catalog search (findBestProductMatch)
  it('5. matches product via Hindi synonyms (chawal -> rice, tel -> mustard oil)', () => {
    const riceMatch = findBestProductMatch('chawal', mockCatalog);
    expect(riceMatch).toBeDefined();
    expect(riceMatch?.id).toBe(2); // India Gate Basmati Rice

    const oilMatch = findBestProductMatch('tel', mockCatalog);
    expect(oilMatch).toBeDefined();
    expect(oilMatch?.id).toBe(3); // Fortune Mustard Oil

    const maggiMatch = findBestProductMatch('मैगी', mockCatalog);
    expect(maggiMatch).toBeDefined();
    expect(maggiMatch?.id).toBe(5); // Maggi
  });

  // TEST 6: parseVoiceCommand - Intent ADD_TO_CART
  it('6. parses ADD_TO_CART command and returns localized feedback', () => {
    const parsed = parseVoiceCommand('2 packet maggi', mockCatalog);
    expect(parsed.intent).toBe('ADD_TO_CART');
    expect(parsed.matchedProduct?.id).toBe(5);
    expect(parsed.quantity).toBe(2);
    expect(parsed.feedbackMessage).toContain('Added 2 packet of "Maggi 2-Minute Noodles"');
    expect(parsed.feedbackMessageHindi).toContain('बिल में जोड़ा: 2 packet मैगी नूडल्स');
  });

  // TEST 7: parseVoiceCommand - Intent CLEAR_CART
  it('7. parses CLEAR_CART command for Hindi & English phrases', () => {
    const enCmd = parseVoiceCommand('clear cart', mockCatalog);
    expect(enCmd.intent).toBe('CLEAR_CART');
    expect(enCmd.feedbackMessage).toContain('Cleared all items');

    const hiCmd = parseVoiceCommand('बिल साफ करो', mockCatalog);
    expect(hiCmd.intent).toBe('CLEAR_CART');
    expect(hiCmd.feedbackMessageHindi).toContain('हटा दिए गए');
  });

  // TEST 8: parseVoiceCommand - Intent CONFIRM_SALE
  it('8. parses CONFIRM_SALE command for counter billing checkout', () => {
    const enCmd = parseVoiceCommand('confirm sale', mockCatalog);
    expect(enCmd.intent).toBe('CONFIRM_SALE');

    const hiCmd = parseVoiceCommand('बिल पक्का करो', mockCatalog);
    expect(hiCmd.intent).toBe('CONFIRM_SALE');
  });

  // TEST 9: parseVoiceCommand - Fallback SEARCH
  it('9. falls back to SEARCH intent when spoken item is not in stock', () => {
    const cmd = parseVoiceCommand('dairy milk silk', mockCatalog);
    expect(cmd.intent).toBe('SEARCH');
    expect(cmd.searchQuery).toContain('dairy milk silk');
  });

  // TEST 10: VoiceCounterAssistant Component Rendering
  it('10. renders microphone button and displays tooltip', () => {
    render(
      <VoiceCounterAssistant
        products={mockCatalog}
        language="hi"
        onAddToCart={vi.fn()}
      />
    );

    const micBtn = screen.getByTestId('voice-mic-button');
    expect(micBtn).toBeInTheDocument();
    expect(micBtn).toHaveAttribute('type', 'button');
  });
});
