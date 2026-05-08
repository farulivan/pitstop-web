"use client";

import { QueryProvider } from "@/lib/query/provider";
import { WsProvider } from "@/lib/ws/provider";
import { MswBoot } from "@/mocks/msw-boot";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MswBoot>
      <QueryProvider>
        <WsProvider>{children}</WsProvider>
      </QueryProvider>
    </MswBoot>
  );
}
