import * as React from "react";
import { cn } from "./lib/cn";

export interface KpiCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: string;
  /** CSS color value, prefer var(--type-*) tokens. */
  tone?: string;
  hint?: string;
}

/** Lightweight KPI tile (Tremor not used — peer React 18 only). */
export function KpiCard({
  label,
  value,
  tone = "var(--text-primary)",
  hint,
  className,
  ...props
}: KpiCardProps) {
  return (
    <div
      className={cn(
        "rounded-md border border-[var(--border-default)] bg-[var(--surface-card)] p-3",
        className
      )}
      {...props}
    >
      <p className="text-xs text-[var(--text-secondary)]">{label}</p>
      <p
        className="mt-1 text-xl font-semibold tabular-nums tracking-tight"
        style={{ color: tone }}
      >
        {value}
      </p>
      {hint ? (
        <p className="mt-1 text-xs text-[var(--text-secondary)]">{hint}</p>
      ) : null}
    </div>
  );
}
