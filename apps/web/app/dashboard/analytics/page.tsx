"use client";

import { useEffect, useState } from "react";
import { BarChart3, Eye, MousePointerClick, Mail, TrendingUp } from "lucide-react";
import { getVideos } from "@/lib/api";
import { MOCK_ANALYTICS } from "@/lib/mock-data";
import type { Video } from "@/lib/types";
import { formatNumber } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export default function AnalyticsPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getVideos()
      .then(setVideos)
      .finally(() => setIsLoading(false));
  }, []);

  const totalPlays = videos.reduce((acc, v) => acc + v.playCount, 0);

  const stats = [
    { label: "Total Plays", value: formatNumber(totalPlays), icon: Eye, color: "text-sky-400" },
    { label: "Avg. Completion", value: `${MOCK_ANALYTICS.avgCompletion}%`, icon: TrendingUp, color: "text-emerald-400" },
    { label: "CTA Click Rate", value: `${MOCK_ANALYTICS.ctaClickRate}%`, icon: MousePointerClick, color: "text-purple-400" },
    { label: "Email Captures", value: formatNumber(MOCK_ANALYTICS.emailCaptures), icon: Mail, color: "text-amber-400" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
        <p className="text-sm text-slate-400 mt-1">
          Workspace-level performance across all videos
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="rounded-xl border border-slate-700 bg-slate-800/50 p-5"
          >
            <Icon className={`w-5 h-5 ${color} mb-2`} />
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Plays over time */}
      <div className="rounded-xl border border-slate-700 bg-slate-800/30 p-6">
        <div className="flex items-center gap-2 mb-6">
          <BarChart3 className="w-4 h-4 text-sky-400" />
          <h2 className="text-sm font-semibold text-white">Daily Plays — Last 14 Days</h2>
        </div>
        <div className="flex items-end gap-1.5 h-40">
          {MOCK_ANALYTICS.playsOverTime.map(({ date, count }) => {
            const max = Math.max(...MOCK_ANALYTICS.playsOverTime.map((d) => d.count));
            const pct = max > 0 ? (count / max) * 100 : 0;
            return (
              <div
                key={date}
                className="flex-1 flex flex-col items-center gap-1 group"
                title={`${date}: ${count} plays`}
              >
                <span className="text-[9px] text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
                  {count}
                </span>
                <div
                  className="w-full rounded-t bg-sky-500/50 hover:bg-sky-500 transition-colors cursor-pointer"
                  style={{ height: `${pct}%`, minHeight: "4px" }}
                />
              </div>
            );
          })}
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-[10px] text-slate-500">
            {MOCK_ANALYTICS.playsOverTime[0]?.date ?? ""}
          </span>
          <span className="text-[10px] text-slate-500">Today</span>
        </div>
      </div>

      {/* Per-video table */}
      <div className="rounded-xl border border-slate-700 bg-slate-800/30 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-700">
          <h2 className="text-sm font-semibold text-white">Video Performance</h2>
        </div>
        {isLoading ? (
          <div className="divide-y divide-slate-700">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-16 ml-auto" />
                <Skeleton className="h-4 w-12" />
              </div>
            ))}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-xs text-slate-500 uppercase tracking-wider">
                <th className="px-5 py-3 text-left font-medium">Video</th>
                <th className="px-5 py-3 text-right font-medium">Plays</th>
                <th className="px-5 py-3 text-right font-medium">CTA</th>
                <th className="px-5 py-3 text-right font-medium">Gate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {videos.map((v) => (
                <tr key={v.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="px-5 py-3">
                    <span className="text-white font-medium">{v.title}</span>
                  </td>
                  <td className="px-5 py-3 text-right text-slate-300">
                    {formatNumber(v.playCount)}
                  </td>
                  <td className="px-5 py-3 text-right">
                    {v.ctaEnabled ? (
                      <span className="text-sky-400">●</span>
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right">
                    {v.emailGateEnabled ? (
                      <span className="text-purple-400">●</span>
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
