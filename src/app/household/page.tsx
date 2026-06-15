"use client";

import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Copy, Users } from "lucide-react";

type Member = {
  role: string;
  user: { name: string | null; email: string };
};

export default function HouseholdPage() {
  const [household, setHousehold] = useState<{ name: string } | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<string>("MEMBER");

  const load = useCallback(async () => {
    const res = await fetch("/api/household");
    const data = await res.json();
    setHousehold(data.household);
    setMembers(data.members ?? []);
    setRole(data.role);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function sendInvite(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/household", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email || undefined }),
    });
    const data = await res.json();
    if (data.inviteUrl) setInviteUrl(data.inviteUrl);
    setEmail("");
  }

  return (
    <AppShell>
      <div className="mb-8">
        <h2 className="text-3xl font-semibold text-white">Household</h2>
        <p className="mt-2 text-slate-400">
          Share finances with family. Each member signs in separately and can link their own bank.
        </p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-emerald-400" />
            <CardTitle>{household?.name ?? "Your household"}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {members.map((m, i) => (
            <div key={i} className="flex items-center justify-between rounded-xl bg-black/20 px-4 py-3 text-sm">
              <div>
                <p className="font-medium text-white">{m.user.name ?? m.user.email}</p>
                <p className="text-slate-400">{m.user.email}</p>
              </div>
              <span className="rounded-lg bg-white/10 px-2 py-1 text-xs text-slate-300">{m.role}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {(role === "OWNER" || role === "ADMIN") && (
        <Card>
          <CardHeader>
            <CardTitle>Invite family member</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={sendInvite} className="flex gap-3">
              <Input
                type="email"
                placeholder="Email (optional — link works for anyone)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Button type="submit">Generate invite link</Button>
            </form>
            {inviteUrl && (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-black/20 p-3 text-sm">
                <code className="flex-1 break-all text-emerald-300">{inviteUrl}</code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigator.clipboard.writeText(inviteUrl)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </AppShell>
  );
}
