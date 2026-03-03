import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "bg-sky-500/20 text-sky-400 border border-sky-500/30",
        secondary: "bg-slate-700 text-slate-300",
        success: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
        warning: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
        destructive: "bg-red-500/20 text-red-400 border border-red-500/30",
        free: "bg-slate-600/50 text-slate-300 border border-slate-500/30",
        indie: "bg-sky-500/20 text-sky-400 border border-sky-500/30",
        pro: "bg-purple-500/20 text-purple-400 border border-purple-500/30",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
