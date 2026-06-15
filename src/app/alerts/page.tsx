"use client";

import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell } from "lucide-react";

type Notification = {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
};

export default function AlertsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [checking, setChecking] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/alerts");
    const data = await res.json();
    setNotifications(data.notifications ?? []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function runCheck() {
    setChecking(true);
    await fetch("/api/alerts", { method: "POST" });
    await load();
    setChecking(false);
  }

  async function markRead() {
    const unread = notifications.filter((n) => !n.read).map((n) => n.id);
    if (unread.length === 0) return;
    await fetch("/api/alerts/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: unread }),
    });
    void load();
  }

  return (
    <AppShell>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-semibold text-white">TKOGON alerts</h2>
          <p className="mt-2 text-slate-400">
            Spending alerts when budgets are exceeded or large bank transactions occur.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => void runCheck()} disabled={checking}>
            {checking ? "Checking..." : "Run alert check"}
          </Button>
          <Button variant="ghost" onClick={() => void markRead()}>
            Mark all read
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {notifications.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-slate-400">
              No alerts yet. Set budget goals and link a bank to get TKOGON notifications.
            </CardContent>
          </Card>
        ) : (
          notifications.map((n) => (
            <Card key={n.id} className={n.read ? "opacity-60" : ""}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-emerald-400" />
                  <CardTitle className="text-base">{n.title}</CardTitle>
                </div>
                <p className="text-xs text-slate-500">{new Date(n.createdAt).toLocaleString()}</p>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-slate-300">{n.message}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </AppShell>
  );
}
