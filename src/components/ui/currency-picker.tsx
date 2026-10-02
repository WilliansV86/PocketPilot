"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
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

export function CurrencyPicker({ value, onChange, disabled = false, remember = false, preferenceKey }: { value: string; onChange: (value: string) => void; disabled?: boolean; remember?: boolean; preferenceKey?: string }) {
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
    <div className="flex flex-wrap items-center gap-2">
      <label className="flex items-center gap-2 text-sm">
        Currency
        <select disabled={disabled} aria-label="Currency" className="rounded-md border bg-background p-2 disabled:opacity-50" value={value} onChange={event => onChange(event.target.value)}>
          <option value="USD">USD — US Dollar</option>
          <option value="CAD">CAD — Canadian Dollar</option>
        </select>
      </label>
      {remember && preferenceKey && <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={saveDefault}>Set as default</Button>}
    </div>
  );
}
