"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import { localizedToast as toast } from "@/lib/i18n/client-messages";

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
  const [savedDefault, setSavedDefault] = useState<string | null>(null);
  useEffect(() => {
    function readDefault() {
      try {
        const saved = preferenceKey ? localStorage.getItem(`${CURRENCY_KEY}:${preferenceKey}`) : null;
        setSavedDefault(saved === "USD" || saved === "CAD" ? saved : null);
      } catch { setSavedDefault(null); }
    }
    readDefault();
    window.addEventListener("storage", readDefault);
    return () => window.removeEventListener("storage", readDefault);
  }, [preferenceKey]);
  const isDefault = savedDefault === value;
  const defaultLabel = isDefault ? `${value} is the default currency for this tab` : `Set ${value} as default currency for this tab`;

  function saveDefault() {
    try {
      if (!preferenceKey) return;
      localStorage.setItem(`${CURRENCY_KEY}:${preferenceKey}`, value);
      setSavedDefault(value);
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
      {remember && preferenceKey && <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={saveDefault} aria-label={defaultLabel} aria-pressed={isDefault} title={defaultLabel} className={`${compact ? "h-9 w-9 px-0" : ""} ${isDefault ? "border-teal-500/30 bg-teal-500/10 text-teal-700 hover:bg-teal-500/20 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-400" : ""}`}>{compact ? <Star aria-hidden="true" className="h-4 w-4" fill={isDefault ? "currentColor" : "none"} /> : isDefault ? "Default currency" : "Set as default"}</Button>}
    </div>
  );
}
