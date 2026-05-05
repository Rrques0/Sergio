import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

const tones = {
  default: "bg-muted text-muted-foreground",
  blue: "bg-sky-100 text-sky-800",
  green: "bg-emerald-100 text-emerald-800",
  orange: "bg-amber-100 text-amber-900",
  red: "bg-red-100 text-red-800",
  slate: "bg-slate-100 text-slate-800"
};

export function Badge({
  className,
  tone = "default",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: keyof typeof tones }) {
  return (
    <span
      className={cn(
        "inline-flex min-h-7 items-center rounded-md px-2.5 text-xs font-bold",
        tones[tone],
        className
      )}
      {...props}
    />
  );
}
