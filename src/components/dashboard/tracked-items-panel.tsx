"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RecordActions, deleteRecord, patchRecord } from "@/components/ui/record-actions";
import { formatCurrency } from "@/lib/utils";

type TrackedSummary = {
  name: string;
  periods: Array<{ period: string; total: number }>;
};

type TrackedItem = {
  id: string;
  name: string;
};

type Props = {
  summaries: TrackedSummary[];
};

export function TrackedItemsPanel({ summaries }: Props) {
  const router = useRouter();
  const [items, setItems] = useState<TrackedItem[]>([]);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const loadItems = useCallback(async () => {
    const res = await fetch("/api/tracked-items");
    if (res.ok) setItems(await res.json());
  }, []);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/tracked-items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName }),
    });
    setNewName("");
    void loadItems();
    router.refresh();
  }

  async function saveEdit(id: string) {
    await patchRecord("/api/tracked-items", id, { name: editName });
    setEditingId(null);
    void loadItems();
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {summaries.length === 0 ? (
        <p className="text-sm text-slate-400">No tracked spending yet. Add items below to watch line-item totals.</p>
      ) : (
        summaries.map((item) => (
          <div key={item.name} className="rounded-xl bg-black/20 p-4">
            <p className="font-medium capitalize text-white">{item.name}</p>
            <div className="mt-2 grid grid-cols-4 gap-2 text-xs text-slate-400">
              {item.periods.map((p) => (
                <div key={p.period}>
                  <p className="uppercase">{p.period}</p>
                  <p className="text-sm font-semibold text-emerald-300">{formatCurrency(p.total)}</p>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      <form onSubmit={handleAdd} className="flex gap-2">
        <Input
          placeholder="Track a line item (e.g. chips)"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          required
        />
        <Button type="submit" size="sm">
          Add
        </Button>
      </form>

      {items.length > 0 && (
        <div className="space-y-2 border-t border-white/10 pt-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Manage watch list</p>
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-2 rounded-xl bg-black/20 px-3 py-2">
              {editingId === item.id ? (
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
              ) : (
                <span className="text-sm capitalize text-slate-200">{item.name}</span>
              )}
              <RecordActions
                editing={editingId === item.id}
                onEdit={() => {
                  setEditingId(item.id);
                  setEditName(item.name);
                }}
                onDelete={async () => {
                  if (await deleteRecord("/api/tracked-items", item.id)) {
                    void loadItems();
                    router.refresh();
                  }
                }}
                onSave={() => void saveEdit(item.id)}
                onCancel={() => setEditingId(null)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
