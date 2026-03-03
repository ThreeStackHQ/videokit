"use client";

import { useState } from "react";
import { Save, Key, Globe, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useWorkspace } from "@/contexts/workspace-context";

export default function SettingsPage() {
  const { workspace } = useWorkspace();
  const [name, setName] = useState(workspace?.name ?? "");
  const [slug, setSlug] = useState(workspace?.slug ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise<void>((r) => setTimeout(r, 800));
    // TODO: PATCH /api/v1/workspace
    setIsSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-sm text-slate-400 mt-1">
          Manage your workspace configuration
        </p>
      </div>

      {/* Workspace settings */}
      <div className="rounded-xl border border-slate-700 bg-slate-800/30 p-6 space-y-5">
        <h2 className="text-base font-semibold text-white">
          Workspace Settings
        </h2>
        <Input
          label="Workspace Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Acme Corp"
        />
        <Input
          label="Workspace Slug"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="acme"
          hint="Used in your embed URLs: cdn.videokit.io/ws/acme/..."
        />
        <Button
          onClick={() => void handleSave()}
          loading={isSaving}
          className={saved ? "bg-emerald-600 hover:bg-emerald-600" : ""}
        >
          <Save className="w-4 h-4" />
          {saved ? "Saved!" : "Save changes"}
        </Button>
      </div>

      {/* API Keys */}
      <div className="rounded-xl border border-slate-700 bg-slate-800/30 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Key className="w-4 h-4 text-sky-400" />
          <h2 className="text-base font-semibold text-white">API Keys</h2>
        </div>
        <p className="text-sm text-slate-400">
          Use API keys to programmatically manage videos and retrieve analytics.
        </p>
        <div className="flex items-center gap-3 p-3 rounded-md border border-slate-700 bg-slate-900/50 font-mono text-sm text-slate-300">
          <span className="text-slate-500">sk_live_</span>
          <span className="text-slate-600">{"•".repeat(32)}</span>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm">
            <Key className="w-3.5 h-3.5" />
            Reveal Key
          </Button>
          <Button variant="outline" size="sm">
            Regenerate
          </Button>
        </div>
        <p className="text-xs text-slate-500">
          {/* TODO: Link to API docs */}
          Keys are prefixed with <code className="text-sky-400">sk_live_</code>.
          Never share your API key publicly.
        </p>
      </div>

      {/* Custom domain */}
      <div className="rounded-xl border border-slate-700 bg-slate-800/30 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-sky-400" />
          <h2 className="text-base font-semibold text-white">Custom Domain</h2>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-500/20 text-purple-400 border border-purple-500/30">
            PRO
          </span>
        </div>
        <p className="text-sm text-slate-400">
          Serve your videos from your own domain (e.g.{" "}
          <code className="text-sky-400">videos.yourdomain.com</code>) by
          pointing a CNAME to our CDN.
        </p>
        <Input
          label="Custom Domain"
          placeholder="videos.yourdomain.com"
          disabled={workspace?.plan !== "PRO"}
          hint={
            workspace?.plan !== "PRO"
              ? "Upgrade to Pro to use a custom domain"
              : "Point a CNAME to cdn.videokit.io"
          }
        />
      </div>

      {/* Danger zone */}
      <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Trash2 className="w-4 h-4 text-red-400" />
          <h2 className="text-base font-semibold text-red-400">Danger Zone</h2>
        </div>
        <p className="text-sm text-slate-400">
          Deleting your workspace will permanently remove all videos, analytics,
          and settings. This action cannot be undone.
        </p>
        <Button variant="destructive" size="sm">
          Delete Workspace
        </Button>
      </div>
    </div>
  );
}
