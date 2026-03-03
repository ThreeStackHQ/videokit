"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Play,
  MoreHorizontal,
  Trash2,
  Pencil,
  Eye,
  MousePointerClick,
  Mail,
} from "lucide-react";
import { cn, formatNumber, formatDuration } from "@/lib/utils";
import type { Video } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { deleteVideo } from "@/lib/api";

interface VideoCardProps {
  video: Video;
  onDelete?: (id: string) => void;
}

export function VideoCard({ video, onDelete }: VideoCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Delete "${video.title}"? This cannot be undone.`)) return;
    setIsDeleting(true);
    try {
      await deleteVideo(video.id);
      onDelete?.(video.id);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      className={cn(
        "group rounded-xl border border-slate-700 overflow-hidden bg-slate-800/50",
        "hover:border-sky-500/50 transition-all duration-200",
        isDeleting && "opacity-50 pointer-events-none"
      )}
    >
      {/* Thumbnail */}
      <Link href={`/dashboard/videos/${video.id}`}>
        <div className="relative aspect-video bg-slate-900 overflow-hidden">
          {video.thumbnailKey ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`/api/thumbnails/${video.id}`}
              alt={video.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
              <Play className="w-10 h-10 text-slate-600" />
            </div>
          )}
          {/* Duration badge */}
          {video.duration !== undefined && (
            <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/70 text-white text-xs font-mono">
              {formatDuration(video.duration)}
            </div>
          )}
          {/* CTA / Email gate indicators */}
          <div className="absolute top-2 left-2 flex gap-1">
            {video.ctaEnabled && (
              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-sky-500/90 text-white text-[10px] font-semibold">
                <MousePointerClick className="w-2.5 h-2.5" /> CTA
              </span>
            )}
            {video.emailGateEnabled && (
              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-purple-500/90 text-white text-[10px] font-semibold">
                <Mail className="w-2.5 h-2.5" /> Gate
              </span>
            )}
          </div>
          {/* Play overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Play className="w-5 h-5 text-white ml-0.5" />
            </div>
          </div>
        </div>
      </Link>

      {/* Card body */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <Link href={`/dashboard/videos/${video.id}`} className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-white truncate hover:text-sky-400 transition-colors">
              {video.title}
            </h3>
          </Link>

          {/* Actions menu */}
          <div className="relative shrink-0">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1 rounded-md text-slate-500 hover:text-white hover:bg-slate-700 transition-colors"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 mt-1 w-40 rounded-lg border border-slate-700 bg-slate-800 shadow-xl z-20 py-1 animate-fade-in">
                  <Link
                    href={`/dashboard/videos/${video.id}`}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                    onClick={() => setMenuOpen(false)}
                  >
                    <Pencil className="w-3.5 h-3.5" /> Edit settings
                  </Link>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      void handleDelete();
                    }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-3 mt-2">
          <span className="flex items-center gap-1 text-xs text-slate-400">
            <Eye className="w-3 h-3" />
            {formatNumber(video.playCount)} plays
          </span>
          <div
            className="w-2.5 h-2.5 rounded-full ring-1 ring-slate-600 shrink-0"
            style={{ backgroundColor: video.primaryColor }}
            title="Brand color"
          />
        </div>

        <p className="text-[11px] text-slate-500 mt-1">
          {new Date(video.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </p>
      </div>
    </div>
  );
}

export function VideoCardSkeleton() {
  return (
    <div className="rounded-xl border border-slate-700 overflow-hidden bg-slate-800/50">
      <div className="aspect-video skeleton" />
      <div className="p-4 space-y-2">
        <div className="skeleton h-4 w-3/4 rounded" />
        <div className="skeleton h-3 w-1/3 rounded" />
        <div className="skeleton h-3 w-1/4 rounded" />
      </div>
    </div>
  );
}
