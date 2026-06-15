"use client";

import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { UploadZone } from "@/components/upload/upload-zone";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { RecordActions, deleteRecord, patchRecord } from "@/components/ui/record-actions";
import { formatCurrency } from "@/lib/utils";

type Paystub = {
  id: string;
  employerName: string | null;
  payDate: string;
  grossPay: number;
  netPay: number;
  federalTax: number | null;
  stateTax: number | null;
};

export default function PaystubsPage() {
  const [paystubs, setPaystubs] = useState<Paystub[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    employerName: "",
    payDate: "",
    grossPay: "",
    netPay: "",
    federalTax: "",
    stateTax: "",
  });

  const load = useCallback(async () => {
    const res = await fetch("/api/paystubs");
    setPaystubs(await res.json());
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function startEdit(paystub: Paystub) {
    setEditingId(paystub.id);
    setEditForm({
      employerName: paystub.employerName ?? "",
      payDate: paystub.payDate.slice(0, 10),
      grossPay: String(paystub.grossPay),
      netPay: String(paystub.netPay),
      federalTax: paystub.federalTax != null ? String(paystub.federalTax) : "",
      stateTax: paystub.stateTax != null ? String(paystub.stateTax) : "",
    });
  }

  async function saveEdit(id: string) {
    await patchRecord("/api/paystubs", id, {
      employerName: editForm.employerName || null,
      payDate: editForm.payDate,
      grossPay: editForm.grossPay,
      netPay: editForm.netPay,
      federalTax: editForm.federalTax || null,
      stateTax: editForm.stateTax || null,
    });
    setEditingId(null);
    void load();
  }

  return (
    <AppShell>
      <div className="mb-8">
        <h2 className="text-3xl font-semibold text-white">Paystubs</h2>
        <p className="mt-2 text-slate-400">
          Upload paystubs for TKOGON to extract income data. Edit or delete any entry after submission.
        </p>
      </div>

      <UploadZone
        endpoint="/api/paystubs"
        label="Upload a paystub image for TKOGON to extract gross pay, net pay, and deductions."
        onSuccess={load}
      />

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {paystubs.map((paystub) => (
          <Card key={paystub.id}>
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  {editingId === paystub.id ? (
                    <div className="grid gap-2">
                      <Input
                        placeholder="Employer"
                        value={editForm.employerName}
                        onChange={(e) => setEditForm({ ...editForm, employerName: e.target.value })}
                      />
                      <Input
                        type="date"
                        value={editForm.payDate}
                        onChange={(e) => setEditForm({ ...editForm, payDate: e.target.value })}
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Gross"
                          value={editForm.grossPay}
                          onChange={(e) => setEditForm({ ...editForm, grossPay: e.target.value })}
                        />
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Net"
                          value={editForm.netPay}
                          onChange={(e) => setEditForm({ ...editForm, netPay: e.target.value })}
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <CardTitle>{paystub.employerName ?? "Employer"}</CardTitle>
                      <p className="text-sm text-slate-400">
                        Paid {new Date(paystub.payDate).toLocaleDateString()}
                      </p>
                    </>
                  )}
                </div>
                <RecordActions
                  editing={editingId === paystub.id}
                  onEdit={() => startEdit(paystub)}
                  onDelete={async () => {
                    if (await deleteRecord("/api/paystubs", paystub.id)) void load();
                  }}
                  onSave={() => void saveEdit(paystub.id)}
                  onCancel={() => setEditingId(null)}
                />
              </div>
              {editingId !== paystub.id && (
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-slate-500">Gross</p>
                    <p className="font-semibold text-white">{formatCurrency(paystub.grossPay)}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Net</p>
                    <p className="font-semibold text-emerald-300">{formatCurrency(paystub.netPay)}</p>
                  </div>
                </div>
              )}
            </CardHeader>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
