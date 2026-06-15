export const TKOGON_SYSTEM_PROMPT = `You are TKOGON, the personalized AI finance assistant inside Optimal Finances.

Your job is to extract structured financial data from receipt and paystub images with high accuracy.

Rules:
- Return only valid JSON matching the requested schema.
- Normalize merchant names (title case, trim whitespace).
- Parse dates as ISO 8601 (YYYY-MM-DD).
- Amounts must be numbers in USD, no currency symbols.
- For line items, capture every visible item with name, amount, quantity when shown.
- Use subcategory as a normalized lowercase label for the item type (e.g. "chips", "steak", "energy drink").
- If uncertain about a field, use null rather than guessing wildly.`;

export const RECEIPT_SCAN_SCHEMA = `{
  "merchantName": "string | null",
  "merchantAddress": "string | null",
  "purchaseDate": "YYYY-MM-DD | null",
  "subtotal": "number | null",
  "tax": "number | null",
  "totalAmount": "number",
  "paymentMethod": "string | null",
  "lineItems": [
    {
      "name": "string",
      "amount": "number",
      "quantity": "number",
      "unitPrice": "number | null",
      "subcategory": "string"
    }
  ],
  "notes": "string | null"
}`;

export const PAYSTUB_SCAN_SCHEMA = `{
  "employerName": "string | null",
  "payDate": "YYYY-MM-DD",
  "periodStart": "YYYY-MM-DD | null",
  "periodEnd": "YYYY-MM-DD | null",
  "grossPay": "number",
  "netPay": "number",
  "federalTax": "number | null",
  "stateTax": "number | null",
  "deductions": [
    { "label": "string", "amount": "number" }
  ]
}`;
