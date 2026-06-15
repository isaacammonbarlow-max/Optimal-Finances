"use client";

import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { UploadZone } from "@/components/upload/upload-zone";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { RecordActions, deleteRecord, patchRecord } from "@/components/ui/record-actions";
import { formatCurrency } from "@/lib/utils";

type Category = { id: string; name: string; color: string };

type Receipt = {
  id: string;
  merchantName: string | null;
  merchantAddress: string | null;
  purchaseDate: string;
  totalAmount: number;
  categoryId: string | null;
  category: { name: string; color: string } | null;
  lineItems: Array<{ name: string; amount: number; subcategory: string | null }>;
};

export default function ReceiptsPage() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    merchantName: "",
    merchantAddress: "",
    purchaseDate: "",
    totalAmount: "",
    categoryId: "",
  });

  const load = useCallback(async () => {
    const [receiptsRes, categoriesRes] = await Promise.all([
      fetch("/api/receipts"),
      fetch("/api/categories"),
    ]);
    setReceipts(await receiptsRes.json());
    setCategories(await categoriesRes.json());
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function startEdit(receipt: Receipt) {
    setEditingId(receipt.id);
    setEditForm({
      merchantName: receipt.merchantName ?? "",
      merchantAddress: receipt.merchantAddress ?? "",
      purchaseDate: receipt.purchaseDate.slice(0, 10),
      totalAmount: String(receipt.totalAmount),
      categoryId: receipt.categoryId ?? "",
    });
  }

  async function saveEdit(id: string) {
    await patchRecord("/api/receipts", id, {
      merchantName: editForm.merchantName || null,
      merchantAddress: editForm.merchantAddress || null,
      purchaseDate: editForm.purchaseDate,
      totalAmount: editForm.totalAmount,
      categoryId: editForm.categoryId || null,
    });
    setEditingId(null);
    void load();
  }

  return (
    <AppShell>
      <div className="mb-8">
        <h2 className="text-3xl font-semibold text-white">Receipts</h2>
        <p className="mt-2 text-slate-400">
          Upload receipts for TKOGON to scan. Edit or delete any receipt after submission.
        </p>
      </div>

      <UploadZone
        endpoint="/api/receipts"
        label="Drop a receipt image — TKOGON extracts merchant, date, total, and every line item."
        onSuccess={load}
      />

      <div className="mt-8 space-y-4">
        {receipts.map((receipt) => (
          <Card key={receipt.id}>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  {editingId === receipt.id ? (
                    <div className="grid gap-2 sm:grid-cols-2">
                      <Input
                        placeholder="Merchant"
                        value={editForm.merchantName}
                        onChange={(e) => setEditForm({ ...editForm, merchantName: e.target.value })}
                      />
                      <Input
                        type="date"
                        value={editForm.purchaseDate}
                        onChange={(e) => setEditForm({ ...editForm, purchaseDate: e.target.value })}
                      />
                      <Input
                        placeholder="Address"
                        value={editForm.merchantAddress}
                        onChange={(e) => setEditForm({ ...editForm, merchantAddress: e.target.value })}
                      />
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Total"
                        value={editForm.totalAmount}
                        onChange={(e) => setEditForm({ ...editForm, totalAmount: e.target.value })}
                      />
                      <select
                        className="h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white sm:col-span-2"
                        value={editForm.categoryId}
                        onChange={(e) => setEditForm({ ...editForm, categoryId: e.target.value })}
                      >
                        <option value="">Uncategorized</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <>
                      <CardTitle>{receipt.merchantName ?? "Unknown merchant"}</CardTitle>
                      <p className="mt-1 text-sm text-slate-400">
                        {new Date(receipt.purchaseDate).toLocaleDateString()}
                        {receipt.merchantAddress ? ` · ${receipt.merchantAddress}` : ""}
                      </p>
                    </>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <RecordActions
                    editing={editingId === receipt.id}
                    onEdit={() => startEdit(receipt)}
                    onDelete={async () => {
                      if (await deleteRecord("/api/receipts", receipt.id)) void load();
                    }}
                    onSave={() => void saveEdit(receipt.id)}
                    onCancel={() => setEditingId(null)}
                  />
                  {editingId !== receipt.id && (
                    <>
                      <p className="text-lg font-semibold text-emerald-300">
                        {formatCurrency(receipt.totalAmount)}
                      </p>
                      <p className="text-sm text-slate-400">
                        {receipt.category?.name ?? "Uncategorized"}
                      </p>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>
            {receipt.lineItems.length > 0 && editingId !== receipt.id && (
              <CardContent>
                <p className="mb-2 text-xs uppercase tracking-wide text-slate-500">Line items</p>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {receipt.lineItems.map((item, idx) => (
                    <div key={idx} className="rounded-xl bg-black/20 px-3 py-2 text-sm">
                      <p className="text-white">{item.name}</p>
                      <p className="text-slate-400">
                        {formatCurrency(item.amount)}
                        {item.subcategory ? ` · ${item.subcategory}` : ""}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
