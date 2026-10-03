"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import { toast } from "sonner";

const CURRENCY_KEY = "pocketpilot-default-currency";

export function usePreferredCurrency(section: string) {
  const [currency, setCurrency] = useState("USD");
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`${CURRENCY_KEY}:${section}`);
      if (saved === "USD" || saved === "CAD") setCurrency(saved);
    } catch { /* Storage may be unavailable in private browsers. */ }
  }, [section]);
  return [currency, setCurrency] as const;
}

export function CurrencyPicker({ value, onChange, disabled = false, remember = false, preferenceKey, compact = false }: { value: string; onChange: (value: string) => void; disabled?: boolean; remember?: boolean; preferenceKey?: string; compact?: boolean }) {
  function saveDefault() {
    try {
      if (!preferenceKey) return;
      localStorage.setItem(`${CURRENCY_KEY}:${preferenceKey}`, value);
      toast.success(`${value} is now your default currency for this tab`);
    } catch {
      toast.error("Your browser could not save the currency preference");
    }
  }
  return (
    <div className="pp-currency-picker flex flex-wrap items-center gap-2">
      <label className="flex min-w-0 items-center gap-2 text-sm">
        <span className={compact ? "sr-only" : undefined}>Currency</span>
        <select disabled={disabled} aria-label="Currency" className="min-w-0 max-w-full rounded-md border bg-background p-2 disabled:opacity-50" value={value} onChange={event => onChange(event.target.value)}>
          <option value="USD">{compact ? "USD" : "USD — US Dollar"}</option>
          <option value="CAD">{compact ? "CAD" : "CAD — Canadian Dollar"}</option>
        </select>
      </label>
      {remember && preferenceKey && <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={saveDefault} aria-label={`Set ${value} as default currency for this tab`} title={`Set ${value} as default`} className={compact ? "h-9 w-9 px-0" : undefined}>{compact ? <Star aria-hidden="true" className="h-4 w-4" /> : "Set as default"}</Button>}
    </div>
  );
}
