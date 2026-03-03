"use client";

import { useState } from "react";
import { Save, Download, ExternalLink, BarChart3 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { MiniPlayer } from "./mini-player";
import type { Video, VideoAnalytics } from "@/lib/types";
import { updateVideo, getEmailCapturesCsvUrl } from "@/lib/api";
import { cn } from "@/lib/utils";

interface VideoSettingsFormProps {
  video: Video;
  analytics?: VideoAnalytics;
}

export function VideoSettingsForm({
  video: initialVideo,
  analytics,
}: VideoSettingsFormProps) {
  const [video, setVideo] = useState(initialVideo);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const update = (patch: Partial<Video>) => {
    setVideo((v) => ({ ...v, ...patch }));
    setSaved(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateVideo(video.id, video);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadCsv = async () => {
    const url = await getEmailCapturesCsvUrl(video.id);
    window.open(url, "_blank");
  };

  return (
    <div className="space-y-6">
      {/* Save bar */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Video Settings</h2>
        <Button
          onClick={() => void handleSave()}
          loading={isSaving}
          className={cn(saved && "bg-emerald-600 hover:bg-emerald-600")}
        >
          <Save className="w-4 h-4" />
          {saved ? "Saved!" : "Save changes"}
        </Button>
      </div>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="cta">CTA Overlay</TabsTrigger>
          <TabsTrigger value="gate">Email Gate</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* ─── General ──────────────────────────────────────────── */}
        <TabsContent value="general" className="space-y-5">
          <Input
            label="Title"
            value={video.title}
            onChange={(e) => update({ title: e.target.value })}
            placeholder="My Awesome Demo"
          />
          <Input
            label="Description"
            value={video.description ?? ""}
            onChange={(e) => update({ description: e.target.value })}
            placeholder="Optional description"
          />

          <div className="grid grid-cols-2 gap-4">
            {/* Primary color */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-300">
                Primary Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={video.primaryColor}
                  onChange={(e) => update({ primaryColor: e.target.value })}
                  className="w-10 h-9 rounded border border-slate-600 cursor-pointer bg-transparent"
                />
                <input
                  type="text"
                  value={video.primaryColor}
                  onChange={(e) => update({ primaryColor: e.target.value })}
                  className="flex-1 h-9 px-3 rounded-md border border-slate-600 bg-slate-800/50 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            {/* Autoplay & Loop */}
            <div className="space-y-3">
              <Switch
                id="autoplay"
                label="Autoplay"
                description="Play on page load"
                checked={video.autoplay}
                onCheckedChange={(v) => update({ autoplay: v })}
              />
              <Switch
                id="loop"
                label="Loop"
                description="Restart when finished"
                checked={video.loop}
                onCheckedChange={(v) => update({ loop: v })}
              />
            </div>
          </div>

          {/* Embed code */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-300">
              Embed Code
            </label>
            <div className="relative">
              <pre className="text-xs text-slate-400 bg-slate-900 border border-slate-700 rounded-md p-3 overflow-x-auto font-mono">
                {`<script src="https://cdn.videokit.io/player.js"></script>\n<div data-videokit="${video.id}"></div>`}
              </pre>
              <button
                onClick={() =>
                  navigator.clipboard.writeText(
                    `<script src="https://cdn.videokit.io/player.js"></script>\n<div data-videokit="${video.id}"></div>`
                  )
                }
                className="absolute top-2 right-2 px-2 py-1 text-xs rounded bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors"
              >
                Copy
              </button>
            </div>
          </div>
        </TabsContent>

        {/* ─── CTA Overlay ──────────────────────────────────────── */}
        <TabsContent value="cta" className="space-y-5">
          <Switch
            id="cta-enabled"
            label="Enable CTA Overlay"
            description="Show a clickable button during video playback"
            checked={video.ctaEnabled}
            onCheckedChange={(v) => update({ ctaEnabled: v })}
          />

          {video.ctaEnabled && (
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Button Text"
                  value={video.ctaButtonText ?? ""}
                  onChange={(e) => update({ ctaButtonText: e.target.value })}
                  placeholder="Start Free Trial"
                />
                <Input
                  label="Button URL"
                  type="url"
                  value={video.ctaButtonUrl ?? ""}
                  onChange={(e) => update({ ctaButtonUrl: e.target.value })}
                  placeholder="https://example.com/trial"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-slate-300">
                    Button Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={video.ctaButtonColor ?? "#0ea5e9"}
                      onChange={(e) => update({ ctaButtonColor: e.target.value })}
                      className="w-10 h-9 rounded border border-slate-600 cursor-pointer bg-transparent"
                    />
                    <input
                      type="text"
                      value={video.ctaButtonColor ?? "#0ea5e9"}
                      onChange={(e) => update({ ctaButtonColor: e.target.value })}
                      className="flex-1 h-9 px-3 rounded-md border border-slate-600 bg-slate-800/50 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>

                <Input
                  label="Show at (mm:ss)"
                  value={
                    video.ctaTimestamp !== undefined
                      ? `${Math.floor(video.ctaTimestamp / 60)}:${String(video.ctaTimestamp % 60).padStart(2, "0")}`
                      : "0:30"
                  }
                  onChange={(e) => {
                    const parts = e.target.value.split(":").map(Number);
                    const secs =
                      parts.length === 2
                        ? (parts[0] ?? 0) * 60 + (parts[1] ?? 0)
                        : (parts[0] ?? 0);
                    update({ ctaTimestamp: secs });
                  }}
                  placeholder="0:30"
                  hint="Format: m:ss (e.g. 0:30)"
                />
              </div>

              {/* Live preview */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-300">
                  Live Preview
                </p>
                <MiniPlayer
                  ctaEnabled={video.ctaEnabled}
                  {...(video.ctaButtonText !== undefined ? { ctaButtonText: video.ctaButtonText } : {})}
                  {...(video.ctaButtonUrl !== undefined ? { ctaButtonUrl: video.ctaButtonUrl } : {})}
                  {...(video.ctaButtonColor !== undefined ? { ctaButtonColor: video.ctaButtonColor } : {})}
                  {...(video.ctaTimestamp !== undefined ? { ctaTimestamp: video.ctaTimestamp } : {})}
                  primaryColor={video.primaryColor}
                />
                <p className="text-xs text-slate-500">
                  Press play then wait {video.ctaTimestamp ?? 30}s to see the CTA appear
                </p>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ─── Email Gate ───────────────────────────────────────── */}
        <TabsContent value="gate" className="space-y-5">
          <Switch
            id="gate-enabled"
            label="Enable Email Gate"
            description="Require email before watching"
            checked={video.emailGateEnabled}
            onCheckedChange={(v) => update({ emailGateEnabled: v })}
          />

          {video.emailGateEnabled && (
            <div className="space-y-4 pt-2">
              <Input
                label="Gate Prompt Text"
                value={video.emailGatePrompt ?? ""}
                onChange={(e) => update({ emailGatePrompt: e.target.value })}
                placeholder="Enter your email to watch the full video"
                hint="Shown above the email input field"
              />

              <Input
                label="Webhook URL"
                type="url"
                value={video.emailGateWebhookUrl ?? ""}
                onChange={(e) =>
                  update({ emailGateWebhookUrl: e.target.value })
                }
                placeholder="https://hooks.zapier.com/..."
                hint="POST request sent when someone submits their email"
              />

              {/* Export captures */}
              <div className="flex items-center justify-between p-4 rounded-lg border border-slate-700 bg-slate-800/30">
                <div>
                  <p className="text-sm font-medium text-white">
                    Email Captures
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Download all collected emails as CSV
                  </p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => void handleDownloadCsv()}
                >
                  <Download className="w-3.5 h-3.5" />
                  Export CSV
                </Button>
              </div>

              {/* Gate preview */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-300">
                  Live Preview
                </p>
                <MiniPlayer
                  emailGateEnabled={video.emailGateEnabled}
                  {...(video.emailGatePrompt !== undefined ? { emailGatePrompt: video.emailGatePrompt } : {})}
                  primaryColor={video.primaryColor}
                />
              </div>
            </div>
          )}
        </TabsContent>

        {/* ─── Analytics ────────────────────────────────────────── */}
        <TabsContent value="analytics">
          {analytics ? (
            <div className="space-y-5">
              {/* Stat cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: "Total Plays", value: analytics.totalPlays.toLocaleString(), icon: "▶" },
                  {
                    label: "Avg. Completion",
                    value: `${analytics.avgCompletion}%`,
                    icon: "⏱",
                  },
                  {
                    label: "CTA Click Rate",
                    value: `${analytics.ctaClickRate}%`,
                    icon: "🖱",
                  },
                  {
                    label: "Email Captures",
                    value: analytics.emailCaptures.toLocaleString(),
                    icon: "✉",
                  },
                ].map(({ label, value, icon }) => (
                  <div
                    key={label}
                    className="rounded-lg border border-slate-700 bg-slate-800/50 p-4"
                  >
                    <div className="text-lg mb-1">{icon}</div>
                    <p className="text-2xl font-bold text-white">{value}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{label}</p>
                  </div>
                ))}
              </div>

              {/* Plays over time (simple bar chart) */}
              <div className="rounded-lg border border-slate-700 bg-slate-800/30 p-4">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="w-4 h-4 text-sky-400" />
                  <p className="text-sm font-semibold text-white">
                    Plays — Last 14 Days
                  </p>
                </div>
                <div className="flex items-end gap-1 h-32">
                  {analytics.playsOverTime.map(({ date, count }) => {
                    const max = Math.max(
                      ...analytics.playsOverTime.map((d) => d.count)
                    );
                    const pct = max > 0 ? (count / max) * 100 : 0;
                    return (
                      <div
                        key={date}
                        className="flex-1 flex flex-col items-center gap-1 group"
                        title={`${date}: ${count} plays`}
                      >
                        <div
                          className="w-full rounded-t bg-sky-500/60 hover:bg-sky-500 transition-colors"
                          style={{ height: `${pct}%`, minHeight: "4px" }}
                        />
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-[10px] text-slate-500">
                    {analytics.playsOverTime[0]?.date ?? ""}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {analytics.playsOverTime[analytics.playsOverTime.length - 1]?.date ?? ""}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
              <BarChart3 className="w-10 h-10 text-slate-600" />
              <p className="text-slate-400">
                Analytics will appear once your video gets its first view.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
