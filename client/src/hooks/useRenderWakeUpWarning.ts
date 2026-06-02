import { useRef, useEffect, useCallback } from 'react';

export function useRenderWakeUpWarning(addToast: (message: string, type: 'info' | 'success' | 'error') => void) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startWarningTimer = useCallback(() => {
    // Clear any existing timer before starting a new one
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    
    timerRef.current = setTimeout(() => {
      addToast(
        "Server is waking up. This may take up to a minute on the free hosting plan.",
        "info"
      );
    }, 5000);
  }, [addToast]);

  const clearWarningTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Cleanup active timers when component unmounts
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return { startWarningTimer, clearWarningTimer };
}
