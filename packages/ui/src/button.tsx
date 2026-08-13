import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "./lib/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-[var(--brand-primary)] text-white hover:opacity-90",
        accent:
          "bg-[var(--brand-accent)] text-white hover:opacity-90",
        secondary:
          "bg-[var(--surface-card)] text-[var(--text-primary)] border border-[var(--border-default)] hover:bg-[var(--border-default)]/40",
        ghost:
          "text-[var(--text-primary)] hover:bg-[var(--surface-card)]",
        danger:
          "bg-[var(--budget-over)] text-white hover:opacity-90",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-11 px-6",
        /** Thumb-first — NFR 44px minimum tap target (Capture). */
        touch: "min-h-11 px-5 text-base",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? "…" : children}
    </button>
  )
);
Button.displayName = "Button";
