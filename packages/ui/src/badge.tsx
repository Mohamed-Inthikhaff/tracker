import * as React from "react";
import { Check, CircleAlert, TriangleAlert } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "./lib/cn";

const badgeVariants = cva(
  "inline-flex flex-nowrap items-center gap-1 whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-medium",
  {
    variants: {
      tone: {
        default:
          "border border-[var(--border-default)] bg-[var(--surface-card)] text-[var(--text-secondary)]",
        income: "bg-[var(--type-income)]/15 text-[var(--type-income)]",
        expense: "bg-[var(--type-expense)]/15 text-[var(--type-expense)]",
        saving: "bg-[var(--type-saving)]/15 text-[var(--type-saving)]",
        debtGiven:
          "bg-[var(--type-debt-given)]/15 text-[var(--type-debt-given)]",
        debtReceived:
          "bg-[var(--type-debt-received)]/15 text-[var(--type-debt-received)]",
        under: "bg-budget-under/15 text-budget-under",
        near: "bg-budget-near/15 text-budget-near",
        over: "bg-budget-over/15 text-budget-over",
      },
    },
    defaultVariants: { tone: "default" },
  }
);

/** NFR-USAB-003: traffic-light tones never rely on color alone. */
const HEALTH_ICON = {
  under: Check,
  near: TriangleAlert,
  over: CircleAlert,
} as const;

const HEALTH_STYLE: Record<
  keyof typeof HEALTH_ICON,
  React.CSSProperties
> = {
  under: {
    color: "var(--budget-under)",
    backgroundColor:
      "color-mix(in srgb, var(--budget-under) 15%, transparent)",
  },
  near: {
    color: "var(--budget-near)",
    backgroundColor:
      "color-mix(in srgb, var(--budget-near) 15%, transparent)",
  },
  over: {
    color: "var(--budget-over)",
    backgroundColor:
      "color-mix(in srgb, var(--budget-over) 15%, transparent)",
  },
};

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({
  className,
  tone,
  children,
  style,
  ...props
}: BadgeProps) {
  const Icon =
    tone && tone in HEALTH_ICON
      ? HEALTH_ICON[tone as keyof typeof HEALTH_ICON]
      : null;
  const healthStyle =
    tone && tone in HEALTH_STYLE
      ? HEALTH_STYLE[tone as keyof typeof HEALTH_STYLE]
      : undefined;

  return (
    <span
      className={cn(badgeVariants({ tone }), className)}
      style={{
        ...(Icon
          ? {
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              whiteSpace: "nowrap",
            }
          : null),
        ...healthStyle,
        ...style,
      }}
      {...props}
    >
      {Icon ? (
        <Icon width={12} height={12} strokeWidth={2.25} aria-hidden />
      ) : null}
      {children}
    </span>
  );
}
