"use client";

import { useEffect, useState } from "react";

let started: Promise<void> | null = null;

async function startWorker() {
  if (typeof window === "undefined") return;
  if (process.env.NEXT_PUBLIC_DEMO_MODE !== "true") return;
  if (!started) {
    started = (async () => {
      const { worker } = await import("./browser");
      await worker.start({
        onUnhandledRequest: "bypass",
        serviceWorker: { url: "/mockServiceWorker.js" },
      });
    })();
  }
  await started;
}

export function MswBoot({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(
    process.env.NEXT_PUBLIC_DEMO_MODE !== "true",
  );

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_DEMO_MODE !== "true") return;
    let cancelled = false;
    startWorker().then(() => {
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) return null;
  return <>{children}</>;
}
