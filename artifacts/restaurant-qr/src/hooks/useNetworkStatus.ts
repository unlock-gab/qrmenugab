"use client";

import { useState, useEffect, useCallback } from "react";

export type NetworkState = "online" | "offline" | "slow" | "reconnecting";

interface UseNetworkStatusOptions {
  pingUrl?: string;
  pingIntervalMs?: number;
}

export function useNetworkStatus({
  pingUrl = "/api/health",
  pingIntervalMs = 15000,
}: UseNetworkStatusOptions = {}) {
  const [state, setState] = useState<NetworkState>("online");
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkConnectivity = useCallback(async () => {
    if (!navigator.onLine) {
      setState("offline");
      return;
    }
    try {
      const start = Date.now();
      const res = await fetch(pingUrl, {
        method: "GET",
        cache: "no-store",
        signal: AbortSignal.timeout(5000),
      });
      const latency = Date.now() - start;
      setLastChecked(new Date());
      if (!res.ok) {
        setState("slow");
      } else if (latency > 3000) {
        setState("slow");
      } else {
        setState("online");
      }
    } catch {
      setState(navigator.onLine ? "slow" : "offline");
    }
  }, [pingUrl]);

  useEffect(() => {
    const handleOnline = () => { setState("reconnecting"); checkConnectivity(); };
    const handleOffline = () => setState("offline");
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [checkConnectivity]);

  useEffect(() => {
    checkConnectivity();
    const interval = setInterval(checkConnectivity, pingIntervalMs);
    return () => clearInterval(interval);
  }, [checkConnectivity, pingIntervalMs]);

  return { state, lastChecked, isOnline: state === "online", isOffline: state === "offline" };
}
