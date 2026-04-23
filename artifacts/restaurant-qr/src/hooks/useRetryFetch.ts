"use client";

import { useState, useCallback, useRef } from "react";

interface RetryOptions {
  maxRetries?: number;
  retryDelayMs?: number;
  onSuccess?: () => void;
  onError?: (err: Error) => void;
}

export function useRetryFetch<T>(
  fetcher: () => Promise<T>,
  { maxRetries = 3, retryDelayMs = 2000, onSuccess, onError }: RetryOptions = {}
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  const execute = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    setLoading(true);
    setError(null);
    let attempts = 0;

    while (attempts <= maxRetries) {
      try {
        const result = await fetcher();
        setData(result);
        setRetryCount(0);
        setError(null);
        onSuccess?.();
        setLoading(false);
        return result;
      } catch (err) {
        attempts++;
        setRetryCount(attempts);
        if (attempts > maxRetries) {
          const msg = err instanceof Error ? err.message : "Erreur réseau";
          setError(msg);
          onError?.(err instanceof Error ? err : new Error(msg));
          setLoading(false);
          return null;
        }
        await new Promise((res) => setTimeout(res, retryDelayMs * attempts));
      }
    }
    setLoading(false);
    return null;
  }, [fetcher, maxRetries, retryDelayMs, onSuccess, onError]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setRetryCount(0);
    setLoading(false);
  }, []);

  return { data, loading, error, retryCount, execute, reset };
}
