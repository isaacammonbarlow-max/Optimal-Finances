"use client";

import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { RecordActions, deleteRecord, patchRecord } from "@/components/ui/record-actions";
import { formatCurrency } from "@/lib/utils";

type Asset = { id: string; name: string; type: string; value: number; apr: number };

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", value: "", apr: "" });
  const [form, setForm] = useState({ name: "", value: "", apr: "" });

  const load = useCallback(async () => {
    const res = await fetch("/api/assets");
    setAssets(await res.json());
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/assets", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setForm({ name: "", value: "", apr: "" });
    void load();
  }

  return (
    <AppShell>
      <div className="mb-8">
        <h2 className="text-3xl font-semibold text-white">Assets</h2>
        <p className="mt-4 text-2xl font-semibold text-emerald-300">
          Total assets: {formatCurrency(assets.reduce((sum, a) => sum + a.value, 0))}
        </p>
      </div>

      <Card className="mb-8">
        <CardHeader><CardTitle>Add asset</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="grid gap-4 md:grid-cols-2">
            <Input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <Input placeholder="Value" type="number" step="0.01" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} required />
            <Input placeholder="APR %" type="number" step="0.01" value={form.apr} onChange={(e) => setForm({ ...form, apr: e.target.value })} />
            <Button type="submit">Add asset</Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {assets.map((asset) => (
          <Card key={asset.id}>
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                {editingId === asset.id ? (
                  <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                ) : (
                  <CardTitle>{asset.name}</CardTitle>
                )}
                <RecordActions
                  editing={editingId === asset.id}
                  onEdit={() => { setEditingId(asset.id); setEditForm({ name: asset.name, value: String(asset.value), apr: String(asset.apr) }); }}
                  onDelete={async () => { if (await deleteRecord("/api/assets", asset.id)) void load(); }}
                  onSave={async () => { await patchRecord("/api/assets", asset.id, editForm); setEditingId(null); void load(); }}
                  onCancel={() => setEditingId(null)}
                />
              </div>
              {editingId === asset.id ? (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Input type="number" step="0.01" value={editForm.value} onChange={(e) => setEditForm({ ...editForm, value: e.target.value })} />
                  <Input type="number" step="0.01" value={editForm.apr} onChange={(e) => setEditForm({ ...editForm, apr: e.target.value })} />
                </div>
              ) : (
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div><p className="text-slate-500">Value</p><p className="font-semibold text-white">{formatCurrency(asset.value)}</p></div>
                  <div><p className="text-slate-500">APR</p><p className="font-semibold text-white">{asset.apr}%</p></div>
                </div>
              )}
            </CardHeader>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
