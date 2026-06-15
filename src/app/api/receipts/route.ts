import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/auth-helpers";
import { matchCategory } from "@/lib/tkogon/category-matcher";
import { scanReceiptImage } from "@/lib/tkogon/scanner";
import { runSpendingAlerts } from "@/lib/alerts";
import { storeUploadedFile } from "@/lib/storage";

export async function GET() {
  return withAuth(async (ctx) => {
    const receipts = await prisma.receipt.findMany({
      where: { householdId: ctx.householdId },
      include: { category: true, lineItems: true, user: { select: { name: true, email: true } } },
      orderBy: { purchaseDate: "desc" },
    });
    return NextResponse.json(receipts);
  });
}

export async function POST(request: NextRequest) {
  return withAuth(async (ctx) => {
    try {
      const formData = await request.formData();
      const file = formData.get("file");

      if (!(file instanceof File)) {
        return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const base64 = buffer.toString("base64");
      const mimeType = file.type || "image/jpeg";

      const stored = await storeUploadedFile({
        buffer,
        mimeType,
        originalName: file.name,
        folder: "receipts",
        userId: ctx.userId,
      });

      const scanned = await scanReceiptImage(base64, mimeType);
      const categories = await prisma.category.findMany({
        where: { householdId: ctx.householdId },
      });
      const matchedCategory = matchCategory(
        categories,
        scanned.merchantName,
        scanned.merchantAddress
      );

      const purchaseDate = scanned.purchaseDate
        ? new Date(scanned.purchaseDate)
        : new Date();

      const receipt = await prisma.receipt.create({
        data: {
          householdId: ctx.householdId,
          userId: ctx.userId,
          imagePath: stored.key,
          merchantName: scanned.merchantName,
          merchantAddress: scanned.merchantAddress,
          purchaseDate,
          subtotal: scanned.subtotal,
          tax: scanned.tax,
          totalAmount: scanned.totalAmount,
          paymentMethod: scanned.paymentMethod,
          rawScanData: JSON.stringify(scanned),
          scanStatus: "PROCESSED",
          categoryId: matchedCategory?.id,
          notes: scanned.notes,
          lineItems: {
            create: scanned.lineItems.map((item) => ({
              name: item.name,
              amount: item.amount,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              subcategory: item.subcategory,
            })),
          },
          transaction: {
            create: {
              householdId: ctx.householdId,
              userId: ctx.userId,
              categoryId: matchedCategory?.id,
              amount: scanned.totalAmount,
              description: scanned.merchantName ?? "Receipt purchase",
              date: purchaseDate,
              type: "EXPENSE",
              source: "RECEIPT",
            },
          },
        },
        include: { category: true, lineItems: true },
      });

      void runSpendingAlerts(ctx).catch(console.error);

      return NextResponse.json({
        receipt,
        message: matchedCategory
          ? `TKOGON categorized this as ${matchedCategory.name} with ${receipt.lineItems.length} line items.`
          : `TKOGON extracted ${receipt.lineItems.length} line items.`,
      });
    } catch (error) {
      console.error(error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Receipt scan failed" },
        { status: 500 }
      );
    }
  });
}
