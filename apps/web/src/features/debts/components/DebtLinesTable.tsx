import { Badge } from "@expense-tracker/ui/badge";
import { Check, Circle, CircleDot } from "lucide-react";
import { formatMoney } from "@expense-tracker/utils";
import type { Debt } from "../types/debt.types";

/**
 * Locked debt-status cues (impl-plan §4.4) — not budget Under/Near/Over.
 * Outstanding hue follows opening direction (KPI tiles); icon is the stage.
 */
function StatusBadge({ debt }: { debt: Debt }) {
  if (debt.status === "Settled") {
    return (
      <Badge tone="income" icon={Check}>
        Settled
      </Badge>
    );
  }
  if (debt.status === "PartiallyPaid") {
    return (
      <Badge tone="partial" icon={CircleDot}>
        Partially paid
      </Badge>
    );
  }
  return (
    <Badge
      tone={debt.direction === "IOwe" ? "debtReceived" : "debtGiven"}
      icon={Circle}
    >
      Outstanding
    </Badge>
  );
}

export function DebtLinesTable({ debts }: { debts: Debt[] }) {
  return (
    <div className="overflow-x-auto rounded-md border border-[var(--border-default)] bg-[var(--surface-base)]">
      <table className="w-full min-w-[40rem] border-separate border-spacing-0 text-left">
        <thead className="bg-[var(--surface-card)] text-xs uppercase tracking-wide text-[var(--text-secondary)]">
          <tr>
            <th className="px-3 py-1.5 font-medium">Person</th>
            <th className="px-3 py-1.5 font-medium">Direction</th>
            <th className="px-3 py-1.5 font-medium">Opened</th>
            <th className="px-3 py-1.5 text-right font-medium">Principal</th>
            <th className="px-3 py-1.5 text-right font-medium">Repaid</th>
            <th className="px-3 py-1.5 text-right font-medium">Remaining</th>
            <th className="px-3 py-1.5 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {debts.map((d) => (
            <tr
              key={d.id}
              className="border-b border-[var(--border-default)] last:border-b-0"
            >
              <td className="border-t border-[var(--border-default)] px-3 py-1.5 text-sm text-[var(--text-primary)]">
                {d.personName}
              </td>
              <td className="border-t border-[var(--border-default)] px-3 py-1.5 text-sm text-[var(--text-primary)]">
                {d.direction === "IOwe" ? "I owe" : "Owed to me"}
              </td>
              <td className="border-t border-[var(--border-default)] px-3 py-1.5 text-sm tabular-nums text-[var(--text-primary)]">
                {d.openedDate}
              </td>
              <td className="border-t border-[var(--border-default)] px-3 py-1.5 text-right text-sm tabular-nums text-[var(--text-primary)]">
                {formatMoney(d.principalAmount)}
              </td>
              <td className="border-t border-[var(--border-default)] px-3 py-1.5 text-right text-sm tabular-nums text-[var(--text-primary)]">
                {formatMoney(d.repaidSoFar)}
              </td>
              <td className="border-t border-[var(--border-default)] px-3 py-1.5 text-right text-sm tabular-nums text-[var(--text-primary)]">
                {formatMoney(d.remaining)}
              </td>
              <td className="border-t border-[var(--border-default)] px-3 py-1.5 align-middle">
                <StatusBadge debt={d} />
              </td>
            </tr>
          ))}
          {debts.length === 0 ? (
            <tr>
              <td
                colSpan={7}
                className="px-3 py-8 text-center text-sm text-[var(--text-secondary)]"
              >
                No debts yet. Log the principal above; repayments with matching
                payee + type auto-link.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
