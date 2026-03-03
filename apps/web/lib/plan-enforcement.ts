import type { Workspace } from "@videokit/db";

/** Plan limits */
export const PLAN_LIMITS = {
  free: {
    maxVideos: 5,
    maxStorageBytes: BigInt(500 * 1024 * 1024), // 500 MB
    hasCTA: false,
    hasGate: false,
    hasAnalytics: false,
  },
  indie: {
    maxVideos: 100,
    maxStorageBytes: BigInt(50 * 1024 * 1024 * 1024), // 50 GB
    hasCTA: true,
    hasGate: true,
    hasAnalytics: true,
  },
  pro: {
    maxVideos: -1, // unlimited
    maxStorageBytes: BigInt(-1), // unlimited
    hasCTA: true,
    hasGate: true,
    hasAnalytics: true,
  },
} as const;

export function canUploadVideo(workspace: Workspace): { allowed: boolean; reason?: string } {
  const limits = PLAN_LIMITS[workspace.plan];
  if (limits.maxVideos !== -1 && workspace.videosCount >= limits.maxVideos) {
    return {
      allowed: false,
      reason: `Plan limit reached: ${limits.maxVideos} videos max on ${workspace.plan} plan. Upgrade to upload more.`,
    };
  }
  return { allowed: true };
}

export function canUploadStorage(workspace: Workspace, fileSizeBytes: bigint): { allowed: boolean; reason?: string } {
  const limits = PLAN_LIMITS[workspace.plan];
  if (limits.maxStorageBytes !== BigInt(-1)) {
    const projected = workspace.storageUsedBytes + fileSizeBytes;
    if (projected > limits.maxStorageBytes) {
      return {
        allowed: false,
        reason: `Storage limit reached on ${workspace.plan} plan. Upgrade for more storage.`,
      };
    }
  }
  return { allowed: true };
}

export function canUseCTA(workspace: Workspace): boolean {
  return PLAN_LIMITS[workspace.plan].hasCTA;
}

export function canUseGate(workspace: Workspace): boolean {
  return PLAN_LIMITS[workspace.plan].hasGate;
}

export function canUseAnalytics(workspace: Workspace): boolean {
  return PLAN_LIMITS[workspace.plan].hasAnalytics;
}
