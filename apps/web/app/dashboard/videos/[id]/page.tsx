"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { getVideo, getVideoAnalytics } from "@/lib/api";
import type { Video, VideoAnalytics } from "@/lib/types";
import { VideoSettingsForm } from "@/components/videos/video-settings-form";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDuration, formatNumber } from "@/lib/utils";

export default function VideoDetailPage() {
  const params = useParams<{ id: string }>();
  const [video, setVideo] = useState<Video | null>(null);
  const [analytics, setAnalytics] = useState<VideoAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [v, a] = await Promise.all([
          getVideo(params.id),
          getVideoAnalytics(params.id),
        ]);
        setVideo(v);
        setAnalytics(a);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, [params.id]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="w-9 h-9 rounded-md" />
          <Skeleton className="h-8 w-64" />
        </div>
        <Skeleton className="aspect-video w-full rounded-xl" />
        <div className="space-y-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
        <p className="text-slate-400">Video not found.</p>
        <Link href="/dashboard" className="text-sky-400 hover:text-sky-300 text-sm">
          ← Back to Videos
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard"
          className="p-2 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-white truncate">{video.title}</h1>
          <p className="text-sm text-slate-400">
            {video.duration !== undefined && `${formatDuration(video.duration)} · `}
            {formatNumber(video.playCount)} plays
          </p>
        </div>
        <a
          href={`https://v.videokit.io/${video.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          View Live
        </a>
      </div>

      {/* Player preview */}
      <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-900 border border-slate-700">
        {video.r2Key ? (
          <video
            src={`/api/v1/videos/${video.id}/stream`}
            controls
            className="w-full h-full"
            poster={video.thumbnailKey ? `/api/thumbnails/${video.id}` : undefined}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center">
            <div className="w-16 h-16 rounded-full bg-sky-500/20 flex items-center justify-center">
              <span className="text-2xl">🎬</span>
            </div>
            <p className="text-slate-400 text-sm">Video preview</p>
          </div>
        )}
        {/* Color accent bar */}
        <div
          className="absolute bottom-0 left-0 right-0 h-0.5"
          style={{ backgroundColor: video.primaryColor }}
        />
      </div>

      {/* Settings form */}
      <div className="rounded-xl border border-slate-700 bg-slate-800/30 p-6">
        <VideoSettingsForm video={video} {...(analytics ? { analytics } : {})} />
      </div>
    </div>
  );
}
