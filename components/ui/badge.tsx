import * as React from "react";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "sky" | "indigo" | "amber" | "rose" | "emerald";

const tones: Record<Tone, string> = {
  neutral: "bg-zinc-800 text-zinc-300 border-zinc-700",
  sky: "bg-sky-500/10 text-sky-300 border-sky-500/30",
  indigo: "bg-indigo-500/10 text-indigo-300 border-indigo-500/30",
  amber: "bg-amber-500/10 text-amber-300 border-amber-500/30",
  rose: "bg-rose-500/10 text-rose-300 border-rose-500/30",
  emerald: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
};

export function Badge({
  className,
  tone = "neutral",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
