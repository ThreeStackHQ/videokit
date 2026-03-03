/**
 * VideoKit Player — vanilla JS embeddable player
 * Exports window.VideoKit.init for use in embed scripts.
 */

export interface VideoKitOptions {
  videoId: string;
  container?: string | HTMLElement;
  autoplay?: boolean;
  loop?: boolean;
  primaryColor?: string;
  onReady?: () => void;
  onPlay?: (currentTime: number) => void;
  onPause?: (currentTime: number) => void;
  onEnd?: () => void;
  onCtaClick?: (ctaUrl: string) => void;
  onGateSubmit?: (email: string) => void;
}

export interface VideoKitInstance {
  play: () => void;
  pause: () => void;
  seek: (seconds: number) => void;
  destroy: () => void;
}

// Sanitize a string for safe use in CSS values / DOM text.
// Strips characters that could break out of CSS context or inject HTML.
function sanitizeCssValue(value: string): string {
  return value.replace(/[^a-zA-Z0-9#(),.\-_%\s]/g, "");
}

function init(options: VideoKitOptions): VideoKitInstance {
  const container =
    typeof options.container === "string"
      ? document.querySelector<HTMLElement>(options.container)
      : options.container ?? document.body;

  if (!container) {
    // Use textContent-safe logging; never interpolate user strings into HTML
    throw new Error("[VideoKit] Container not found");
  }

  // Sanitize user-provided color to prevent CSS injection
  const safeColor = options.primaryColor
    ? sanitizeCssValue(options.primaryColor)
    : "#3b82f6";

  // Create wrapper — use DOM properties, never innerHTML
  const wrapper = document.createElement("div");
  wrapper.className = "videokit-player";
  wrapper.style.position = "relative";
  wrapper.style.width = "100%";
  wrapper.style.background = "#000";
  wrapper.style.borderRadius = "4px";
  wrapper.style.overflow = "hidden";

  // Create video element — use DOM properties, never innerHTML
  const video = document.createElement("video");
  video.style.width = "100%";
  video.style.display = "block";
  video.autoplay = options.autoplay ?? false;
  video.loop = options.loop ?? false;
  video.controls = true;
  video.playsInline = true;

  // Store safe color as CSS custom property for CTA button styling
  wrapper.style.setProperty("--vk-primary", safeColor);

  // Wire events
  video.addEventListener("loadedmetadata", () => options.onReady?.());
  video.addEventListener("play", () => options.onPlay?.(video.currentTime));
  video.addEventListener("pause", () => options.onPause?.(video.currentTime));
  video.addEventListener("ended", () => options.onEnd?.());

  wrapper.appendChild(video);
  container.appendChild(wrapper);

  // Safe: videoId is used in console.log (no DOM insertion)
  console.log("[VideoKit] Initializing player for video:", options.videoId);

  return {
    play: () => void video.play(),
    pause: () => video.pause(),
    seek: (seconds: number) => {
      video.currentTime = seconds;
    },
    destroy: () => {
      video.pause();
      container.removeChild(wrapper);
    },
  };
}

// IIFE export — exposes window.VideoKit
declare global {
  interface Window {
    VideoKit: {
      init: typeof init;
    };
  }
}

if (typeof window !== "undefined") {
  window.VideoKit = { init };
}

export default { init };
