// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, waitFor, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import 'fake-indexeddb/auto';
import {
  buildUpiPaymentUrl,
  formatCustomerReceiptText,
  buildCustomerWhatsAppUrl,
} from '../services/salesService';
import { UpiQrCode } from '../components/ui/UpiQrCode';
import { Sale } from '../types';

describe('Dynamic UPI QR & Customer WhatsApp Digital Receipt', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  // TEST 1: buildUpiPaymentUrl
  it('1. correctly formats NPCI-standard UPI deep-link URL', () => {
    const url = buildUpiPaymentUrl({
      upiId: 'radhekirana@upi',
      shopName: 'Radhe Kirana Store',
      amount: 245.5,
      note: 'Counter Bill #1042',
    });

    expect(url).toContain('upi://pay?pa=radhekirana@upi');
    expect(url).toContain('&pn=Radhe%20Kirana%20Store');
    expect(url).toContain('&am=245.50');
    expect(url).toContain('&cu=INR');
    expect(url).toContain('&tn=Counter%20Bill%20%231042');
  });

  // TEST 2: formatCustomerReceiptText in Hindi
  it('2. generates formatted Hindi WhatsApp digital receipt text', () => {
    const sale: Sale = {
      id: 42,
      receiptNumber: 'REC-9821-001',
      items: [
        {
          productId: 1,
          productName: 'Aashirvaad Atta (5kg)',
          productNameHindi: 'आशीर्वाद चक्की आटा (5 किग्रा)',
          quantity: 1,
          unit: 'packet',
          unitPrice: 245,
          lineTotal: 245,
        },
        {
          productId: 2,
          productName: 'Basmati Rice',
          productNameHindi: 'बासमती चावल (खुला)',
          quantity: 2.5,
          unit: 'kg',
          unitPrice: 110,
          lineTotal: 275,
        },
      ],
      totalAmount: 520,
      paymentMethod: 'upi',
      createdAt: '2026-11-14T10:30:00.000Z',
    };

    const text = formatCustomerReceiptText({
      sale,
      shopName: 'Radhe Kirana Store',
      shopNameHindi: 'राधे किराना स्टोर',
      ownerName: 'Ramesh Gupta',
      language: 'hi',
    });

    expect(text).toContain('राधे किराना स्टोर');
    expect(text).toContain('डिजिटल बिल रसीद');
    expect(text).toContain('#REC-9821-001');
    expect(text).toContain('UPI / क्यूआर कोड');
    expect(text).toContain('आशीर्वाद चक्की आटा (5 किग्रा)');
    expect(text).toContain('1 packet × ₹245 = *₹245*');
    expect(text).toContain('बासमती चावल (खुला)');
    expect(text).toContain('2.5 kg × ₹110 = *₹275*');
    expect(text).toContain('₹520');
    expect(text).toContain('दुकान पर आने के लिए धन्यवाद!');
    expect(text).toContain('KiranaSathi');
  });

  // TEST 3: formatCustomerReceiptText in English
  it('3. generates formatted English WhatsApp digital receipt text', () => {
    const sale: Sale = {
      id: 43,
      receiptNumber: 'REC-9821-002',
      items: [
        {
          productId: 5,
          productName: 'Tata Salt 1kg',
          quantity: 2,
          unit: 'packet',
          unitPrice: 28,
          lineTotal: 56,
        },
      ],
      totalAmount: 56,
      paymentMethod: 'cash',
      createdAt: '2026-11-14T10:35:00.000Z',
    };

    const text = formatCustomerReceiptText({
      sale,
      shopName: 'Radhe Kirana Store',
      ownerName: 'Ramesh Gupta',
      language: 'en',
    });

    expect(text).toContain('Radhe Kirana Store');
    expect(text).toContain('Digital Sales Receipt');
    expect(text).toContain('#REC-9821-002');
    expect(text).toContain('Cash');
    expect(text).toContain('Tata Salt 1kg');
    expect(text).toContain('₹56');
    expect(text).toContain('Thank you for shopping with us!');
  });

  // TEST 4: buildCustomerWhatsAppUrl
  it('4. builds WhatsApp deep-link with automatic +91 country prefix', () => {
    const receiptText = 'Receipt: ₹100';

    // 10-digit phone number
    const url1 = buildCustomerWhatsAppUrl('9820112345', receiptText);
    expect(url1).toBe('https://wa.me/919820112345?text=Receipt%3A%20%E2%82%B9100');

    // Already with +91 or country code
    const url2 = buildCustomerWhatsAppUrl('+91 98201-12345', receiptText);
    expect(url2).toBe('https://wa.me/919820112345?text=Receipt%3A%20%E2%82%B9100');

    // Blank phone number falls back to general WhatsApp share
    const url3 = buildCustomerWhatsAppUrl('', receiptText);
    expect(url3).toBe('https://wa.me/?text=Receipt%3A%20%E2%82%B9100');
  });

  // TEST 5: UpiQrCode Component Rendering
  it('5. renders UPI QR Code component with amount, VPA and SVG', async () => {
    render(
      <UpiQrCode
        upiId="radhekirana@upi"
        shopName="Radhe Kirana Store"
        amount={350}
        note="Test Counter Bill"
      />
    );

    // Payee name & formatted amount
    expect(screen.getByText('Radhe Kirana Store')).toBeInTheDocument();
    expect(screen.getByTestId('upi-qr-amount')).toHaveTextContent('₹350.00');
    expect(screen.getByText('radhekirana@upi')).toBeInTheDocument();

    // Verify SVG generation finishes
    await waitFor(() => {
      expect(screen.getByTestId('upi-qr-svg')).toBeInTheDocument();
    });
  });

  // TEST 6: Copy UPI ID
  it('6. provides copy button for UPI ID with feedback', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    render(
      <UpiQrCode
        upiId="store@okaxis"
        shopName="Test Kirana"
        amount={100}
      />
    );

    const copyBtn = screen.getByTitle('Copy UPI ID');
    fireEvent.click(copyBtn);

    expect(writeTextMock).toHaveBeenCalledWith('store@okaxis');
    await waitFor(() => {
      expect(screen.getByText('Copied')).toBeInTheDocument();
    });
  });

  // TEST 7: Zero Amount Handling
  it('7. safely suppresses QR code when bill amount is 0', () => {
    const { container } = render(
      <UpiQrCode
        upiId="radhekirana@upi"
        shopName="Radhe Kirana Store"
        amount={0}
      />
    );

    expect(container.firstChild).toBeNull();
  });
});
