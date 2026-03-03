import type { Metadata } from "next";
import Link from "next/link";
import {
  Play,
  MousePointerClick,
  Mail,
  BarChart3,
  Code,
  Shield,
  Zap,
  Check,
  X,
  Star,
  ChevronRight,
} from "lucide-react";

export const metadata: Metadata = {
  title: "VideoKit — Branded Video Hosting for SaaS | $9/mo",
  description:
    "Host your demo video without YouTube ads. Branded video player with CTA overlays and email gates for indie SaaS makers — $9/month.",
  openGraph: {
    title: "VideoKit — Branded Video Hosting for SaaS",
    description: "Wistia-level features for $9/mo. No ads, no YouTube branding.",
    images: [{ url: "/og.png" }],
  },
};

// JSON-LD
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "VideoKit",
  applicationCategory: "BusinessApplication",
  offers: {
    "@type": "Offer",
    price: "9",
    priceCurrency: "USD",
  },
  description:
    "Branded video hosting for indie SaaS. Wistia-like features at $9/mo.",
  url: "https://videokit.io",
};

const FEATURES = [
  {
    icon: Shield,
    title: "Branded Player",
    desc: "Your colors, your logo, your domain. No YouTube watermarks or competitor suggestions.",
  },
  {
    icon: MousePointerClick,
    title: "CTA Overlays",
    desc: "Add timed call-to-action buttons that appear during playback. Drive signups directly from your demo.",
  },
  {
    icon: Mail,
    title: "Email Gates",
    desc: "Capture leads before they watch. Custom prompt, webhook delivery, CSV export.",
  },
  {
    icon: Shield,
    title: "No Ads, Ever",
    desc: "Your demo video is your pitch. No pre-rolls, no competitor ads, no distractions.",
  },
  {
    icon: BarChart3,
    title: "Analytics",
    desc: "Play counts, completion rates, CTA clicks, email captures. Know what converts.",
  },
  {
    icon: Code,
    title: "Simple API",
    desc: "Two-line embed. REST API for programmatic management. Webhooks for your stack.",
  },
];

const TESTIMONIALS = [
  {
    name: "Maria Chen",
    role: "Founder, FormKit Pro",
    avatar: "MC",
    color: "#0ea5e9",
    quote:
      "Switched from Loom embeds to VideoKit for our homepage. CTA click-through went from 0 to 18% in the first week. The email gate alone paid for itself.",
  },
  {
    name: "Tom Bradshaw",
    role: "Solo SaaS · Indie Hacker",
    avatar: "TB",
    color: "#8b5cf6",
    quote:
      "I was paying Wistia $99/month for features I used 10% of. VideoKit does everything I need for $9. Setup took 10 minutes.",
  },
  {
    name: "Priya Nair",
    role: "Co-founder, ShipFast",
    avatar: "PN",
    color: "#10b981",
    quote:
      "The branded player means visitors never know we're using a third-party service. It just looks like part of our product.",
  },
];

const COMPARISON = [
  { feature: "Branded player", vk: true, wistia: true, vimeo: true, gumlet: true },
  { feature: "No ads", vk: true, wistia: true, vimeo: false, gumlet: true },
  { feature: "CTA overlays", vk: true, wistia: true, vimeo: false, gumlet: false },
  { feature: "Email gates", vk: true, wistia: true, vimeo: false, gumlet: false },
  { feature: "Analytics", vk: true, wistia: true, vimeo: true, gumlet: true },
  { feature: "REST API", vk: true, wistia: true, vimeo: true, gumlet: true },
  { feature: "Price (basic)", vk: "$9/mo", wistia: "$19/mo", vimeo: "$7/mo*", gumlet: "$20/mo" },
  { feature: "Indie-friendly", vk: true, wistia: false, vimeo: false, gumlet: false },
];

export default function LandingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="min-h-screen bg-[#0f172a] text-white">
        {/* Nav */}
        <nav className="border-b border-slate-800 sticky top-0 z-50 bg-[#0f172a]/90 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-sky-500 flex items-center justify-center">
                <Zap className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-bold text-white">VideoKit</span>
            </div>
            <div className="hidden md:flex items-center gap-6 text-sm text-slate-400">
              <a href="#features" className="hover:text-white transition-colors">
                Features
              </a>
              <a href="#pricing" className="hover:text-white transition-colors">
                Pricing
              </a>
              <a href="#compare" className="hover:text-white transition-colors">
                Compare
              </a>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="text-sm text-slate-400 hover:text-white transition-colors"
              >
                Sign in
              </Link>
              <Link
                href="/dashboard"
                className="px-4 py-1.5 rounded-md bg-sky-500 text-white text-sm font-semibold hover:bg-sky-600 transition-colors"
              >
                Get started free
              </Link>
            </div>
          </div>
        </nav>

        {/* Hero */}
        <section className="relative overflow-hidden">
          {/* Background glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative max-w-5xl mx-auto px-4 pt-24 pb-16 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-sky-500/30 bg-sky-500/10 text-sky-400 text-sm mb-6">
              <Star className="w-3.5 h-3.5" />
              <span>Wistia features at 5% of the price</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-black text-white leading-tight tracking-tight mb-4">
              Host your demo video
              <br />
              <span className="text-sky-400">without YouTube ads</span>
            </h1>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-8">
              Branded video player. CTA overlays. Email gates. Analytics.
              <br />
              Everything Wistia does —{" "}
              <strong className="text-white">for $9/month</strong>.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-sky-500 text-white font-semibold text-base hover:bg-sky-600 transition-colors"
              >
                Start for free
                <ChevronRight className="w-4 h-4" />
              </Link>
              <a
                href="#features"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-slate-600 text-slate-300 font-semibold text-base hover:bg-slate-800 transition-colors"
              >
                <Play className="w-4 h-4" />
                See how it works
              </a>
            </div>

            <p className="text-xs text-slate-600 mt-4">
              No credit card required · Free tier includes 3 videos
            </p>
          </div>

          {/* Demo player */}
          <div className="max-w-3xl mx-auto px-4 pb-20">
            <div className="relative rounded-2xl overflow-hidden border border-slate-700 shadow-2xl shadow-sky-500/10">
              <div className="aspect-video bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center relative">
                {/* Simulated video frame */}
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                  <div className="w-20 h-20 rounded-full bg-sky-500/20 border border-sky-500/30 flex items-center justify-center">
                    <Play className="w-8 h-8 text-sky-400 ml-1" />
                  </div>
                  <p className="text-slate-500 text-sm">VideoKit Demo Player</p>
                </div>

                {/* Simulated CTA overlay */}
                <div className="absolute bottom-12 left-1/2 -translate-x-1/2 animate-bounce">
                  <div className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-sky-500 text-white text-sm font-semibold shadow-lg whitespace-nowrap">
                    <MousePointerClick className="w-4 h-4" />
                    Start Free Trial → appears at 0:30
                  </div>
                </div>

                {/* Player bar */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                  <div className="h-1 rounded-full bg-white/20 mb-2">
                    <div
                      className="h-full w-2/5 rounded-full bg-sky-500"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                      <Play className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-white text-xs font-mono">0:30 / 2:05</span>
                    <div className="ml-auto flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-sky-500" />
                      <span className="text-xs text-slate-400">VideoKit</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <p className="text-center text-xs text-slate-500 mt-3">
              Your brand. Your player. No &quot;watch on YouTube&quot; button.
            </p>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-20 border-t border-slate-800">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-white mb-3">
                Everything your demo needs
              </h2>
              <p className="text-slate-400 max-w-xl mx-auto">
                Built specifically for indie SaaS founders who want their video
                to convert — not distract.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {FEATURES.map(({ icon: Icon, title, desc }) => (
                <div
                  key={title}
                  className="p-5 rounded-xl border border-slate-700 bg-slate-800/30 hover:border-sky-500/30 hover:bg-sky-500/5 transition-all"
                >
                  <div className="w-9 h-9 rounded-lg bg-sky-500/20 flex items-center justify-center mb-3">
                    <Icon className="w-4 h-4 text-sky-400" />
                  </div>
                  <h3 className="font-semibold text-white mb-1">{title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="py-20 border-t border-slate-800">
          <div className="max-w-4xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-white mb-3">
                Simple, honest pricing
              </h2>
              <p className="text-slate-400">
                No per-seat fees. No bandwidth gotchas. Pay once, host everything.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                {
                  name: "Free",
                  price: "0",
                  period: "",
                  desc: "Try it out",
                  features: [
                    "3 videos",
                    "100 plays/month",
                    "720p quality",
                    "VideoKit branding",
                  ],
                  cta: "Start free",
                  popular: false,
                },
                {
                  name: "Indie",
                  price: "9",
                  period: "/mo",
                  desc: "For solo founders",
                  features: [
                    "Unlimited videos",
                    "10K plays/month",
                    "1080p quality",
                    "No watermark",
                    "CTA overlays",
                    "Email gates",
                    "Analytics",
                  ],
                  cta: "Start free trial",
                  popular: true,
                },
                {
                  name: "Pro",
                  price: "29",
                  period: "/mo",
                  desc: "For growing teams",
                  features: [
                    "Everything in Indie",
                    "100K plays/month",
                    "4K quality",
                    "Custom domain",
                    "API access",
                    "Webhooks",
                    "Team seats (3)",
                    "Priority support",
                  ],
                  cta: "Start free trial",
                  popular: false,
                },
              ].map((plan) => (
                <div
                  key={plan.name}
                  className={`relative rounded-xl border p-6 flex flex-col gap-5 ${
                    plan.popular
                      ? "border-sky-500 bg-sky-500/5"
                      : "border-slate-700 bg-slate-800/30"
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="px-3 py-1 rounded-full bg-sky-500 text-white text-xs font-semibold">
                        Best for indie makers
                      </span>
                    </div>
                  )}
                  <div>
                    <h3 className="text-base font-bold text-white">{plan.name}</h3>
                    <div className="flex items-baseline gap-0.5 mt-1">
                      <span className="text-3xl font-black text-white">
                        ${plan.price}
                      </span>
                      <span className="text-slate-400 text-sm">{plan.period}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{plan.desc}</p>
                  </div>
                  <ul className="space-y-2 flex-1">
                    {plan.features.map((f) => (
                      <li
                        key={f}
                        className="flex items-center gap-2 text-sm text-slate-300"
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/dashboard"
                    className={`block text-center py-2.5 rounded-lg font-semibold text-sm transition-colors ${
                      plan.popular
                        ? "bg-sky-500 text-white hover:bg-sky-600"
                        : "border border-slate-600 text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Comparison table */}
        <section id="compare" className="py-20 border-t border-slate-800">
          <div className="max-w-4xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-white mb-3">
                How we compare
              </h2>
              <p className="text-slate-400">
                All the features that matter. None of the enterprise overhead.
              </p>
            </div>

            <div className="rounded-xl border border-slate-700 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700 bg-slate-800/50">
                    <th className="px-5 py-3 text-left text-xs text-slate-500 font-medium uppercase tracking-wider">
                      Feature
                    </th>
                    <th className="px-5 py-3 text-center text-sky-400 font-bold">VideoKit</th>
                    <th className="px-5 py-3 text-center text-slate-400 font-medium">Wistia</th>
                    <th className="px-5 py-3 text-center text-slate-400 font-medium">Vimeo</th>
                    <th className="px-5 py-3 text-center text-slate-400 font-medium">Gumlet</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {COMPARISON.map(({ feature, vk, wistia, vimeo, gumlet }) => (
                    <tr
                      key={feature}
                      className="hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="px-5 py-3 text-slate-300">{feature}</td>
                      {[vk, wistia, vimeo, gumlet].map((val, i) => (
                        <td key={i} className="px-5 py-3 text-center">
                          {typeof val === "boolean" ? (
                            val ? (
                              <Check className="w-4 h-4 text-emerald-400 mx-auto" />
                            ) : (
                              <X className="w-4 h-4 text-slate-600 mx-auto" />
                            )
                          ) : (
                            <span
                              className={`text-xs font-semibold ${i === 0 ? "text-sky-400" : "text-slate-400"}`}
                            >
                              {val}
                            </span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-slate-600 mt-3 text-center">
              *Vimeo&apos;s $7/mo plan shows ads on videos. VideoKit never does.
            </p>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-20 border-t border-slate-800">
          <div className="max-w-5xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-white mb-3">
                Loved by indie makers
              </h2>
              <p className="text-slate-400">
                Real founders. Real results.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {TESTIMONIALS.map(({ name, role, avatar, color, quote }) => (
                <div
                  key={name}
                  className="p-5 rounded-xl border border-slate-700 bg-slate-800/30"
                >
                  <div className="flex gap-0.5 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className="w-4 h-4 fill-amber-400 text-amber-400"
                      />
                    ))}
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed mb-5">
                    &ldquo;{quote}&rdquo;
                  </p>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold"
                      style={{ backgroundColor: color }}
                    >
                      {avatar}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{name}</p>
                      <p className="text-xs text-slate-500">{role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA section */}
        <section className="py-20 border-t border-slate-800">
          <div className="max-w-2xl mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-white mb-3">
              Your demo deserves better than YouTube
            </h2>
            <p className="text-slate-400 mb-8">
              Start free. No credit card. First 3 videos always free.
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-lg bg-sky-500 text-white font-semibold text-base hover:bg-sky-600 transition-colors"
            >
              Get started — it&apos;s free
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-slate-800 py-10">
          <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-sky-500 flex items-center justify-center">
                <Zap className="w-3 h-3 text-white" />
              </div>
              <span className="font-semibold text-slate-400">VideoKit</span>
              <span>© 2026 ThreeStack. All rights reserved.</span>
            </div>
            <div className="flex gap-5">
              <a href="/privacy" className="hover:text-slate-400 transition-colors">
                Privacy
              </a>
              <a href="/terms" className="hover:text-slate-400 transition-colors">
                Terms
              </a>
              <a
                href="mailto:hello@videokit.io"
                className="hover:text-slate-400 transition-colors"
              >
                Contact
              </a>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
