"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Plus, Video, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VideoCard, VideoCardSkeleton } from "@/components/videos/video-card";
import { getVideos } from "@/lib/api";
import type { Video as VideoType } from "@/lib/types";

export default function DashboardPage() {
  const [videos, setVideos] = useState<VideoType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getVideos();
      setVideos(data);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleDelete = (id: string) => {
    setVideos((prev) => prev.filter((v) => v.id !== id));
  };

  const filtered = videos.filter((v) =>
    v.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Videos</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {isLoading
              ? "Loading…"
              : `${videos.length} video${videos.length !== 1 ? "s" : ""} in your workspace`}
          </p>
        </div>
        <Link href="/dashboard/upload">
          <Button>
            <Plus className="w-4 h-4" />
            Upload Video
          </Button>
        </Link>
      </div>

      {/* Search */}
      {videos.length > 0 && (
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="search"
            placeholder="Search videos…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-md border border-slate-600 bg-slate-800/50 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
      )}

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <VideoCardSkeleton key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center">
            <Video className="w-8 h-8 text-slate-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">
              {search ? "No videos match your search" : "No videos yet"}
            </h3>
            <p className="text-sm text-slate-400 mt-1">
              {search
                ? "Try a different search term"
                : "Upload your first video to get started"}
            </p>
          </div>
          {!search && (
            <Link href="/dashboard/upload">
              <Button>
                <Plus className="w-4 h-4" />
                Upload Video
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((video) => (
            <VideoCard key={video.id} video={video} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
