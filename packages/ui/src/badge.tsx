import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "./lib/cn";

const badgeVariants = cva(
  "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
  {
    variants: {
      tone: {
        default:
          "bg-[var(--surface-card)] text-[var(--text-secondary)] border border-[var(--border-default)]",
        income: "bg-[var(--type-income)]/15 text-[var(--type-income)]",
        expense: "bg-[var(--type-expense)]/15 text-[var(--type-expense)]",
        saving: "bg-[var(--type-saving)]/15 text-[var(--type-saving)]",
        debtGiven:
          "bg-[var(--type-debt-given)]/15 text-[var(--type-debt-given)]",
        debtReceived:
          "bg-[var(--type-debt-received)]/15 text-[var(--type-debt-received)]",
        under: "bg-[var(--budget-under)]/15 text-[var(--budget-under)]",
        near: "bg-[var(--budget-near)]/15 text-[var(--budget-near)]",
        over: "bg-[var(--budget-over)]/15 text-[var(--budget-over)]",
      },
    },
    defaultVariants: { tone: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ tone }), className)} {...props} />
  );
}
