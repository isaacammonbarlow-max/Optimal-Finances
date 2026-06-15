"use client";

import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { RecordActions, deleteRecord, patchRecord } from "@/components/ui/record-actions";

type Category = {
  id: string;
  name: string;
  description: string | null;
  color: string;
  merchantMatchers: string[];
  addressMatchers: string[];
  isPinned: boolean;
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", merchantMatchers: "", addressMatchers: "" });
  const [name, setName] = useState("");
  const [merchantMatchers, setMerchantMatchers] = useState("");
  const [addressMatchers, setAddressMatchers] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/categories");
    setCategories(await res.json());
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        merchantMatchers: merchantMatchers.split(",").map((s) => s.trim()).filter(Boolean),
        addressMatchers: addressMatchers.split(",").map((s) => s.trim()).filter(Boolean),
        isPinned: true,
      }),
    });
    setName("");
    setMerchantMatchers("");
    setAddressMatchers("");
    void load();
  }

  function startEdit(category: Category) {
    setEditingId(category.id);
    setEditForm({
      name: category.name,
      merchantMatchers: category.merchantMatchers.join(", "),
      addressMatchers: category.addressMatchers.join(", "),
    });
  }

  async function saveEdit(id: string) {
    await patchRecord("/api/categories", id, {
      name: editForm.name,
      merchantMatchers: editForm.merchantMatchers.split(",").map((s) => s.trim()).filter(Boolean),
      addressMatchers: editForm.addressMatchers.split(",").map((s) => s.trim()).filter(Boolean),
    });
    setEditingId(null);
    void load();
  }

  return (
    <AppShell>
      <div className="mb-8">
        <h2 className="text-3xl font-semibold text-white">Categories</h2>
        <p className="mt-2 text-slate-400">
          Create, edit, or delete custom categories. TKOGON matches receipts by merchant and address.
        </p>
      </div>

      <Card className="mb-8">
        <CardHeader><CardTitle>Add category</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="grid gap-4 md:grid-cols-2">
            <Input placeholder="Category name" value={name} onChange={(e) => setName(e.target.value)} required />
            <Input placeholder="Merchant matchers (comma-separated)" value={merchantMatchers} onChange={(e) => setMerchantMatchers(e.target.value)} />
            <Input placeholder="Address matchers (comma-separated)" value={addressMatchers} onChange={(e) => setAddressMatchers(e.target.value)} />
            <Button type="submit">Create category</Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {categories.map((category) => (
          <Card key={category.id}>
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="h-4 w-4 rounded-full" style={{ backgroundColor: category.color }} />
                  {editingId === category.id ? (
                    <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                  ) : (
                    <CardTitle>{category.name}</CardTitle>
                  )}
                </div>
                <RecordActions
                  editing={editingId === category.id}
                  onEdit={() => startEdit(category)}
                  onDelete={async () => {
                    if (await deleteRecord("/api/categories", category.id)) void load();
                  }}
                  onSave={() => void saveEdit(category.id)}
                  onCancel={() => setEditingId(null)}
                />
              </div>
            </CardHeader>
            <CardContent className="text-sm text-slate-400">
              {editingId === category.id ? (
                <div className="space-y-2">
                  <Input value={editForm.merchantMatchers} onChange={(e) => setEditForm({ ...editForm, merchantMatchers: e.target.value })} placeholder="Merchants" />
                  <Input value={editForm.addressMatchers} onChange={(e) => setEditForm({ ...editForm, addressMatchers: e.target.value })} placeholder="Addresses" />
                </div>
              ) : (
                <>
                  <p><span className="text-slate-500">Merchants:</span> {category.merchantMatchers.join(", ") || "—"}</p>
                  <p className="mt-1"><span className="text-slate-500">Addresses:</span> {category.addressMatchers.join(", ") || "—"}</p>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
