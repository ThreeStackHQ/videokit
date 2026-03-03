export type Plan = "FREE" | "INDIE" | "PRO";

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  plan: Plan;
  ownerId: string;
}

export interface Video {
  id: string;
  workspaceId: string;
  title: string;
  description?: string;
  r2Key: string;
  thumbnailKey?: string;
  duration?: number;
  fileSize?: number;
  mimeType?: string;
  primaryColor: string;
  autoplay: boolean;
  loop: boolean;
  ctaEnabled: boolean;
  ctaButtonText?: string;
  ctaButtonUrl?: string;
  ctaButtonColor?: string;
  ctaTimestamp?: number;
  emailGateEnabled: boolean;
  emailGatePrompt?: string;
  emailGateWebhookUrl?: string;
  playCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface VideoPlay {
  id: string;
  videoId: string;
  sessionId: string;
  completionPct: number;
  ctaClicked: boolean;
  createdAt: string;
}

export interface VideoGate {
  id: string;
  videoId: string;
  email: string;
  name?: string;
  createdAt: string;
}

export interface VideoAnalytics {
  totalPlays: number;
  uniquePlays: number;
  avgCompletion: number;
  ctaClickRate: number;
  emailCaptures: number;
  playsOverTime: { date: string; count: number }[];
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
  status: "idle" | "uploading" | "processing" | "done" | "error";
}
