import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
  className,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: LucideIcon;
  tone?: "default" | "sky" | "indigo" | "amber" | "rose" | "emerald";
  className?: string;
}) {
  const toneClass = {
    default: "text-zinc-100",
    sky: "text-sky-300",
    indigo: "text-indigo-300",
    amber: "text-amber-300",
    rose: "text-rose-300",
    emerald: "text-emerald-300",
  }[tone];

  return (
    <div
      className={cn(
        "rounded-lg border border-zinc-800 bg-zinc-900 px-5 py-4 shadow-sm",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
          {label}
        </span>
        {Icon ? <Icon className="h-4 w-4 text-zinc-500" /> : null}
      </div>
      <div className={cn("mt-2 text-2xl font-semibold tabular-nums", toneClass)}>
        {value}
      </div>
      {hint ? <div className="mt-1 text-xs text-zinc-500">{hint}</div> : null}
    </div>
  );
}
