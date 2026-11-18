import React, { useState } from 'react';
import { Mic, MicOff, Sparkles, Check, AlertCircle, X, Volume2 } from 'lucide-react';
import { useVoiceRecognition } from '../../hooks/useVoiceRecognition';
import { parseVoiceCommand, ParsedVoiceCommand } from '../../services/voiceCommandService';
import { Product } from '../../types';

interface VoiceCounterAssistantProps {
  products: Product[];
  language: 'hi' | 'en';
  onAddToCart: (product: Product, quantity: number) => void;
  onClearCart?: () => void;
  onConfirmSale?: () => void;
  onSearchQuery?: (query: string) => void;
  className?: string;
}

export const VoiceCounterAssistant: React.FC<VoiceCounterAssistantProps> = ({
  products,
  language,
  onAddToCart,
  onClearCart,
  onConfirmSale,
  onSearchQuery,
  className = '',
}) => {
  const isHindi = language === 'hi';
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackType, setFeedbackType] = useState<'success' | 'info' | 'error'>('info');

  const showNotification = (msg: string, type: 'success' | 'info' | 'error' = 'info') => {
    setFeedback(msg);
    setFeedbackType(type);
    setTimeout(() => {
      setFeedback(null);
    }, 3500);
  };

  const handleCommandResult = (rawTranscript: string) => {
    if (!rawTranscript.trim()) return;

    const parsed: ParsedVoiceCommand = parseVoiceCommand(rawTranscript, products);

    switch (parsed.intent) {
      case 'ADD_TO_CART':
        if (parsed.matchedProduct) {
          onAddToCart(parsed.matchedProduct, parsed.quantity);
          showNotification(
            isHindi ? parsed.feedbackMessageHindi : parsed.feedbackMessage,
            'success'
          );
        }
        break;

      case 'CLEAR_CART':
        if (onClearCart) {
          onClearCart();
          showNotification(
            isHindi ? parsed.feedbackMessageHindi : parsed.feedbackMessage,
            'info'
          );
        }
        break;

      case 'CONFIRM_SALE':
        if (onConfirmSale) {
          onConfirmSale();
          showNotification(
            isHindi ? parsed.feedbackMessageHindi : parsed.feedbackMessage,
            'success'
          );
        }
        break;

      case 'SEARCH':
        if (onSearchQuery && parsed.searchQuery) {
          onSearchQuery(parsed.searchQuery);
          showNotification(
            isHindi ? parsed.feedbackMessageHindi : parsed.feedbackMessage,
            'info'
          );
        }
        break;
    }
  };

  const {
    isListening,
    isSupported,
    interimTranscript,
    startListening,
    stopListening,
  } = useVoiceRecognition({
    language: isHindi ? 'hi-IN' : 'en-IN',
    onFinalResult: handleCommandResult,
    onError: (err) => {
      if (err !== 'no-speech') {
        showNotification(
          isHindi ? `आवाज़ पहचान त्रुटि: ${err}` : `Voice error: ${err}`,
          'error'
        );
      }
    },
  });

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      {/* 1. Main Microphone Action Button */}
      <button
        type="button"
        onClick={toggleListening}
        aria-label={isListening ? 'Stop listening' : 'Start voice counter input'}
        title={
          isSupported
            ? isHindi
              ? 'बोलकर सामान जोड़ें (जैसे: 2 पैकेट आटा)'
              : 'Voice add item (e.g. 2 packet atta)'
            : isHindi
            ? 'इस ब्राउज़र में आवाज़ इनपुट समर्थित नहीं है'
            : 'Voice input not supported in this browser'
        }
        data-testid="voice-mic-button"
        className={`touch-target p-2.5 rounded-xl border transition-all duration-200 flex items-center gap-1.5 font-bold text-xs select-none ${
          isListening
            ? 'bg-rose-500 text-white border-rose-600 ring-4 ring-rose-500/30 scale-105 shadow-md animate-pulse'
            : isSupported
            ? 'bg-kirana-50 hover:bg-kirana-100 text-kirana-900 border-kirana-300 hover:border-kirana-500 shadow-2xs'
            : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
        }`}
      >
        {isListening ? (
          <>
            <Mic className="w-4 h-4 animate-bounce text-white" />
            <span className="hidden sm:inline">
              {isHindi ? 'सुन रहे हैं...' : 'Listening...'}
            </span>
          </>
        ) : (
          <>
            <Mic className="w-4 h-4 text-kirana-800" />
            <span className="hidden sm:inline text-kirana-900">
              {isHindi ? 'बोलें' : 'Voice'}
            </span>
          </>
        )}
      </button>

      {/* 2. Floating Interim Transcription Banner when Listening */}
      {isListening && (
        <div
          data-testid="voice-listening-popover"
          className="absolute top-12 right-0 z-40 bg-slate-900 text-white px-3.5 py-2.5 rounded-2xl shadow-xl border border-slate-700 w-72 max-w-[calc(100vw-2rem)] animate-in fade-in zoom-in-95"
        >
          <div className="flex items-center justify-between pb-1 mb-1 border-b border-slate-800">
            <span className="text-[10px] font-extrabold uppercase text-emerald-400 tracking-wider flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
              {isHindi ? 'आवाज़ रिकॉर्डिंग चालू है' : 'Voice Counter Active'}
            </span>
            <button
              onClick={stopListening}
              className="text-slate-400 hover:text-white p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-xs font-semibold text-slate-100 min-h-6 flex items-center">
            {interimTranscript ? (
              <span className="text-emerald-300 italic">"{interimTranscript}"</span>
            ) : (
              <span className="text-slate-400 flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-kirana-400 shrink-0" />
                {isHindi
                  ? 'उदा: "2 पैकेट आटा" या "1 किलो चीनी"'
                  : 'Say e.g. "2 packet atta" or "1 kg rice"'}
              </span>
            )}
          </p>
        </div>
      )}

      {/* 3. Feedback Toast Message */}
      {feedback && (
        <div
          data-testid="voice-feedback-toast"
          className={`absolute top-12 right-0 z-40 px-3.5 py-2 rounded-xl text-xs font-bold shadow-lg border flex items-center gap-2 w-72 max-w-[calc(100vw-2rem)] animate-in fade-in slide-in-from-top-1 ${
            feedbackType === 'success'
              ? 'bg-emerald-800 text-white border-emerald-600'
              : feedbackType === 'error'
              ? 'bg-rose-800 text-white border-rose-600'
              : 'bg-slate-800 text-slate-100 border-slate-600'
          }`}
        >
          {feedbackType === 'success' ? (
            <Check className="w-4 h-4 text-emerald-300 shrink-0" />
          ) : feedbackType === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-300 shrink-0" />
          ) : (
            <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
          )}
          <span className="truncate flex-1">{feedback}</span>
          <button
            onClick={() => setFeedback(null)}
            className="text-slate-300 hover:text-white p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
