"use client";

import { useAuth } from "@clerk/nextjs";
import { useLegacyOwner } from "@/components/auth-session-boundary";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const CURRENCY_KEY = "pocketpilot-default-currency";

export function usePreferredCurrency(section: string) {
  const { userId } = useAuth();
  const legacyOwner = useLegacyOwner();
  const [currency, setCurrency] = useState("USD");
  useEffect(() => {
    setCurrency("USD");
    if (!userId) return;
    try {
      const key = `${CURRENCY_KEY}:${userId}:${section}`;
      let saved = localStorage.getItem(key);
      if (!saved && legacyOwner) {
        const legacy = localStorage.getItem(`${CURRENCY_KEY}:${section}`);
        if (legacy === "USD" || legacy === "CAD") {
          saved = legacy;
          localStorage.setItem(key, legacy);
        }
      }
      if (saved === "USD" || saved === "CAD") setCurrency(saved);
    } catch { /* Storage may be unavailable in private browsers. */ }
  }, [section, userId, legacyOwner]);
  return [currency, setCurrency] as const;
}

export function CurrencyPicker({ value, onChange, disabled = false, remember = false, preferenceKey }: { value: string; onChange: (value: string) => void; disabled?: boolean; remember?: boolean; preferenceKey?: string }) {
  const { userId } = useAuth();
  function saveDefault() {
    try {
      if (!preferenceKey || !userId) return;
      localStorage.setItem(`${CURRENCY_KEY}:${userId}:${preferenceKey}`, value);
      toast.success(`${value} is now your default currency for this tab`);
    } catch {
      toast.error("Your browser could not save the currency preference");
    }
  }
  return (
    <div className="pp-currency-picker flex flex-wrap items-center gap-2">
      <label className="flex min-w-0 items-center gap-2 text-sm">
        Currency
        <select disabled={disabled} aria-label="Currency" className="min-w-0 max-w-full rounded-md border bg-background p-2 disabled:opacity-50" value={value} onChange={event => onChange(event.target.value)}>
          <option value="USD">USD — US Dollar</option>
          <option value="CAD">CAD — Canadian Dollar</option>
        </select>
      </label>
      {remember && preferenceKey && <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={saveDefault}>Set as default</Button>}
    </div>
  );
}
