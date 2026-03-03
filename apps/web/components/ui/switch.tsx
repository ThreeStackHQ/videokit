"use client";

import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { cn } from "@/lib/utils";

interface SwitchProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  description?: string;
  className?: string;
  id?: string;
}

export function Switch({
  checked,
  onCheckedChange,
  disabled,
  label,
  description,
  className,
  id,
}: SwitchProps) {
  return (
    <div className={cn("flex items-center justify-between gap-4", className)}>
      {(label || description) && (
        <div>
          {label && (
            <label
              htmlFor={id}
              className="text-sm font-medium text-slate-200 cursor-pointer"
            >
              {label}
            </label>
          )}
          {description && (
            <p className="text-xs text-slate-500 mt-0.5">{description}</p>
          )}
        </div>
      )}
      <SwitchPrimitive.Root
        {...(id !== undefined ? { id } : {})}
        {...(checked !== undefined ? { checked } : {})}
        {...(onCheckedChange !== undefined ? { onCheckedChange } : {})}
        {...(disabled !== undefined ? { disabled } : {})}
        className={cn(
          "peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent",
          "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "data-[state=checked]:bg-sky-500 data-[state=unchecked]:bg-slate-600"
        )}
      >
        <SwitchPrimitive.Thumb
          className={cn(
            "pointer-events-none block h-4 w-4 rounded-full bg-white shadow-lg ring-0",
            "transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0"
          )}
        />
      </SwitchPrimitive.Root>
    </div>
  );
}
