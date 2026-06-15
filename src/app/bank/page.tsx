"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePlaidLink } from "react-plaid-link";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { deleteRecord } from "@/components/ui/record-actions";
import { RefreshCw, Shield } from "lucide-react";

type Connection = {
  id: string;
  institutionName: string | null;
  status: string;
  lastSyncedAt: string | null;
  accounts: Array<{
    id: string;
    name: string;
    mask: string | null;
    type: string;
    currentBalance: number | null;
    _count: { transactions: number };
  }>;
};

export default function BankPage() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [pendingOpen, setPendingOpen] = useState(false);
  const [plaidConfigured, setPlaidConfigured] = useState<boolean | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [linking, setLinking] = useState(false);
  const openTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const waitingForPlaidRef = useRef(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/bank/connections");
    if (res.ok) setConnections(await res.json());
  }, []);

  const checkPlaidConfig = useCallback(async () => {
    const res = await fetch("/api/bank/link-token");
    const data = await res.json();
    setPlaidConfigured(data.configured ?? res.ok);
    if (!res.ok && data.error) setMessage(data.error);
  }, []);

  useEffect(() => {
    void load();
    void checkPlaidConfig();
  }, [load, checkPlaidConfig]);

  useEffect(() => {
    return () => {
      if (openTimeoutRef.current) clearTimeout(openTimeoutRef.current);
    };
  }, []);

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: async (publicToken, metadata) => {
      setLinking(true);
      try {
        const res = await fetch("/api/bank/exchange", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            publicToken,
            institutionId: metadata.institution?.institution_id,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to link bank");
        setMessage("Bank linked. TKOGON is syncing transactions.");
        void load();
      } catch (err) {
        setMessage(err instanceof Error ? err.message : "Failed to link bank");
      } finally {
        setLinking(false);
        setLinkToken(null);
        setPendingOpen(false);
      }
    },
    onExit: (err) => {
      setPendingOpen(false);
      setLinkToken(null);
      setLinking(false);
      waitingForPlaidRef.current = false;
      if (openTimeoutRef.current) clearTimeout(openTimeoutRef.current);
      if (err) {
        setMessage(err.display_message || err.error_message || "Plaid Link was closed.");
      }
    },
  });

  useEffect(() => {
    if (!pendingOpen || !ready || !linkToken) return;

    open();
    setPendingOpen(false);
    setLinking(false);
    waitingForPlaidRef.current = false;

    if (openTimeoutRef.current) clearTimeout(openTimeoutRef.current);
  }, [pendingOpen, ready, linkToken, open]);

  async function startPlaidLink() {
    setMessage(null);
    setLinking(true);
    setLinkToken(null);
    setPendingOpen(false);
    waitingForPlaidRef.current = true;

    if (openTimeoutRef.current) clearTimeout(openTimeoutRef.current);
    openTimeoutRef.current = setTimeout(() => {
      if (waitingForPlaidRef.current) {
        setLinking(false);
        setPendingOpen(false);
        waitingForPlaidRef.current = false;
        setMessage("Plaid Link did not open. Check your keys and restart the dev server.");
      }
    }, 15000);

    try {
      const res = await fetch("/api/bank/link-token");
      const data = await res.json();
      setPlaidConfigured(data.configured ?? res.ok);

      if (!res.ok) {
        throw new Error(data.error ?? "Could not start Plaid Link");
      }

      setLinkToken(data.linkToken);
      setPendingOpen(true);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not start Plaid Link");
      setLinking(false);
      setPendingOpen(false);
      if (openTimeoutRef.current) clearTimeout(openTimeoutRef.current);
    }
  }

  async function syncAll() {
    setSyncing(true);
    const res = await fetch("/api/bank/connections", { method: "POST" });
    const data = await res.json();
    setMessage(res.ok ? `Synced ${data.synced ?? 0} connection(s).` : data.error);
    void load();
    setSyncing(false);
  }

  async function removeConnection(id: string) {
    try {
      const ok = await deleteRecord("/api/bank/connections", id);
      if (ok) void load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Delete failed");
    }
  }

  return (
    <AppShell>
      <div className="mb-8">
        <h2 className="text-3xl font-semibold text-white">Bank sync</h2>
        <p className="mt-2 max-w-2xl text-slate-400">
          Connect via Plaid sandbox for testing. Use credentials{" "}
          <strong className="text-white">user_good</strong> /{" "}
          <strong className="text-white">pass_good</strong> when prompted.
        </p>
      </div>

      {plaidConfigured === false && (
        <Card className="mb-6 border-amber-500/30 bg-amber-500/10">
          <CardHeader>
            <CardTitle className="text-amber-200">Plaid setup required</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-300">
            <p>1. Create a free account at dashboard.plaid.com</p>
            <p>2. Copy your Sandbox keys into `.env`:</p>
            <pre className="rounded-lg bg-black/30 p-3 text-xs text-emerald-300">
              PLAID_CLIENT_ID=&quot;your_client_id&quot;{"\n"}
              PLAID_SECRET=&quot;your_sandbox_secret&quot;{"\n"}
              PLAID_ENV=&quot;sandbox&quot;
            </pre>
            <p>3. Restart the app: `npm run dev`</p>
          </CardContent>
        </Card>
      )}

      <Card className="mb-6 border-emerald-500/20 bg-emerald-500/5">
        <CardContent className="flex items-start gap-3 pt-5">
          <Shield className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
          <div className="text-sm text-slate-300">
            <p className="font-medium text-white">Secure connection</p>
            <p className="mt-1">
              Plaid handles bank credentials. Access tokens are encrypted server-side.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="mb-8 flex gap-3">
        <Button onClick={() => void startPlaidLink()} disabled={linking || plaidConfigured === false}>
          {linking ? "Opening Plaid..." : "Link a bank account"}
        </Button>
        <Button variant="secondary" onClick={() => void syncAll()} disabled={syncing}>
          <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
          Sync transactions
        </Button>
      </div>

      {message && <p className="mb-6 text-sm text-slate-300">{message}</p>}

      <div className="space-y-4">
        {connections.map((conn) => (
          <Card key={conn.id}>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle>{conn.institutionName ?? "Linked bank"}</CardTitle>
                  <p className="text-sm text-slate-400">
                    {conn.lastSyncedAt
                      ? `Last synced ${new Date(conn.lastSyncedAt).toLocaleString()}`
                      : "Not synced yet"}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => void removeConnection(conn.id)}
                >
                  Disconnect
                </Button>
              </div>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {conn.accounts.map((acct) => (
                <div key={acct.id} className="rounded-xl bg-black/20 p-3 text-sm">
                  <p className="font-medium text-white">
                    {acct.name} {acct.mask ? `••${acct.mask}` : ""}
                  </p>
                  <p className="text-slate-400 capitalize">{acct.type}</p>
                  <p className="mt-1 text-emerald-300">
                    {acct.currentBalance != null ? formatCurrency(acct.currentBalance) : "—"}
                  </p>
                  <p className="text-xs text-slate-500">{acct._count.transactions} transactions</p>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
