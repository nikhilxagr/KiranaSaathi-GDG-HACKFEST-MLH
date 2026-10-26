import { useState, useEffect, useCallback, useRef } from 'react';
import { checkBackendHealth } from '../services/api';
import { BackendConnectionStatus } from '../types';

export interface UseBackendHealthResult {
  status: BackendConnectionStatus;
  lastChecked: Date | null;
  error: string | null;
  checkNow: () => Promise<void>;
}

export const useBackendHealth = (intervalMs = 45000): UseBackendHealthResult => {
  const [status, setStatus] = useState<BackendConnectionStatus>('checking');
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isMountedRef = useRef<boolean>(true);

  const checkNow = useCallback(async () => {
    // If the browser itself is offline, report unavailable immediately without network attempt
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      if (isMountedRef.current) {
        setStatus('unavailable');
        setError('Browser is offline');
        setLastChecked(new Date());
      }
      return;
    }

    try {
      await checkBackendHealth(3500);
      if (isMountedRef.current) {
        setStatus('connected');
        setError(null);
      }
    } catch (err: any) {
      if (isMountedRef.current) {
        setStatus('unavailable');
        setError(err?.message || 'Backend server is unreachable');
      }
    } finally {
      if (isMountedRef.current) {
        setLastChecked(new Date());
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;

    // Run initial health check on component mount
    checkNow();

    // Periodic heartbeat check (every 45s, not aggressive)
    const intervalId = setInterval(() => {
      if (isMountedRef.current) {
        checkNow();
      }
    }, intervalMs);

    // Recheck immediately when browser regains network connectivity
    const handleOnline = () => {
      if (isMountedRef.current) {
        checkNow();
      }
    };

    const handleOffline = () => {
      if (isMountedRef.current) {
        setStatus('unavailable');
        setError('Browser is offline');
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup to prevent memory leaks and unmounted component warnings
    return () => {
      isMountedRef.current = false;
      clearInterval(intervalId);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [checkNow, intervalMs]);

  return { status, lastChecked, error, checkNow };
};
