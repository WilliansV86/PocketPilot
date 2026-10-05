"use client";

import { useRef, useState } from "react";
import { useLanguage } from "@/components/language-provider";
import { addGoalContribution, updateGoalContribution } from "@/lib/actions/goal-actions";
import { formatMoney } from "@/lib/currency";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { localizedToast as toast } from "@/lib/i18n/client-messages";

function todayInAlberta() {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Edmonton", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const part = (type: string) => parts.find(item => item.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function GoalContributionDialog({ goal, contribution, onClose, onSuccess }: {
  goal: { id: string; name: string; currency?: string };
  contribution?: { id: string; amount: number; date: string; note?: string | null };
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { t } = useLanguage();
  const [amount, setAmount] = useState(contribution ? String(contribution.amount) : "");
  const [date, setDate] = useState(() => contribution ? contribution.date.slice(0, 10) : todayInAlberta());
  const [note, setNote] = useState(contribution?.note || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const savingRef = useRef(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (savingRef.current) return;
    const value = Number(amount);
    if (!amount.trim() || !Number.isFinite(value) || value <= 0) {
      setError("Enter a positive amount with up to two decimal places.");
      return;
    }
    savingRef.current = true;
    setSaving(true);
    setError("");
    try {
      const data = new FormData();
      data.set("amount", amount);
      data.set("date", date);
      data.set("note", note);
      const result = contribution
        ? await updateGoalContribution(contribution.id, data)
        : await addGoalContribution(goal.id, data);
      if (!result.success) { setError(result.error || "Failed to add contribution"); return; }
      toast.success(contribution ? "Contribution updated successfully" : "Contribution added successfully");
      onSuccess();
    } catch {
      setError("Failed to add contribution");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  return <Dialog open onOpenChange={open => { if (!open && !savingRef.current) onClose(); }}>
    <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md" onEscapeKeyDown={event => { if (saving) event.preventDefault(); }}>
      <DialogHeader>
        <DialogTitle>{t(contribution ? "Edit contribution" : "Add contribution")} · {goal.name}</DialogTitle>
        <DialogDescription>{t("This records progress toward your goal. It does not move money or change account balances.")}</DialogDescription>
      </DialogHeader>
      <form className="space-y-4" onSubmit={submit}>
        <div className="space-y-2"><Label htmlFor="goal-contribution-amount">{t("Contribution amount")} ({goal.currency || "USD"})</Label>
          <Input id="goal-contribution-amount" type="number" inputMode="decimal" min="0.01" step="0.01" required placeholder="0.00" value={amount} disabled={saving} onChange={event => setAmount(event.target.value)} />
          {Number(amount) > 0 && <p className="text-xs text-muted-foreground">{formatMoney(Number(amount), goal.currency || "USD")}</p>}
        </div>
        <div className="space-y-2"><Label htmlFor="goal-contribution-date">{t("Contribution date")}</Label>
          <Input id="goal-contribution-date" type="date" value={date} required disabled={saving} onChange={event => setDate(event.target.value)} />
        </div>
        <div className="space-y-2"><Label htmlFor="goal-contribution-note">{t("Note (Optional)")}</Label>
          <Textarea id="goal-contribution-note" value={note} disabled={saving} onChange={event => setNote(event.target.value)} />
        </div>
        {error && <p role="alert" className="text-sm text-destructive">{t(error)}</p>}
        <div className="flex justify-end gap-2"><Button type="button" variant="outline" disabled={saving} onClick={onClose}>{t("Cancel")}</Button>
          <Button type="submit" disabled={saving}>{t(saving ? "Saving..." : contribution ? "Save changes" : "Record contribution")}</Button>
        </div>
      </form>
    </DialogContent>
  </Dialog>;
}
