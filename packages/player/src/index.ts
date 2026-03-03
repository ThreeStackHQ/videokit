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

function init(options: VideoKitOptions): VideoKitInstance {
  const container =
    typeof options.container === "string"
      ? document.querySelector<HTMLElement>(options.container)
      : options.container ?? document.body;

  if (!container) {
    throw new Error(`[VideoKit] Container not found: ${options.container}`);
  }

  // Create wrapper
  const wrapper = document.createElement("div");
  wrapper.className = "videokit-player";
  wrapper.style.cssText = `position:relative;width:100%;background:#000;border-radius:4px;overflow:hidden;`;

  // Create video element
  const video = document.createElement("video");
  video.style.cssText = "width:100%;display:block;";
  video.autoplay = options.autoplay ?? false;
  video.loop = options.loop ?? false;
  video.controls = true;
  video.playsInline = true;

  // Wire events
  video.addEventListener("loadedmetadata", () => options.onReady?.());
  video.addEventListener("play", () => options.onPlay?.(video.currentTime));
  video.addEventListener("pause", () => options.onPause?.(video.currentTime));
  video.addEventListener("ended", () => options.onEnd?.());

  wrapper.appendChild(video);
  container.appendChild(wrapper);

  console.log(`[VideoKit] Initializing player for video: ${options.videoId}`);

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
