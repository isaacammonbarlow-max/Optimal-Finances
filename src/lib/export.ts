import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { Asset, Category, Debt, Paystub, Receipt } from "@prisma/client";

type ReceiptWithRelations = Receipt & {
  category: Category | null;
  lineItems: Array<{ name: string; amount: number; subcategory: string | null }>;
};

export function buildFinanceCsv(data: {
  receipts: ReceiptWithRelations[];
  paystubs: Paystub[];
  debts: Debt[];
  assets: Asset[];
}): string {
  const lines: string[] = [];

  lines.push("RECEIPTS");
  lines.push("Date,Merchant,Category,Total,Line Items");
  for (const r of data.receipts) {
    const items = r.lineItems
      .map((li) => `${li.name} ($${li.amount.toFixed(2)})`)
      .join("; ");
    lines.push(
      [
        r.purchaseDate.toISOString().slice(0, 10),
        r.merchantName ?? "",
        r.category?.name ?? "Uncategorized",
        r.totalAmount.toFixed(2),
        `"${items}"`,
      ].join(",")
    );
  }

  lines.push("");
  lines.push("PAYSTUBS");
  lines.push("Pay Date,Employer,Gross,Net");
  for (const p of data.paystubs) {
    lines.push(
      [
        p.payDate.toISOString().slice(0, 10),
        p.employerName ?? "",
        p.grossPay.toFixed(2),
        p.netPay.toFixed(2),
      ].join(",")
    );
  }

  lines.push("");
  lines.push("DEBTS");
  lines.push("Name,Balance,APR,Min Payment");
  for (const d of data.debts) {
    lines.push(
      [d.name, d.balance.toFixed(2), d.apr.toFixed(2), (d.minimumPayment ?? 0).toFixed(2)].join(",")
    );
  }

  lines.push("");
  lines.push("ASSETS");
  lines.push("Name,Value,APR");
  for (const a of data.assets) {
    lines.push([a.name, a.value.toFixed(2), a.apr.toFixed(2)].join(","));
  }

  return lines.join("\n");
}

export function buildFinancePdf(data: {
  receipts: ReceiptWithRelations[];
  paystubs: Paystub[];
  debts: Debt[];
  assets: Asset[];
  netWorth: number;
}): Uint8Array {
  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text("Optimal Finances — Finance Report", 14, 20);
  doc.setFontSize(11);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);
  doc.text(`Net Worth: $${data.netWorth.toFixed(2)}`, 14, 36);

  autoTable(doc, {
    startY: 44,
    head: [["Recent Receipts", "Date", "Total"]],
    body: data.receipts.slice(0, 10).map((r) => [
      r.merchantName ?? "Unknown",
      r.purchaseDate.toISOString().slice(0, 10),
      `$${r.totalAmount.toFixed(2)}`,
    ]),
  });

  const afterReceipts = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable
    .finalY;

  autoTable(doc, {
    startY: afterReceipts + 10,
    head: [["Debts", "Balance", "APR"]],
    body: data.debts.map((d) => [d.name, `$${d.balance.toFixed(2)}`, `${d.apr}%`]),
  });

  const afterDebts = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;

  autoTable(doc, {
    startY: afterDebts + 10,
    head: [["Assets", "Value", "APR/Yield"]],
    body: data.assets.map((a) => [a.name, `$${a.value.toFixed(2)}`, `${a.apr}%`]),
  });

  return new Uint8Array(doc.output("arraybuffer"));
}

export function buildGoogleSheetsUrl(csvContent: string): string {
  const encoded = encodeURIComponent(csvContent);
  return `https://docs.google.com/spreadsheets/create?title=Optimal%20Finances%20Export&csv=${encoded}`;
}
