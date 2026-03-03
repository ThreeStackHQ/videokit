"use client";

import { useState } from "react";
import { Check, Zap, CreditCard, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useWorkspace } from "@/contexts/workspace-context";

const PLANS = [
  {
    id: "FREE",
    name: "Free",
    price: 0,
    badge: "free" as const,
    description: "Perfect for experimenting",
    features: [
      "3 hosted videos",
      "100 plays/month",
      "720p quality",
      "VideoKit watermark",
    ],
    missing: ["CTA overlays", "Email gates", "Analytics", "Custom domain"],
    cta: "Current plan",
    disabled: true,
  },
  {
    id: "INDIE",
    name: "Indie",
    price: 9,
    badge: "indie" as const,
    description: "For indie makers & solo founders",
    features: [
      "Unlimited videos",
      "10,000 plays/month",
      "1080p quality",
      "No watermark",
      "CTA overlays",
      "Email gates",
      "Analytics dashboard",
    ],
    missing: ["Priority support", "Custom domain"],
    cta: "Upgrade to Indie",
    disabled: false,
    popular: true,
  },
  {
    id: "PRO",
    name: "Pro",
    price: 29,
    badge: "pro" as const,
    description: "For growing SaaS teams",
    features: [
      "Everything in Indie",
      "100,000 plays/month",
      "4K quality",
      "Custom domain (CNAME)",
      "Priority support",
      "API access",
      "Webhook integrations",
      "Team seats (3)",
    ],
    missing: [],
    cta: "Upgrade to Pro",
    disabled: false,
  },
];

export default function BillingPage() {
  const { workspace } = useWorkspace();
  const [loading, setLoading] = useState<string | null>(null);

  const handleUpgrade = async (planId: string) => {
    setLoading(planId);
    // TODO: POST /api/v1/billing/checkout — redirect to Stripe checkout
    await new Promise<void>((r) => setTimeout(r, 1000));
    alert(`[mock] Redirect to Stripe for ${planId} plan`);
    setLoading(null);
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Billing & Plans</h1>
        <p className="text-sm text-slate-400 mt-1">
          Current plan:{" "}
          <Badge variant={workspace?.plan === "FREE" ? "free" : workspace?.plan === "INDIE" ? "indie" : "pro"} className="ml-1">
            {workspace?.plan ?? "FREE"}
          </Badge>
        </p>
      </div>

      {/* Plans grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PLANS.map((plan) => {
          const isCurrent = workspace?.plan === plan.id;
          return (
            <div
              key={plan.id}
              className={`relative rounded-xl border p-5 flex flex-col gap-4 ${
                plan.popular
                  ? "border-sky-500 bg-sky-500/5"
                  : "border-slate-700 bg-slate-800/30"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-0.5 rounded-full bg-sky-500 text-white text-xs font-semibold">
                    Most Popular
                  </span>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between">
                  <span className="text-base font-bold text-white">{plan.name}</span>
                  <Badge variant={plan.badge}>{plan.id}</Badge>
                </div>
                <div className="mt-1">
                  <span className="text-3xl font-black text-white">
                    ${plan.price}
                  </span>
                  {plan.price > 0 && (
                    <span className="text-slate-400 text-sm">/mo</span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-1">{plan.description}</p>
              </div>

              <ul className="space-y-1.5 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-slate-300">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    {f}
                  </li>
                ))}
                {plan.missing.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-slate-600">
                    <span className="w-3.5 h-3.5 text-slate-700 shrink-0 text-center leading-none">✕</span>
                    {f}
                  </li>
                ))}
              </ul>

              <Button
                variant={isCurrent ? "secondary" : plan.popular ? "default" : "outline"}
                disabled={isCurrent || plan.disabled}
                loading={loading === plan.id}
                className="w-full"
                onClick={() => void handleUpgrade(plan.id)}
              >
                {isCurrent ? (
                  <>
                    <Zap className="w-4 h-4" />
                    Current Plan
                  </>
                ) : (
                  plan.cta
                )}
              </Button>
            </div>
          );
        })}
      </div>

      {/* Current subscription info */}
      <div className="rounded-xl border border-slate-700 bg-slate-800/30 p-5">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="w-4 h-4 text-sky-400" />
          <h2 className="text-sm font-semibold text-white">
            Subscription Details
          </h2>
        </div>
        <div className="flex items-center gap-3 text-sm text-slate-400">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            Billing is managed via Stripe. Contact{" "}
            <a
              href="mailto:support@videokit.io"
              className="text-sky-400 hover:underline"
            >
              support@videokit.io
            </a>{" "}
            for invoice or cancellation requests.
          </span>
        </div>
      </div>
    </div>
  );
}
