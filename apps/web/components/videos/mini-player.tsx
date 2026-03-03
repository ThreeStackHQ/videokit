"use client";

import { useState, useRef } from "react";
import { Play, Pause, MousePointerClick, Mail } from "lucide-react";
import { cn, secondsToTimestamp } from "@/lib/utils";

interface MiniPlayerProps {
  ctaEnabled?: boolean;
  ctaButtonText?: string;
  ctaButtonUrl?: string;
  ctaButtonColor?: string;
  ctaTimestamp?: number;
  emailGateEnabled?: boolean;
  emailGatePrompt?: string;
  primaryColor?: string;
}

export function MiniPlayer({
  ctaEnabled,
  ctaButtonText = "Click here",
  ctaButtonUrl = "#",
  ctaButtonColor = "#0ea5e9",
  ctaTimestamp = 30,
  emailGateEnabled,
  emailGatePrompt = "Enter your email to continue watching",
  primaryColor = "#0ea5e9",
}: MiniPlayerProps) {
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [showCta, setShowCta] = useState(false);
  const [showGate, setShowGate] = useState(false);
  const [email, setEmail] = useState("");
  const [gateSubmitted, setGateSubmitted] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const DURATION = 120; // mock 2 minutes

  const togglePlay = () => {
    if (playing) {
      clearInterval(intervalRef.current ?? undefined);
      setPlaying(false);
    } else {
      if (emailGateEnabled && !gateSubmitted && currentTime === 0) {
        setShowGate(true);
        return;
      }
      setPlaying(true);
      intervalRef.current = setInterval(() => {
        setCurrentTime((t) => {
          const next = t + 1;
          if (ctaEnabled && next === ctaTimestamp) {
            setShowCta(true);
          }
          if (next >= DURATION) {
            clearInterval(intervalRef.current ?? undefined);
            setPlaying(false);
            return DURATION;
          }
          return next;
        });
      }, 1000);
    }
  };

  const progress = (currentTime / DURATION) * 100;

  return (
    <div
      className="relative rounded-xl overflow-hidden bg-slate-900 aspect-video"
      style={{ border: `2px solid ${primaryColor}30` }}
    >
      {/* Video canvas (simulated) */}
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
        <Play className="w-12 h-12 text-slate-700" />
      </div>

      {/* Email gate overlay */}
      {showGate && !gateSubmitted && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3 p-6 z-20">
          <Mail className="w-8 h-8 text-sky-400" />
          <p className="text-sm font-medium text-white text-center">
            {emailGatePrompt}
          </p>
          <div className="flex gap-2 w-full max-w-xs">
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 px-3 py-1.5 text-sm rounded-md bg-slate-700 text-white border border-slate-600 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
            <button
              onClick={() => {
                setGateSubmitted(true);
                setShowGate(false);
                setPlaying(true);
                intervalRef.current = setInterval(() => {
                  setCurrentTime((t) => {
                    const next = t + 1;
                    if (next >= DURATION) {
                      clearInterval(intervalRef.current ?? undefined);
                      setPlaying(false);
                      return DURATION;
                    }
                    return next;
                  });
                }, 1000);
              }}
              className="px-3 py-1.5 rounded-md text-sm font-semibold text-white"
              style={{ backgroundColor: ctaButtonColor }}
            >
              Watch
            </button>
          </div>
        </div>
      )}

      {/* CTA overlay */}
      {showCta && ctaEnabled && (
        <div className="absolute bottom-10 left-0 right-0 flex justify-center z-20 px-4">
          <a
            href={ctaButtonUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-white shadow-lg hover:opacity-90 transition-opacity animate-fade-in"
            style={{ backgroundColor: ctaButtonColor }}
          >
            <MousePointerClick className="w-4 h-4" />
            {ctaButtonText}
          </a>
        </div>
      )}

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
        {/* Progress bar */}
        <div className="h-1 rounded-full bg-white/20 mb-2 cursor-pointer">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${progress}%`, backgroundColor: primaryColor }}
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={togglePlay}
            className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
          >
            {playing ? (
              <Pause className="w-3.5 h-3.5 text-white" />
            ) : (
              <Play className="w-3.5 h-3.5 text-white" />
            )}
          </button>
          <span className="text-white text-[10px] font-mono">
            {secondsToTimestamp(currentTime)} / {secondsToTimestamp(DURATION)}
          </span>
          {ctaEnabled && (
            <span className="ml-auto text-[10px] text-slate-400 flex items-center gap-1">
              <MousePointerClick className="w-2.5 h-2.5" />
              CTA at {secondsToTimestamp(ctaTimestamp)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
