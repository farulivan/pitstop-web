"use client";

import { createContext, useContext, useMemo } from "react";

type Handler = (payload: unknown) => void;

type WsContextValue = {
  subscribe: (topic: string, handler: Handler) => () => void;
};

const WsContext = createContext<WsContextValue | null>(null);

export function WsProvider({ children }: { children: React.ReactNode }) {
  const value = useMemo<WsContextValue>(
    () => ({
      subscribe: () => {
        return () => undefined;
      },
    }),
    [],
  );

  return <WsContext.Provider value={value}>{children}</WsContext.Provider>;
}

export function useWs(): WsContextValue {
  const ctx = useContext(WsContext);
  if (!ctx) throw new Error("useWs must be used within <WsProvider>");
  return ctx;
}
