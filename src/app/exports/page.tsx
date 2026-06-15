"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ExportsPage() {
  const [sheetsUrl, setSheetsUrl] = useState<string | null>(null);

  async function openGoogleSheets() {
    const res = await fetch("/api/exports?format=sheets");
    const data = await res.json();
    setSheetsUrl(data.url);
    window.open(data.url, "_blank");
  }

  return (
    <AppShell>
      <div className="mb-8">
        <h2 className="text-3xl font-semibold text-white">Export</h2>
        <p className="mt-2 text-slate-400">
          Download your full financial picture as CSV, PDF, or open in Google Sheets.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>CSV</CardTitle>
            <CardDescription>Spreadsheet-friendly export of all data</CardDescription>
          </CardHeader>
          <CardContent>
            <a
              href="/api/exports?format=csv"
              download
              className="inline-flex h-10 items-center justify-center rounded-xl border border-white/10 bg-white/10 px-4 text-sm font-medium text-white transition-colors hover:bg-white/15"
            >
              Download CSV
            </a>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>PDF report</CardTitle>
            <CardDescription>Summary report with receipts, debts, and assets</CardDescription>
          </CardHeader>
          <CardContent>
            <a
              href="/api/exports?format=pdf"
              download
              className="inline-flex h-10 items-center justify-center rounded-xl border border-white/10 bg-white/10 px-4 text-sm font-medium text-white transition-colors hover:bg-white/15"
            >
              Download PDF
            </a>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Google Sheets</CardTitle>
            <CardDescription>Opens a new sheet with your finance data</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="secondary" onClick={() => void openGoogleSheets()}>
              Open in Google Sheets
            </Button>
            {sheetsUrl && (
              <p className="mt-3 text-xs text-slate-500 break-all">{sheetsUrl}</p>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
