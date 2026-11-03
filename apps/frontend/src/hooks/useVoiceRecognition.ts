import { useState, useEffect, useRef, useCallback } from 'react';

// SpeechRecognition type declarations for browser environments
interface IWindow extends Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
}

interface UseVoiceRecognitionOptions {
  language?: 'hi-IN' | 'en-IN';
  onFinalResult?: (transcript: string) => void;
  onError?: (error: string) => void;
}

export const useVoiceRecognition = (options: UseVoiceRecognitionOptions = {}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  const recognitionRef = useRef<any>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const win = window as unknown as IWindow;
    const SpeechRecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (SpeechRecognitionClass) {
      setIsSupported(true);
      try {
        const recognition = new SpeechRecognitionClass();
        recognition.continuous = false; // Single utterance for clean counter commands
        recognition.interimResults = true;
        recognition.lang = optionsRef.current.language || 'hi-IN';

        recognition.onstart = () => {
          setIsListening(true);
          setError(null);
          setTranscript('');
          setInterimTranscript('');
        };

        recognition.onresult = (event: any) => {
          let currentInterim = '';
          let currentFinal = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcriptPiece = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              currentFinal += transcriptPiece;
            } else {
              currentInterim += transcriptPiece;
            }
          }

          if (currentFinal) {
            setTranscript(currentFinal);
            optionsRef.current.onFinalResult?.(currentFinal);
          } else {
            setInterimTranscript(currentInterim);
          }
        };

        recognition.onerror = (event: any) => {
          const errText = event.error === 'not-allowed'
            ? 'Microphone permission denied'
            : event.error === 'no-speech'
            ? 'No speech heard'
            : event.error;
          setError(errText);
          setIsListening(false);
          optionsRef.current.onError?.(errText);
        };

        recognition.onend = () => {
          setIsListening(false);
          setInterimTranscript('');
        };

        recognitionRef.current = recognition;
      } catch (e: any) {
        setIsSupported(false);
      }
    } else {
      setIsSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // Ignore
        }
      }
    };
  }, []);

  // Update language dynamically if changed
  useEffect(() => {
    if (recognitionRef.current && options.language) {
      recognitionRef.current.lang = options.language;
    }
  }, [options.language]);

  const startListening = useCallback(() => {
    setError(null);
    setTranscript('');
    setInterimTranscript('');

    if (!recognitionRef.current) {
      setError('Speech recognition not supported in this browser');
      return;
    }

    try {
      recognitionRef.current.start();
    } catch (err: any) {
      // If already started, restart
      try {
        recognitionRef.current.abort();
        recognitionRef.current.start();
      } catch {
        // Ignore
      }
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore
      }
    }
    setIsListening(false);
  }, []);

  return {
    isListening,
    isSupported,
    transcript,
    interimTranscript,
    error,
    startListening,
    stopListening,
  };
};
