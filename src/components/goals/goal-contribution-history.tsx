"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Edit, Trash2 } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { GoalContributionDialog } from "@/components/goals/goal-contribution-dialog";
import { getGoalContributions, deleteGoalContribution } from "@/lib/actions/goal-actions";
import { formatMoney } from "@/lib/currency";
import { statsDateLabel } from "@/lib/stats-date-range";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { localizedToast as toast } from "@/lib/i18n/client-messages";

type Entry = { id: string; amount: number; date: string; note?: string | null };
export function GoalContributionHistory({ goal, onClose, onChanged }: {
  goal: { id: string; name: string; currency?: string };
  onClose: () => void;
  onChanged: () => void;
}) {
  const { t } = useLanguage();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<Entry | null>(null);
  const busyRef = useRef(false);
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await getGoalContributions(goal.id);
      if (result.success && result.data) {
        setEntries(result.data.map(entry => ({ id: entry.id, amount: Number(entry.amount), date: new Date(entry.date).toISOString(), note: entry.note })));
      } else setError(result.error || "Failed to load contributions");
    } catch { setError("Failed to load contributions"); }
    finally { setLoading(false); }
  }, [goal.id]);
  useEffect(() => { void load(); }, [load]);

  async function remove(entry: Entry) {
    if (busyRef.current || !window.confirm(t("Delete this contribution? Goal progress will be reduced by this amount."))) return;
    busyRef.current = true;
    setBusy(true);
    setError("");
    try {
      const result = await deleteGoalContribution(entry.id);
      if (!result.success) { setError(result.error || "Could not save the contribution change. Please try again."); return; }
      toast.success("Contribution deleted successfully");
      onChanged();
      await load();
    } catch { setError("Could not save the contribution change. Please try again."); }
    finally { busyRef.current = false; setBusy(false); }
  }

  if (editing) return <GoalContributionDialog goal={goal} contribution={editing}
    onClose={() => setEditing(null)} onSuccess={() => { setEditing(null); onChanged(); void load(); }} />;

  return <Dialog open onOpenChange={open => { if (!open && !busyRef.current) onClose(); }}>
    <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
      <DialogHeader><DialogTitle>{t("Contribution history")} · {goal.name}</DialogTitle>
        <DialogDescription>{t("Edit or delete a recorded contribution. Account balances stay unchanged.")}</DialogDescription>
      </DialogHeader>
      {error && <p role="alert" className="text-sm text-destructive">{t(error)}</p>}
      {loading ? <p role="status" className="text-sm text-muted-foreground">{t("Loading contributions...")}</p>
        : !entries.length ? <p className="text-sm text-muted-foreground">{t("No contributions recorded.")}</p>
        : <ul className="space-y-2">{entries.map(entry => <li key={entry.id} className="rounded-xl border bg-card p-3">
          <div className="flex flex-wrap items-center justify-between gap-2"><span className="text-sm text-muted-foreground">{t(statsDateLabel(entry.date))}</span>
            <span className="font-semibold tabular-nums">{formatMoney(entry.amount, goal.currency || "USD")}</span></div>
          {entry.note && <p className="mt-1 break-words text-sm text-muted-foreground">{entry.note}</p>}
          <div className="mt-2 flex justify-end gap-2"><Button type="button" variant="outline" size="sm" className="min-h-11" disabled={busy} onClick={() => setEditing(entry)}><Edit className="mr-2 h-4 w-4"/>{t("Edit")}</Button>
            <Button type="button" variant="outline" size="sm" className="min-h-11 text-destructive" disabled={busy} onClick={() => { void remove(entry); }}><Trash2 className="mr-2 h-4 w-4"/>{t("Delete")}</Button></div>
        </li>)}</ul>}
      <Button type="button" variant="outline" className="min-h-11" disabled={busy} onClick={onClose}>{t("Close")}</Button>
    </DialogContent>
  </Dialog>;
}
