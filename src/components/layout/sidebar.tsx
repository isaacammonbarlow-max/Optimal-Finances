"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  Bell,
  Bot,
  CreditCard,
  Download,
  Landmark,
  LayoutDashboard,
  LogOut,
  PiggyBank,
  Receipt,
  Tags,
  Target,
  Users,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/receipts", label: "Receipts", icon: Receipt },
  { href: "/categories", label: "Categories", icon: Tags },
  { href: "/bank", label: "Bank sync", icon: Landmark },
  { href: "/budgets", label: "Budgets", icon: Target },
  { href: "/alerts", label: "Alerts", icon: Bell },
  { href: "/paystubs", label: "Paystubs", icon: Wallet },
  { href: "/debts", label: "Debts", icon: CreditCard },
  { href: "/assets", label: "Assets", icon: PiggyBank },
  { href: "/household", label: "Household", icon: Users },
  { href: "/exports", label: "Export", icon: Download },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-white/10 bg-slate-950/80 p-4">
      <div className="mb-8 px-2">
        <p className="text-xs uppercase tracking-[0.2em] text-emerald-400">Optimal Finances</p>
        <h1 className="mt-1 text-xl font-semibold text-white">Your money, optimized</h1>
        {session?.user?.email && (
          <p className="mt-2 truncate text-xs text-slate-500">{session.user.email}</p>
        )}
      </div>

      <nav className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                active
                  ? "bg-emerald-500/15 text-emerald-300"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-3">
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
          <div className="flex items-center gap-2 text-emerald-300">
            <Bot className="h-4 w-4" />
            <span className="text-sm font-semibold">TKOGON</span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-slate-300">
            Alerts, receipt scanning, and personalized spending insights.
          </p>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </Button>
      </div>
    </aside>
  );
}
