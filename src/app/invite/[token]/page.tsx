"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const linkClass =
  "inline-flex h-10 flex-1 items-center justify-center rounded-xl text-sm font-medium transition-all";

export default function InvitePage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const { status } = useSession();
  const [invite, setInvite] = useState<{
    householdName: string;
    invitedBy: string;
    email: string | null;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    fetch(`/api/invite/${params.token}`)
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json()).error);
        return res.json();
      })
      .then(setInvite)
      .catch((e) => setError(e.message));
  }, [params.token]);

  async function acceptInvite() {
    setAccepting(true);
    try {
      const res = await fetch(`/api/invite/${params.token}/accept`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push("/household");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to accept");
    } finally {
      setAccepting(false);
    }
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Invite unavailable</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!invite) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-400">
        Loading invite...
      </div>
    );
  }

  const registerHref = `/register?email=${encodeURIComponent(invite.email ?? "")}&invite=${params.token}`;

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Join {invite.householdName}</CardTitle>
          <CardDescription>
            {invite.invitedBy} invited you to share finances on Optimal Finances. Each member can
            link their own bank securely.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === "authenticated" ? (
            <Button onClick={() => void acceptInvite()} disabled={accepting} className="w-full">
              {accepting ? "Joining..." : "Accept invite"}
            </Button>
          ) : (
            <>
              <p className="text-sm text-slate-400">
                Create an account or sign in to accept this invite.
              </p>
              <div className="flex gap-2">
                <Link
                  href={registerHref}
                  className={`${linkClass} bg-emerald-500 text-white hover:bg-emerald-400`}
                >
                  Create account
                </Link>
                <Link
                  href={`/login?callbackUrl=/invite/${params.token}`}
                  className={`${linkClass} border border-white/10 bg-white/10 text-white hover:bg-white/15`}
                >
                  Sign in
                </Link>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
