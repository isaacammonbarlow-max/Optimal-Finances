"use client";

import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { RecordActions, deleteRecord, patchRecord } from "@/components/ui/record-actions";
import { formatCurrency } from "@/lib/utils";

type Budget = {
  id: string;
  name: string;
  amount: number;
  period: string;
  lineItem: string | null;
  category: { name: string } | null;
};

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", amount: "", period: "MONTHLY", lineItem: "" });
  const [form, setForm] = useState({ name: "", amount: "", period: "MONTHLY", lineItem: "" });

  const load = useCallback(async () => {
    const res = await fetch("/api/budgets");
    setBudgets(await res.json());
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/budgets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm({ name: "", amount: "", period: "MONTHLY", lineItem: "" });
    void load();
  }

  function startEdit(budget: Budget) {
    setEditingId(budget.id);
    setEditForm({
      name: budget.name,
      amount: String(budget.amount),
      period: budget.period,
      lineItem: budget.lineItem ?? "",
    });
  }

  async function saveEdit(id: string) {
    await patchRecord("/api/budgets", id, editForm);
    setEditingId(null);
    void load();
  }

  return (
    <AppShell>
      <div className="mb-8">
        <h2 className="text-3xl font-semibold text-white">Budget goals</h2>
        <p className="mt-2 text-slate-400">
          Set spending limits. Edit or delete any budget after submission.
        </p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>New budget goal</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="grid gap-4 md:grid-cols-2">
            <Input
              placeholder="Name (e.g. Chips spending)"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <Input
              placeholder="Limit amount"
              type="number"
              step="0.01"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              required
            />
            <Input
              placeholder="Line item to track (optional, e.g. chips)"
              value={form.lineItem}
              onChange={(e) => setForm({ ...form, lineItem: e.target.value })}
            />
            <select
              className="h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white"
              value={form.period}
              onChange={(e) => setForm({ ...form, period: e.target.value })}
            >
              <option value="WEEKLY">Weekly</option>
              <option value="MONTHLY">Monthly</option>
              <option value="YEARLY">Yearly</option>
            </select>
            <Button type="submit">Create budget</Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {budgets.map((b) => (
          <Card key={b.id}>
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  {editingId === b.id ? (
                    <div className="grid gap-2">
                      <Input
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      />
                      <Input
                        type="number"
                        step="0.01"
                        value={editForm.amount}
                        onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                      />
                      <Input
                        placeholder="Line item"
                        value={editForm.lineItem}
                        onChange={(e) => setEditForm({ ...editForm, lineItem: e.target.value })}
                      />
                      <select
                        className="h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white"
                        value={editForm.period}
                        onChange={(e) => setEditForm({ ...editForm, period: e.target.value })}
                      >
                        <option value="WEEKLY">Weekly</option>
                        <option value="MONTHLY">Monthly</option>
                        <option value="YEARLY">Yearly</option>
                      </select>
                    </div>
                  ) : (
                    <>
                      <CardTitle>{b.name}</CardTitle>
                      <p className="text-2xl font-semibold text-emerald-300">{formatCurrency(b.amount)}</p>
                      <p className="text-sm text-slate-400">
                        {b.period.toLowerCase()}
                        {b.lineItem ? ` · tracking "${b.lineItem}"` : ""}
                        {b.category ? ` · ${b.category.name}` : ""}
                      </p>
                    </>
                  )}
                </div>
                <RecordActions
                  editing={editingId === b.id}
                  onEdit={() => startEdit(b)}
                  onDelete={async () => {
                    if (await deleteRecord("/api/budgets", b.id)) void load();
                  }}
                  onSave={() => void saveEdit(b.id)}
                  onCancel={() => setEditingId(null)}
                />
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
