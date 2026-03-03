"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Video,
  CreditCard,
  Settings,
  Zap,
  ChevronRight,
  BarChart3,
} from "lucide-react";
import { useWorkspace } from "@/contexts/workspace-context";
import { Badge } from "@/components/ui/badge";
import type { Plan } from "@/lib/types";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Videos", icon: Video, exact: true },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

function PlanBadge({ plan }: { plan: Plan }) {
  const variantMap: Record<Plan, "free" | "indie" | "pro"> = {
    FREE: "free",
    INDIE: "indie",
    PRO: "pro",
  };
  return (
    <Badge variant={variantMap[plan]} className="uppercase text-[10px] tracking-wider">
      {plan}
    </Badge>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { workspace } = useWorkspace();

  return (
    <aside className="flex flex-col w-60 border-r border-slate-700 bg-slate-900/50 shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-4 border-b border-slate-700">
        <div className="w-8 h-8 rounded-lg bg-sky-500 flex items-center justify-center">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <span className="font-bold text-white text-base tracking-tight">
          VideoKit
        </span>
      </div>

      {/* Workspace info */}
      {workspace && (
        <div className="px-4 py-3 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {workspace.name}
              </p>
              <p className="text-xs text-slate-500 truncate">
                {workspace.slug}.videokit.io
              </p>
            </div>
            <PlanBadge plan={workspace.plan} />
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-0.5">
        {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all group",
                active
                  ? "bg-sky-500/20 text-sky-400"
                  : "text-slate-400 hover:bg-slate-700/50 hover:text-slate-200"
              )}
            >
              <Icon
                className={cn(
                  "w-4 h-4 shrink-0",
                  active ? "text-sky-400" : "text-slate-500 group-hover:text-slate-300"
                )}
              />
              <span className="flex-1">{label}</span>
              {active && (
                <ChevronRight className="w-3 h-3 text-sky-400/60" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Upgrade CTA for free plan */}
      {workspace?.plan === "FREE" && (
        <div className="mx-3 mb-4 p-3 rounded-lg bg-sky-500/10 border border-sky-500/20">
          <p className="text-xs font-semibold text-sky-400">Upgrade to Indie</p>
          <p className="text-xs text-slate-400 mt-1">
            Unlock CTA overlays, email gates & analytics.
          </p>
          <Link href="/dashboard/billing">
            <button className="mt-2 w-full py-1.5 text-xs font-semibold rounded-md bg-sky-500 text-white hover:bg-sky-600 transition-colors">
              Upgrade — $9/mo
            </button>
          </Link>
        </div>
      )}
    </aside>
  );
}
