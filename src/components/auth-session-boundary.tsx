"use client";

import { I18nText } from "@/components/language-provider";
import { useAuth } from "@clerk/nextjs";
import { createContext, useContext, useEffect, useRef } from "react";

const OwnerContext = createContext(false);
export function useLegacyOwner() { return useContext(OwnerContext); }

export function AuthSessionBoundary({ children, legacyOwner }: { children: React.ReactNode; legacyOwner: boolean }) {
  const { isLoaded, userId } = useAuth();
  const previous = useRef<string | null | undefined>(undefined);
  const changed = isLoaded && previous.current !== undefined && previous.current !== (userId ?? null);
  useEffect(() => {
    if (!isLoaded) return;
    if (previous.current !== undefined && previous.current !== (userId ?? null)) {
      // Full navigation discards prefetched server components and client financial
      // state before a different identity can use the same browser session.
      window.location.replace(userId ? "/" : "/sign-in");
      return;
    }
    previous.current = userId ?? null;
  }, [isLoaded, userId]);
  useEffect(() => {
    function restore(event: PageTransitionEvent) { if (event.persisted) window.location.reload(); }
    window.addEventListener("pageshow", restore);
    return () => window.removeEventListener("pageshow", restore);
  }, []);
  if (!isLoaded || changed) return <div className="p-6 text-sm text-muted-foreground">{""}<I18nText text={"Loading PocketPilot…"}/>{""}</div>;
  return <OwnerContext.Provider value={legacyOwner}><div key={userId ?? "signed-out"}>{children}</div></OwnerContext.Provider>;
}
