import { txnTypeToken } from "@expense-tracker/ui/txn-type-rail";
import type { Category, TransactionType } from "../types/transaction.types";

export function CategoryChips({
  type,
  categories,
  selectedId,
  onSelect,
}: {
  type: TransactionType;
  categories: Category[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  if (categories.length === 0) {
    return (
      <p className="text-sm text-[var(--text-secondary)]">
        No categories for this type yet — add them on web, or pick another type
        above.
      </p>
    );
  }

  const tone = txnTypeToken(type);

  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((c) => {
        const active = c.id === selectedId;
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => onSelect(c.id)}
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
            {c.name}
          </button>
        );
      })}
    </div>
  );
}
