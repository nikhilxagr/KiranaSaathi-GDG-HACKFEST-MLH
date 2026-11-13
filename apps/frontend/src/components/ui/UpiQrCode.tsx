import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Copy, Check, QrCode, Smartphone } from 'lucide-react';
import { buildUpiPaymentUrl } from '../../services/salesService';

interface UpiQrCodeProps {
  upiId: string;
  shopName: string;
  amount: number;
  note?: string;
  className?: string;
  isCompact?: boolean;
}

export const UpiQrCode: React.FC<UpiQrCodeProps> = ({
  upiId,
  shopName,
  amount,
  note = 'Kirana Counter Bill',
  className = '',
  isCompact = false,
}) => {
  const [svgContent, setSvgContent] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const cleanAmount = Math.max(0, Number(amount.toFixed(2)));
  const upiUrl = buildUpiPaymentUrl({
    upiId,
    shopName,
    amount: cleanAmount,
    note,
  });

  useEffect(() => {
    let isMounted = true;

    if (cleanAmount <= 0) {
      setSvgContent('');
      return;
    }

    QRCode.toString(upiUrl, {
      type: 'svg',
      margin: 1,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#0f172a', // Slate 900
        light: '#ffffff',
      },
    })
      .then((svg) => {
        if (isMounted) {
          setSvgContent(svg);
          setError(null);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error('Failed to generate UPI QR code:', err);
          setError('QR Code generation failed');
        }
      });

    return () => {
      isMounted = false;
    };
  }, [upiUrl, cleanAmount]);

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (cleanAmount <= 0) {
    return null;
  }

  return (
    <div
      data-testid="upi-qr-card"
      className={`rounded-2xl border border-emerald-300 bg-linear-to-b from-emerald-50/70 to-white p-4 shadow-sm text-center ${className}`}
    >
      {/* Header Pill */}
      <div className="flex items-center justify-between pb-2 border-b border-emerald-200/60 mb-3">
        <div className="flex items-center gap-1.5">
          <QrCode className="w-4 h-4 text-emerald-800" />
          <span className="text-xs font-extrabold text-emerald-950 uppercase tracking-wider">
            UPI QR Payment
          </span>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
          Instant Scan
        </span>
      </div>

      {/* Payee & Amount Display */}
      <div className="mb-2">
        <p className="text-xs text-slate-600 font-medium truncate max-w-[240px] mx-auto">
          {shopName}
        </p>
        <p
          data-testid="upi-qr-amount"
          className="text-2xl font-black text-slate-900 tracking-tight"
        >
          ₹{cleanAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
      </div>

      {/* QR Code Container */}
      <div className="flex justify-center my-2">
        <div className="p-2.5 bg-white rounded-2xl border-2 border-slate-900/10 shadow-xs inline-block">
          {error ? (
            <div className="w-36 h-36 flex items-center justify-center text-xs text-rose-600 font-semibold p-2">
              {error}
            </div>
          ) : svgContent ? (
            <div
              data-testid="upi-qr-svg"
              className={isCompact ? 'w-36 h-36' : 'w-44 h-44'}
              dangerouslySetInnerHTML={{ __html: svgContent }}
            />
          ) : (
            <div className="w-36 h-36 flex items-center justify-center text-xs text-slate-400">
              Generating QR...
            </div>
          )}
        </div>
      </div>

      {/* Instruction & Supported Apps */}
      <p className="text-[11px] text-slate-500 font-semibold flex items-center justify-center gap-1 mt-1">
        <Smartphone className="w-3 h-3 text-slate-400" />
        <span>Scan with GPay, PhonePe, Paytm, or BHIM</span>
      </p>

      {/* VPA / UPI ID Copy Pill */}
      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between bg-slate-50 px-2.5 py-1.5 rounded-xl text-xs">
        <span className="text-[11px] font-mono text-slate-700 font-bold truncate max-w-[180px]">
          {upiId}
        </span>
        <button
          type="button"
          onClick={handleCopyUpi}
          className="text-[10px] font-bold text-kirana-800 hover:text-kirana-950 flex items-center gap-1 bg-white px-2 py-0.5 rounded-md border border-slate-200 shadow-2xs hover:bg-slate-100 transition-colors"
          title="Copy UPI ID"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-600" />
              <span className="text-emerald-700">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3 text-slate-500" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
