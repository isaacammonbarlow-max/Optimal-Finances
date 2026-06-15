"use client";

import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { RecordActions, deleteRecord, patchRecord } from "@/components/ui/record-actions";
import { formatCurrency } from "@/lib/utils";

type Debt = {
  id: string;
  name: string;
  type: string;
  balance: number;
  apr: number;
  minimumPayment: number | null;
};

export default function DebtsPage() {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", balance: "", apr: "", minimumPayment: "" });
  const [form, setForm] = useState({ name: "", balance: "", apr: "", minimumPayment: "" });

  const load = useCallback(async () => {
    const res = await fetch("/api/debts");
    setDebts(await res.json());
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/debts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setForm({ name: "", balance: "", apr: "", minimumPayment: "" });
    void load();
  }

  function startEdit(debt: Debt) {
    setEditingId(debt.id);
    setEditForm({
      name: debt.name,
      balance: String(debt.balance),
      apr: String(debt.apr),
      minimumPayment: debt.minimumPayment != null ? String(debt.minimumPayment) : "",
    });
  }

  async function saveEdit(id: string) {
    await patchRecord("/api/debts", id, editForm);
    setEditingId(null);
    void load();
  }

  return (
    <AppShell>
      <div className="mb-8">
        <h2 className="text-3xl font-semibold text-white">Debts</h2>
        <p className="mt-4 text-2xl font-semibold text-rose-300">
          Total debt: {formatCurrency(debts.reduce((sum, d) => sum + d.balance, 0))}
        </p>
      </div>

      <Card className="mb-8">
        <CardHeader><CardTitle>Add debt</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="grid gap-4 md:grid-cols-2">
            <Input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <Input placeholder="Balance" type="number" step="0.01" value={form.balance} onChange={(e) => setForm({ ...form, balance: e.target.value })} required />
            <Input placeholder="APR %" type="number" step="0.01" value={form.apr} onChange={(e) => setForm({ ...form, apr: e.target.value })} required />
            <Input placeholder="Min payment" type="number" step="0.01" value={form.minimumPayment} onChange={(e) => setForm({ ...form, minimumPayment: e.target.value })} />
            <Button type="submit">Add debt</Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {debts.map((debt) => (
          <Card key={debt.id}>
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                {editingId === debt.id ? (
                  <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                ) : (
                  <CardTitle>{debt.name}</CardTitle>
                )}
                <RecordActions
                  editing={editingId === debt.id}
                  onEdit={() => startEdit(debt)}
                  onDelete={async () => { if (await deleteRecord("/api/debts", debt.id)) void load(); }}
                  onSave={() => void saveEdit(debt.id)}
                  onCancel={() => setEditingId(null)}
                />
              </div>
              {editingId === debt.id ? (
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <Input type="number" step="0.01" value={editForm.balance} onChange={(e) => setEditForm({ ...editForm, balance: e.target.value })} />
                  <Input type="number" step="0.01" value={editForm.apr} onChange={(e) => setEditForm({ ...editForm, apr: e.target.value })} />
                  <Input type="number" step="0.01" value={editForm.minimumPayment} onChange={(e) => setEditForm({ ...editForm, minimumPayment: e.target.value })} />
                </div>
              ) : (
                <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                  <div><p className="text-slate-500">Balance</p><p className="font-semibold text-white">{formatCurrency(debt.balance)}</p></div>
                  <div><p className="text-slate-500">APR</p><p className="font-semibold text-white">{debt.apr}%</p></div>
                  <div><p className="text-slate-500">Min</p><p className="font-semibold text-white">{debt.minimumPayment ? formatCurrency(debt.minimumPayment) : "—"}</p></div>
                </div>
              )}
            </CardHeader>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
