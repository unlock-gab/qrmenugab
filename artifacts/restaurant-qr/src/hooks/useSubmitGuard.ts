"use client";

import { useState, useCallback, useRef } from "react";

interface SubmitGuardOptions {
  minDelayMs?: number;
  onError?: (err: unknown) => void;
}

/**
 * useSubmitGuard — prevents accidental double-submit on critical actions
 * (payment, status transitions, etc.).
 *
 * Usage:
 *   const { pending, guard } = useSubmitGuard();
 *   <button disabled={pending} onClick={guard(handlePay)}>Payer</button>
 */
export function useSubmitGuard(options: SubmitGuardOptions = {}) {
  const { minDelayMs = 800, onError } = options;
  const [pending, setPending] = useState(false);
  const lockRef = useRef(false);

  const guard = useCallback(
    <T>(fn: () => Promise<T>) =>
      async () => {
        if (lockRef.current) return;
        lockRef.current = true;
        setPending(true);
        const start = Date.now();
        try {
          const result = await fn();
          const elapsed = Date.now() - start;
          if (elapsed < minDelayMs) {
            await new Promise((r) => setTimeout(r, minDelayMs - elapsed));
          }
          return result;
        } catch (err) {
          onError?.(err);
          throw err;
        } finally {
          lockRef.current = false;
          setPending(false);
        }
      },
    [minDelayMs, onError]
  );

  return { pending, guard };
}
