import type { TrendPoint } from "../types/dashboard.types";

/**
 * Income vs expense bars. Height % must sit in a box with a definite
 * height — a flex column with auto height collapses % bars to 0.
 */
export function IncomeExpenseTrendChart({ points }: { points: TrendPoint[] }) {
  const maxTrend = Math.max(
    1,
    ...points.flatMap((p) => [Number(p.income) || 0, Number(p.expense) || 0])
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="relative h-48">
        <div className="pointer-events-none absolute inset-x-0 bottom-5 top-0 flex flex-col justify-between">
          <div className="border-t border-[var(--border-default)]" />
          <div className="border-t border-[var(--border-default)]" />
          <div className="border-t border-[var(--border-default)]" />
          <div className="border-t border-[var(--border-default)]" />
        </div>
        <div className="relative flex h-full gap-1">
          {points.map((p) => {
            const incH = (Number(p.income) / maxTrend) * 92;
            const expH = (Number(p.expense) / maxTrend) * 92;
            return (
              <div
                key={p.month}
                className="flex min-w-0 flex-1 flex-col"
                title={`${p.month}: I ${p.income} / E ${p.expense}`}
              >
                <div className="relative min-h-0 flex-1">
                  <div className="absolute inset-0 flex items-end justify-center gap-0.5">
                    <div
                      className="w-[45%] max-w-[0.65rem] rounded-t bg-[var(--type-income)]"
                      style={{ height: `${incH}%` }}
                    />
                    <div
                      className="w-[45%] max-w-[0.65rem] rounded-t bg-[var(--type-expense)]"
                      style={{ height: `${expH}%` }}
                    />
                  </div>
                </div>
                <span className="mt-1 text-center text-[9px] tabular-nums text-[var(--text-secondary)]">
                  {p.month.slice(5)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      <p className="text-xs text-[var(--text-secondary)]">
        <span className="text-[var(--type-income)]">■ Income</span>
        {" · "}
        <span className="text-[var(--type-expense)]">■ Expense</span>
      </p>
    </div>
  );
}
