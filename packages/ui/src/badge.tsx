import * as React from "react";
import {
  Check,
  CircleAlert,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
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
        /** Debt Partially paid (impl-plan §4.4) — not budget Near amber. */
        partial:
          "bg-[var(--brand-accent)]/20 text-[var(--brand-primary)]",
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
    VariantProps<typeof badgeVariants> {
  /** Extra NFR-USAB-003 cue. Budget health tones already pick an icon. */
  icon?: LucideIcon;
}

export function Badge({
  className,
  tone,
  icon: IconProp,
  children,
  style,
  ...props
}: BadgeProps) {
  const HealthIcon =
    tone && tone in HEALTH_ICON
      ? HEALTH_ICON[tone as keyof typeof HEALTH_ICON]
      : null;
  const Icon = IconProp ?? HealthIcon;
  const healthStyle =
    tone && tone in HEALTH_STYLE
      ? HEALTH_STYLE[tone as keyof typeof HEALTH_STYLE]
      : undefined;
  const partialStyle =
    tone === "partial"
      ? {
          color: "var(--brand-primary)",
          backgroundColor:
            "color-mix(in srgb, var(--brand-accent) 22%, transparent)",
        }
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
        ...partialStyle,
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
