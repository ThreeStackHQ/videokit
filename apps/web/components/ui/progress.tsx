import { cn } from "@/lib/utils";

interface ProgressProps {
  value: number;
  className?: string;
  indicatorClassName?: string;
  showLabel?: boolean;
}

export function Progress({
  value,
  className,
  indicatorClassName,
  showLabel,
}: ProgressProps) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="flex-1 h-2 rounded-full bg-slate-700 overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300 bg-sky-500",
            indicatorClassName
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-slate-400 w-10 text-right">
          {Math.round(pct)}%
        </span>
      )}
    </div>
  );
}
