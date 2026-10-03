"use client";
import { useEffect, useState } from "react";
import { SheetContent } from "@/components/ui/sheet";

export function SwipeBottomSheet({ children, open, onDismiss }: { children: React.ReactNode; open: boolean; onDismiss: () => void }) {
  const [element, setElement] = useState<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!open || !element) return;
    let start: { x: number; y: number; time: number } | null = null;
    let distance = 0;
    let closing = false;
    let closeTimer: ReturnType<typeof setTimeout> | undefined;
    const reset = () => { start = null; distance = 0; element.style.transform = ""; element.style.transition = ""; };
    const begin = (event: TouchEvent) => {
      if (closing || event.touches.length !== 1 || element.scrollTop > 0) return;
      const target = event.target as HTMLElement;
      // Links and the X remain normal taps; drag the header, handle or blank space.
      if (target.closest("a,button,input,select,textarea")) return;
      start = { x: event.touches[0].clientX, y: event.touches[0].clientY, time: performance.now() };
      distance = 0;
    };
    const move = (event: TouchEvent) => {
      if (closing) return;
      if (!start || event.touches.length !== 1) { reset(); return; }
      const dy = event.touches[0].clientY - start.y;
      const dx = Math.abs(event.touches[0].clientX - start.x);
      if (dy < 0 || dx > Math.max(12, dy)) { reset(); return; }
      if (dy > 8) {
        if (event.cancelable) event.preventDefault();
        distance = dy;
        element.style.transition = "none";
        element.style.transform = `translateY(${dy}px)`;
      }
    };
    const end = () => {
      const elapsed = start ? performance.now() - start.time : Infinity;
      const dismiss = distance >= 80 || (distance >= 35 && elapsed < 250);
      if (!dismiss) { reset(); return; }
      closing = true;
      start = null;
      const duration = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 160;
      element.style.animation = "none";
      element.style.transition = `transform ${duration}ms ease-out`;
      element.style.transform = `translateY(${element.getBoundingClientRect().height + 32}px)`;
      closeTimer = setTimeout(onDismiss, duration);
    };
    element.addEventListener("touchstart", begin, { passive: true });
    element.addEventListener("touchmove", move, { passive: false });
    element.addEventListener("touchend", end);
    element.addEventListener("touchcancel", reset);
    return () => {
      element.removeEventListener("touchstart", begin); element.removeEventListener("touchmove", move);
      element.removeEventListener("touchend", end); element.removeEventListener("touchcancel", reset);
      if (closeTimer !== undefined) clearTimeout(closeTimer);
      if (!closing) reset();
    };
  }, [element, open, onDismiss]);
  return <SheetContent ref={setElement} side="bottom" className="max-h-[80dvh] overflow-y-auto overscroll-contain rounded-t-2xl pb-[calc(16px+env(safe-area-inset-bottom))]">
    <div aria-hidden="true" className="mx-auto mt-3 h-1 w-10 shrink-0 rounded-full bg-muted-foreground/30" />
    {children}
  </SheetContent>;
}
