"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [loading, setLoading] = useState<"reset" | "delete" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setLoading("reset");
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, confirmPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Reset failed");
      setMessage(data.message);
      setTimeout(() => router.push("/login"), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reset failed");
    } finally {
      setLoading(null);
    }
  }

  async function handleDelete(e: React.FormEvent) {
    e.preventDefault();
    setLoading("delete");
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/auth/delete-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password: deletePassword || undefined,
          confirm: deleteConfirm,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Delete failed");
      setMessage(data.message);
      setTimeout(() => router.push("/register"), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10">
      <div className="w-full max-w-md space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Set or reset password</CardTitle>
            <CardDescription>
              Use this if you have an older account without a password, or want a new password.
              Enter your email and choose a new password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleReset} className="space-y-4">
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
              <Input
                type="password"
                placeholder="New password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
              />
              <Input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
              />
              <Button type="submit" className="w-full" disabled={loading !== null}>
                {loading === "reset" ? "Saving..." : "Set new password"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border-rose-500/20">
          <CardHeader>
            <CardTitle className="text-rose-300">Delete account</CardTitle>
            <CardDescription>
              Permanently remove your account so you can register again with the same email. All
              your data will be deleted. Legacy accounts without a password only need email
              confirmation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleDelete} className="space-y-4">
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input
                type="password"
                placeholder="Current password (if you set one)"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                autoComplete="current-password"
              />
              <Input
                type="text"
                placeholder='Type DELETE to confirm'
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                required
              />
              <Button
                type="submit"
                variant="danger"
                className="w-full"
                disabled={loading !== null}
              >
                {loading === "delete" ? "Deleting..." : "Delete my account"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {message && <p className="text-center text-sm text-emerald-300">{message}</p>}
        {error && <p className="text-center text-sm text-rose-400">{error}</p>}

        <p className="text-center text-sm text-slate-400">
          <Link href="/login" className="text-emerald-400 hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
