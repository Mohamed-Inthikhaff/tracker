import { Badge } from "@expense-tracker/ui/badge";
import { formatMoney } from "@expense-tracker/utils";
import type { BudgetHealth, BudgetLine } from "../types/budget.types";

function healthTone(h: BudgetHealth): "under" | "near" | "over" {
  if (h === "Under") return "under";
  if (h === "Near") return "near";
  return "over";
}

export function BudgetLinesTable({ lines }: { lines: BudgetLine[] }) {
  return (
    <div className="overflow-x-auto rounded-md border border-[var(--border-default)] bg-[var(--surface-base)]">
      <table className="w-full min-w-[36rem] border-separate border-spacing-0 text-left">
        <thead className="bg-[var(--surface-card)] text-xs uppercase tracking-wide text-[var(--text-secondary)]">
          <tr>
            <th className="px-3 py-1.5 font-medium">Category</th>
            <th className="px-3 py-1.5 text-right font-medium">Budgeted</th>
            <th className="px-3 py-1.5 text-right font-medium">Actual</th>
            <th className="px-3 py-1.5 text-right font-medium">Variance</th>
            <th className="px-3 py-1.5 text-right font-medium">% used</th>
            <th className="px-3 py-1.5 font-medium">Health</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line) => (
            <tr
              key={line.id}
              className="border-b border-[var(--border-default)] last:border-b-0"
            >
              <td className="border-t border-[var(--border-default)] px-3 py-1.5 text-sm text-[var(--text-primary)]">
                {line.categoryName}
              </td>
              <td className="border-t border-[var(--border-default)] px-3 py-1.5 text-right text-sm tabular-nums text-[var(--text-primary)]">
                {formatMoney(line.budgetedAmount)}
              </td>
              <td
                className="border-t border-[var(--border-default)] px-3 py-1.5 text-right text-sm font-medium tabular-nums"
                style={{ color: "var(--type-expense)" }}
              >
                {formatMoney(line.actualAmount)}
              </td>
              <td className="border-t border-[var(--border-default)] px-3 py-1.5 text-right text-sm tabular-nums text-[var(--text-primary)]">
                {formatMoney(line.variance)}
              </td>
              <td className="border-t border-[var(--border-default)] px-3 py-1.5 text-right text-sm tabular-nums text-[var(--text-primary)]">
                {line.percentOfBudgetUsed === null
                  ? "—"
                  : `${line.percentOfBudgetUsed}%`}
              </td>
              <td className="border-t border-[var(--border-default)] px-3 py-1.5 align-middle">
                <Badge tone={healthTone(line.health)}>{line.health}</Badge>
              </td>
            </tr>
          ))}
          {lines.length === 0 ? (
            <tr>
              <td
                colSpan={6}
                className="px-3 py-8 text-center text-sm text-[var(--text-secondary)]"
              >
                No budgets for this month. Set one above or copy prior month.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
