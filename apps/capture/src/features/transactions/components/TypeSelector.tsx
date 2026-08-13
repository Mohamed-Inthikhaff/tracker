import { txnTypeToken } from "@expense-tracker/ui/txn-type-rail";
import type { TransactionType } from "../types/transaction.types";

const TYPES: { value: TransactionType; label: string }[] = [
  { value: "Expense", label: "Expense" },
  { value: "Income", label: "Income" },
  { value: "Saving", label: "Saving" },
  { value: "DebtGiven", label: "Debt given" },
  { value: "DebtReceived", label: "Debt received" },
];

export function TypeSelector({
  value,
  onChange,
}: {
  value: TransactionType;
  onChange: (type: TransactionType) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Type">
      {TYPES.map((t) => {
        const active = t.value === value;
        const tone = txnTypeToken(t.value);
        return (
          <button
            key={t.value}
            type="button"
            onClick={() => onChange(t.value)}
            className="inline-flex min-h-11 items-center justify-center rounded-full border px-4 text-sm font-medium"
            style={
              active
                ? {
                    borderColor: tone,
                    backgroundColor: `color-mix(in srgb, ${tone} 15%, transparent)`,
                    color: tone,
                  }
                : {
                    borderColor: "var(--border-default)",
                    backgroundColor: "var(--surface-card)",
                    color: "var(--text-primary)",
                  }
            }
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
