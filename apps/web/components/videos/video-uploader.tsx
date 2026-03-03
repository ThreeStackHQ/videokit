"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import {
  Upload,
  CheckCircle,
  XCircle,
  Film,
  X,
} from "lucide-react";
import { cn, formatBytes } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import type { UploadProgress } from "@/lib/types";
import { getPresignedUpload } from "@/lib/api";

interface VideoUploaderProps {
  onUploadComplete?: (videoId: string) => void;
}

export function VideoUploader({ onUploadComplete }: VideoUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    loaded: 0,
    total: 0,
    percentage: 0,
    status: "idle",
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreview(url);
    setUploadProgress({ loaded: 0, total: 0, percentage: 0, status: "idle" });
  }, []);

  const { getRootProps, getInputProps, isDragActive, isDragReject } =
    useDropzone({
      onDrop,
      accept: { "video/*": [".mp4", ".mov", ".webm", ".avi", ".mkv"] },
      maxFiles: 1,
      maxSize: 5 * 1024 * 1024 * 1024, // 5GB
      disabled: uploadProgress.status === "uploading",
    });

  const handleUpload = async () => {
    if (!selectedFile) return;
    try {
      const { uploadUrl, videoId } = await getPresignedUpload(
        selectedFile.name,
        selectedFile.type
      );

      setUploadProgress({
        loaded: 0,
        total: selectedFile.size,
        percentage: 0,
        status: "uploading",
      });

      await uploadToR2(uploadUrl, selectedFile, (loaded, total) => {
        setUploadProgress({
          loaded,
          total,
          percentage: Math.round((loaded / total) * 100),
          status: "uploading",
        });
      });

      setUploadProgress((prev) => ({
        ...prev,
        percentage: 100,
        status: "processing",
      }));

      // Simulate brief processing time
      await new Promise<void>((r) => setTimeout(r, 1500));

      setUploadProgress((prev) => ({ ...prev, status: "done" }));
      onUploadComplete?.(videoId);
    } catch {
      setUploadProgress((prev) => ({ ...prev, status: "error" }));
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setUploadProgress({ loaded: 0, total: 0, percentage: 0, status: "idle" });
  };

  if (uploadProgress.status === "done") {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-12 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-center">
        <CheckCircle className="w-12 h-12 text-emerald-400" />
        <div>
          <h3 className="text-lg font-semibold text-white">Upload Complete!</h3>
          <p className="text-sm text-slate-400 mt-1">
            Your video is ready. Configure its settings below.
          </p>
        </div>
        <Button variant="secondary" onClick={handleReset}>
          Upload another
        </Button>
      </div>
    );
  }

  if (uploadProgress.status === "error") {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-12 rounded-xl border border-red-500/30 bg-red-500/10 text-center">
        <XCircle className="w-12 h-12 text-red-400" />
        <div>
          <h3 className="text-lg font-semibold text-white">Upload Failed</h3>
          <p className="text-sm text-slate-400 mt-1">
            Something went wrong. Please try again.
          </p>
        </div>
        <Button variant="secondary" onClick={handleReset}>
          Try again
        </Button>
      </div>
    );
  }

  if (selectedFile) {
    return (
      <div className="space-y-4">
        {/* File preview */}
        <div className="relative rounded-xl border border-slate-700 bg-slate-800/50 p-4">
          <div className="flex items-center gap-4">
            {preview && (
              <div className="w-24 h-16 rounded-md overflow-hidden bg-slate-900 shrink-0">
                <video
                  src={preview}
                  className="w-full h-full object-cover"
                  muted
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Film className="w-4 h-4 text-sky-400 shrink-0" />
                <p className="text-sm font-medium text-white truncate">
                  {selectedFile.name}
                </p>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {formatBytes(selectedFile.size)} · {selectedFile.type}
              </p>
            </div>
            {uploadProgress.status === "idle" && (
              <button
                onClick={handleReset}
                className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-700 rounded-md transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Progress bar */}
          {uploadProgress.status !== "idle" && (
            <div className="mt-4 space-y-1">
              <div className="flex justify-between text-xs text-slate-400">
                <span>
                  {uploadProgress.status === "processing"
                    ? "Processing video…"
                    : `Uploading… ${formatBytes(uploadProgress.loaded)} / ${formatBytes(uploadProgress.total)}`}
                </span>
                <span>{uploadProgress.percentage}%</span>
              </div>
              <Progress
                value={uploadProgress.percentage}
                {...(uploadProgress.status === "processing"
                  ? { indicatorClassName: "bg-amber-400 animate-pulse" }
                  : {})}
              />
            </div>
          )}
        </div>

        {uploadProgress.status === "idle" && (
          <Button onClick={() => void handleUpload()} className="w-full" size="lg">
            <Upload className="w-4 h-4" />
            Upload Video
          </Button>
        )}
      </div>
    );
  }

  return (
    <div
      {...getRootProps()}
      className={cn(
        "flex flex-col items-center justify-center gap-4 p-12 rounded-xl border-2 border-dashed",
        "cursor-pointer transition-all duration-200 text-center",
        isDragActive && !isDragReject
          ? "border-sky-500 bg-sky-500/10"
          : isDragReject
            ? "border-red-500 bg-red-500/10"
            : "border-slate-600 bg-slate-800/30 hover:border-sky-500/50 hover:bg-sky-500/5"
      )}
    >
      <input {...getInputProps()} />
      <div
        className={cn(
          "w-16 h-16 rounded-full flex items-center justify-center transition-colors",
          isDragActive ? "bg-sky-500/20" : "bg-slate-700/50"
        )}
      >
        <Upload
          className={cn(
            "w-7 h-7 transition-colors",
            isDragActive ? "text-sky-400" : "text-slate-400"
          )}
        />
      </div>
      <div>
        <p className="text-base font-semibold text-white">
          {isDragActive
            ? isDragReject
              ? "File type not supported"
              : "Drop to upload"
            : "Drag & drop your video here"}
        </p>
        <p className="text-sm text-slate-400 mt-1">
          or{" "}
          <span className="text-sky-400 font-medium hover:text-sky-300">
            browse files
          </span>{" "}
          — MP4, MOV, WebM up to 5GB
        </p>
      </div>
    </div>
  );
}

// XHR upload with progress tracking
async function uploadToR2(
  url: string,
  file: File,
  onProgress: (loaded: number, total: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) {
        onProgress(e.loaded, e.total);
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Upload failed: ${xhr.statusText}`));
      }
    });

    xhr.addEventListener("error", () => {
      reject(new Error("Network error during upload"));
    });

    xhr.addEventListener("abort", () => {
      reject(new Error("Upload aborted"));
    });

    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.send(file);
  });
}
