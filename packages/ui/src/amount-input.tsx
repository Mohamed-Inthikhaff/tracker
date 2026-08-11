import * as React from "react";
import { cn } from "./lib/cn";

export interface AmountInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "onChange"> {
  value: string;
  onValueChange: (value: string) => void;
}

/** Decimal amount entry — keeps string form for FR-TXN-006. */
export const AmountInput = React.forwardRef<HTMLInputElement, AmountInputProps>(
  ({ className, value, onValueChange, ...props }, ref) => (
    <input
      ref={ref}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      value={value}
      onChange={(e) => {
        const next = e.target.value.replace(/[^\d.]/g, "");
        const parts = next.split(".");
        const cleaned =
          parts.length > 2
            ? `${parts[0]}.${parts.slice(1).join("")}`
            : next;
        if (cleaned.includes(".")) {
          const [whole, frac = ""] = cleaned.split(".");
          onValueChange(`${whole}.${frac.slice(0, 2)}`);
        } else {
          onValueChange(cleaned);
        }
      }}
      className={cn(
        "flex h-14 w-full rounded-md border border-[var(--border-default)] bg-[var(--surface-base)] px-4 text-2xl font-semibold tabular-nums text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)] disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
);
AmountInput.displayName = "AmountInput";
