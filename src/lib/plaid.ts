import { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode } from "plaid";

let plaidClient: PlaidApi | null = null;

export function getPlaidClient(): PlaidApi {
  if (plaidClient) return plaidClient;

  const clientId = process.env.PLAID_CLIENT_ID;
  const secret = process.env.PLAID_SECRET;
  const env = (process.env.PLAID_ENV ?? "sandbox") as keyof typeof PlaidEnvironments;

  if (!clientId || !secret) {
    throw new Error("PLAID_CLIENT_ID and PLAID_SECRET are required for bank sync");
  }

  if (!PlaidEnvironments[env]) {
    throw new Error(`Invalid PLAID_ENV "${env}". Use sandbox, development, or production.`);
  }

  const configuration = new Configuration({
    basePath: PlaidEnvironments[env],
    baseOptions: {
      headers: {
        "PLAID-CLIENT-ID": clientId,
        "PLAID-SECRET": secret,
      },
    },
  });

  plaidClient = new PlaidApi(configuration);
  return plaidClient;
}

export function isPlaidConfigured(): boolean {
  return Boolean(process.env.PLAID_CLIENT_ID?.trim() && process.env.PLAID_SECRET?.trim());
}

export async function createLinkToken(userId: string) {
  const client = getPlaidClient();

  const request: Parameters<PlaidApi["linkTokenCreate"]>[0] = {
    user: { client_user_id: userId },
    client_name: "Optimal Finances",
    products: [Products.Transactions],
    country_codes: [CountryCode.Us],
    language: "en",
    transactions: { days_requested: 90 },
  };

  if (process.env.PLAID_WEBHOOK_URL) {
    request.webhook = process.env.PLAID_WEBHOOK_URL;
  }
  if (process.env.PLAID_REDIRECT_URI) {
    request.redirect_uri = process.env.PLAID_REDIRECT_URI;
  }

  const response = await client.linkTokenCreate(request);
  return response.data.link_token;
}

export async function exchangePublicToken(publicToken: string) {
  const client = getPlaidClient();
  const response = await client.itemPublicTokenExchange({ public_token: publicToken });
  return {
    accessToken: response.data.access_token,
    itemId: response.data.item_id,
  };
}

export async function getInstitutionName(institutionId: string) {
  const client = getPlaidClient();
  const response = await client.institutionsGetById({
    institution_id: institutionId,
    country_codes: [CountryCode.Us],
  });
  return response.data.institution.name;
}

export async function fetchAccounts(accessToken: string) {
  const client = getPlaidClient();
  const response = await client.accountsGet({ access_token: accessToken });
  return response.data.accounts;
}

export async function fetchTransactions(accessToken: string, startDate: string, endDate: string) {
  const client = getPlaidClient();
  const response = await client.transactionsGet({
    access_token: accessToken,
    start_date: startDate,
    end_date: endDate,
    options: { count: 500, offset: 0 },
  });
  return response.data.transactions;
}

export function formatPlaidError(error: unknown): string {
  if (error && typeof error === "object" && "response" in error) {
    const data = (error as { response?: { data?: { error_message?: string } } }).response?.data;
    if (data?.error_message) return data.error_message;
  }
  if (error instanceof Error) return error.message;
  return "Plaid request failed";
}
