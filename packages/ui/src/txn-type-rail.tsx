import * as React from "react";
import { cn } from "./lib/cn";

const TYPE_TOKEN: Record<string, string> = {
  Income: "var(--type-income)",
  Expense: "var(--type-expense)",
  Saving: "var(--type-saving)",
  DebtGiven: "var(--type-debt-given)",
  DebtReceived: "var(--type-debt-received)",
};

/** 5px ledger rail — signature type cue. */
export const TXN_TYPE_RAIL_PX = 5;

export function txnTypeToken(type: string): string {
  return TYPE_TOKEN[type] ?? "var(--text-secondary)";
}

type TxnTypeRailProps = {
  type: string;
  /** `cell` = first <td> on a table row; `block` = div/li wrapper. */
  variant?: "block" | "cell";
  className?: string;
  children?: React.ReactNode;
} & React.HTMLAttributes<HTMLElement>;

/**
 * Colored left rail keyed to transaction type. Text stays neutral;
 * pair amounts with `txnTypeToken(type)` — do not add a type badge.
 */
export function TxnTypeRail({
  type,
  variant = "block",
  className,
  children,
  style,
  ...props
}: TxnTypeRailProps) {
  const rail: React.CSSProperties = {
    borderLeftWidth: TXN_TYPE_RAIL_PX,
    borderLeftStyle: "solid",
    borderLeftColor: txnTypeToken(type),
    ...style,
  };

  if (variant === "cell") {
    return (
      <td
        className={cn("py-1.5 pl-2.5 pr-3 text-sm whitespace-nowrap", className)}
        style={rail}
        {...props}
      >
        {children}
      </td>
    );
  }

  return (
    <div
      className={cn(
        "border-b border-[var(--border-default)] py-1.5 pl-3 last:border-b-0",
        className
      )}
      style={rail}
      {...props}
    >
      {children}
    </div>
  );
}
