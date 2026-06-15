import OpenAI from "openai";
import {
  PAYSTUB_SCAN_SCHEMA,
  RECEIPT_SCAN_SCHEMA,
  TKOGON_SYSTEM_PROMPT,
} from "@/lib/tkogon/prompts";

function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({ apiKey });
}

export type ScannedReceipt = {
  merchantName: string | null;
  merchantAddress: string | null;
  purchaseDate: string | null;
  subtotal: number | null;
  tax: number | null;
  totalAmount: number;
  paymentMethod: string | null;
  lineItems: Array<{
    name: string;
    amount: number;
    quantity: number;
    unitPrice: number | null;
    subcategory: string;
  }>;
  notes: string | null;
};

export type ScannedPaystub = {
  employerName: string | null;
  payDate: string;
  periodStart: string | null;
  periodEnd: string | null;
  grossPay: number;
  netPay: number;
  federalTax: number | null;
  stateTax: number | null;
  deductions: Array<{ label: string; amount: number }>;
};

function parseJsonResponse<T>(content: string): T {
  const cleaned = content.replace(/```json\n?|\n?```/g, "").trim();
  return JSON.parse(cleaned) as T;
}

export async function scanReceiptImage(
  base64Image: string,
  mimeType: string
): Promise<ScannedReceipt> {
  if (!process.env.OPENAI_API_KEY) {
    return mockReceiptScan();
  }

  const openai = getOpenAI();
  if (!openai) return mockReceiptScan();

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: TKOGON_SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Scan this receipt and return JSON matching this schema:\n${RECEIPT_SCAN_SCHEMA}`,
          },
          {
            type: "image_url",
            image_url: {
              url: `data:${mimeType};base64,${base64Image}`,
            },
          },
        ],
      },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("TKOGON returned an empty receipt scan");

  return parseJsonResponse<ScannedReceipt>(content);
}

export async function scanPaystubImage(
  base64Image: string,
  mimeType: string
): Promise<ScannedPaystub> {
  if (!process.env.OPENAI_API_KEY) {
    return mockPaystubScan();
  }

  const openai = getOpenAI();
  if (!openai) return mockPaystubScan();

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: TKOGON_SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Scan this paystub and return JSON matching this schema:\n${PAYSTUB_SCAN_SCHEMA}`,
          },
          {
            type: "image_url",
            image_url: {
              url: `data:${mimeType};base64,${base64Image}`,
            },
          },
        ],
      },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("TKOGON returned an empty paystub scan");

  return parseJsonResponse<ScannedPaystub>(content);
}

export async function askTkogon(
  question: string,
  context: Record<string, unknown>
): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    return `TKOGON demo mode: Based on your data, ${question.toLowerCase()} — connect OPENAI_API_KEY for live insights.`;
  }

  const openai = getOpenAI();
  if (!openai) {
    return `TKOGON demo mode: Based on your data, ${question.toLowerCase()} — connect OPENAI_API_KEY for live insights.`;
  }

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.4,
    messages: [
      {
        role: "system",
        content: `${TKOGON_SYSTEM_PROMPT}\n\nYou help the user understand their personalized finances. Be concise, actionable, and reference their actual spending data when provided.`,
      },
      {
        role: "user",
        content: `User question: ${question}\n\nFinancial context:\n${JSON.stringify(context, null, 2)}`,
      },
    ],
  });

  return response.choices[0]?.message?.content ?? "TKOGON could not generate a response.";
}

function mockReceiptScan(): ScannedReceipt {
  const today = new Date().toISOString().slice(0, 10);
  return {
    merchantName: "Bees Marketplace",
    merchantAddress: "123 Market St, Local City",
    purchaseDate: today,
    subtotal: 17.04,
    tax: 0,
    totalAmount: 17.04,
    paymentMethod: "Debit",
    lineItems: [
      { name: "Chips", amount: 4.25, quantity: 1, unitPrice: 4.25, subcategory: "chips" },
      { name: "Steak", amount: 10.34, quantity: 1, unitPrice: 10.34, subcategory: "steak" },
      {
        name: "Energy Drink",
        amount: 2.45,
        quantity: 1,
        unitPrice: 2.45,
        subcategory: "energy drink",
      },
    ],
    notes: "Demo scan — add OPENAI_API_KEY for real receipt OCR",
  };
}

function mockPaystubScan(): ScannedPaystub {
  const today = new Date().toISOString().slice(0, 10);
  return {
    employerName: "Demo Employer",
    payDate: today,
    periodStart: today,
    periodEnd: today,
    grossPay: 3200,
    netPay: 2450,
    federalTax: 450,
    stateTax: 180,
    deductions: [{ label: "Health Insurance", amount: 120 }],
  };
}
