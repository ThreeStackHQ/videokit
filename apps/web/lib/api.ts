/**
 * VideoKit API Client
 * TODO: Replace mock implementations with real API calls once Bolt has built the backend.
 */
import type { Video, Workspace, VideoAnalytics } from "./types";
import { MOCK_VIDEOS, MOCK_WORKSPACE, MOCK_ANALYTICS } from "./mock-data";

// Simulated network delay for realistic UX
const delay = (ms: number) =>
  new Promise<void>((r) => setTimeout(r, ms));

// ─── Workspaces ─────────────────────────────────────────────────────────────

export async function getWorkspace(): Promise<Workspace> {
  await delay(300);
  // TODO: GET /api/v1/workspace
  return MOCK_WORKSPACE;
}

// ─── Videos ─────────────────────────────────────────────────────────────────

export async function getVideos(): Promise<Video[]> {
  await delay(400);
  // TODO: GET /api/v1/videos
  return MOCK_VIDEOS;
}

export async function getVideo(id: string): Promise<Video> {
  await delay(300);
  // TODO: GET /api/v1/videos/:id
  const video = MOCK_VIDEOS.find((v) => v.id === id);
  if (!video) throw new Error("Video not found");
  return video;
}

export async function updateVideo(
  id: string,
  data: Partial<Video>
): Promise<Video> {
  await delay(500);
  // TODO: PATCH /api/v1/videos/:id
  const video = MOCK_VIDEOS.find((v) => v.id === id);
  if (!video) throw new Error("Video not found");
  return { ...video, ...data };
}

export async function deleteVideo(id: string): Promise<void> {
  await delay(400);
  // TODO: DELETE /api/v1/videos/:id
  console.log("[mock] delete video", id);
}

// ─── Upload ──────────────────────────────────────────────────────────────────

export interface PresignedUpload {
  uploadUrl: string;
  videoId: string;
  key: string;
}

export async function getPresignedUpload(
  filename: string,
  contentType: string
): Promise<PresignedUpload> {
  await delay(300);
  // TODO: POST /api/v1/videos/upload — returns { uploadUrl, videoId, key }
  return {
    uploadUrl: "/api/mock-upload",
    videoId: `vid_${Date.now()}`,
    key: `videos/vid_${Date.now()}/${filename}`,
  };
}

// ─── Analytics ───────────────────────────────────────────────────────────────

export async function getVideoAnalytics(id: string): Promise<VideoAnalytics> {
  await delay(500);
  // TODO: GET /api/v1/videos/:id/analytics
  console.log("[mock] analytics for", id);
  return MOCK_ANALYTICS;
}

// ─── Email gate captures ─────────────────────────────────────────────────────

export async function getEmailCapturesCsvUrl(videoId: string): Promise<string> {
  // TODO: GET /api/v1/videos/:id/gates/export → redirect to signed CSV URL
  return `/api/v1/videos/${videoId}/gates/export`;
}
