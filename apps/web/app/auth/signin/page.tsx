"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Zap, Github, Mail, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState<"github" | "email" | null>(null);
  const [emailSent, setEmailSent] = useState(false);

  const handleGithub = async () => {
    setLoading("github");
    await signIn("github", { callbackUrl: "/dashboard" });
  };

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading("email");
    await signIn("email", { email, callbackUrl: "/dashboard", redirect: false });
    setEmailSent(true);
    setLoading(null);
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center gap-2 text-white">
            <div className="w-8 h-8 rounded-lg bg-sky-500 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
            <span className="text-lg font-bold">VideoKit</span>
          </Link>
        </div>

        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6 space-y-5">
          {emailSent ? (
            <div className="text-center py-4 space-y-3">
              <div className="w-12 h-12 rounded-full bg-sky-500/20 flex items-center justify-center mx-auto">
                <Mail className="w-6 h-6 text-sky-400" />
              </div>
              <h2 className="text-lg font-bold text-white">Check your inbox</h2>
              <p className="text-sm text-slate-400">
                We sent a magic link to <strong className="text-white">{email}</strong>
              </p>
              <button
                onClick={() => { setEmailSent(false); setEmail(""); }}
                className="text-sm text-sky-400 hover:underline"
              >
                Use a different email
              </button>
            </div>
          ) : (
            <>
              <div>
                <h1 className="text-xl font-bold text-white">Sign in to VideoKit</h1>
                <p className="text-sm text-slate-400 mt-1">
                  No password needed. Sign in with GitHub or magic link.
                </p>
              </div>

              {/* GitHub */}
              <button
                onClick={() => void handleGithub()}
                disabled={loading !== null}
                className="w-full flex items-center justify-center gap-2 h-10 rounded-md border border-slate-600 bg-slate-700 text-sm font-medium text-white hover:bg-slate-600 transition-colors disabled:opacity-50"
              >
                {loading === "github" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Github className="w-4 h-4" />
                )}
                Continue with GitHub
              </button>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-slate-700" />
                <span className="text-xs text-slate-500">or</span>
                <div className="flex-1 h-px bg-slate-700" />
              </div>

              {/* Email magic link */}
              <form onSubmit={(e) => void handleEmail(e)} className="space-y-3">
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full h-10 px-3 rounded-md border border-slate-600 bg-slate-800/50 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <button
                  type="submit"
                  disabled={loading !== null || !email}
                  className="w-full flex items-center justify-center gap-2 h-10 rounded-md bg-sky-500 text-sm font-semibold text-white hover:bg-sky-600 transition-colors disabled:opacity-50"
                >
                  {loading === "email" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Mail className="w-4 h-4" />
                  )}
                  Send magic link
                </button>
              </form>
            </>
          )}
        </div>

        <div className="mt-4 text-center">
          <Link href="/" className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-400">
            <ArrowLeft className="w-3 h-3" />
            Back to VideoKit.io
          </Link>
        </div>
      </div>
    </div>
  );
}
