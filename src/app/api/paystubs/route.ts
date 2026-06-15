import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/auth-helpers";
import { scanPaystubImage } from "@/lib/tkogon/scanner";
import { storeUploadedFile } from "@/lib/storage";

export async function GET() {
  return withAuth(async (ctx) => {
    const paystubs = await prisma.paystub.findMany({
      where: { householdId: ctx.householdId },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { payDate: "desc" },
    });
    return NextResponse.json(paystubs);
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
        folder: "paystubs",
        userId: ctx.userId,
      });

      const scanned = await scanPaystubImage(base64, mimeType);
      const paystub = await prisma.paystub.create({
        data: {
          householdId: ctx.householdId,
          userId: ctx.userId,
          imagePath: stored.key,
          employerName: scanned.employerName,
          payDate: new Date(scanned.payDate),
          periodStart: scanned.periodStart ? new Date(scanned.periodStart) : null,
          periodEnd: scanned.periodEnd ? new Date(scanned.periodEnd) : null,
          grossPay: scanned.grossPay,
          netPay: scanned.netPay,
          federalTax: scanned.federalTax,
          stateTax: scanned.stateTax,
          deductions: JSON.stringify(scanned.deductions),
          rawScanData: JSON.stringify(scanned),
          scanStatus: "PROCESSED",
        },
      });

      return NextResponse.json({
        paystub,
        message: `TKOGON recorded pay — net $${scanned.netPay.toFixed(2)}.`,
      });
    } catch (error) {
      console.error(error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Paystub scan failed" },
        { status: 500 }
      );
    }
  });
}
