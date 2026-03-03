"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { VideoUploader } from "@/components/videos/video-uploader";

export default function UploadPage() {
  const router = useRouter();

  const handleUploadComplete = (videoId: string) => {
    router.push(`/dashboard/videos/${videoId}`);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard"
          className="p-2 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Upload Video</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Upload an MP4, MOV, or WebM file up to 5GB
          </p>
        </div>
      </div>

      {/* Uploader */}
      <div className="rounded-xl border border-slate-700 bg-slate-800/30 p-6">
        <VideoUploader onUploadComplete={handleUploadComplete} />
      </div>

      {/* Tips */}
      <div className="rounded-xl border border-slate-700/50 bg-slate-800/20 p-5">
        <h3 className="text-sm font-semibold text-slate-300 mb-3">
          📋 Best practices
        </h3>
        <ul className="space-y-2 text-sm text-slate-400">
          <li>• Use H.264 MP4 for maximum compatibility</li>
          <li>• Keep demos under 5 minutes for best engagement</li>
          <li>• 1080p (1920×1080) is the sweet spot for quality vs. size</li>
          <li>• Videos are delivered directly via Cloudflare R2 — no re-encoding</li>
        </ul>
      </div>
    </div>
  );
}
