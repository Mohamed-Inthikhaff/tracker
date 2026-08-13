import { Button } from "@expense-tracker/ui/button";

export const TRANSACTION_PAGE_SIZE = 100;

export function TransactionListPager({
  total,
  limit,
  offset,
  onPrev,
  onNext,
}: {
  total: number;
  limit: number;
  offset: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  if (total <= 0) return null;

  const from = offset + 1;
  const to = Math.min(offset + limit, total);
  const page = Math.floor(offset / limit) + 1;
  const pageCount = Math.max(1, Math.ceil(total / limit));
  const canPrev = offset > 0;
  const canNext = offset + limit < total;

  if (pageCount <= 1) {
    return (
      <p className="text-sm text-[var(--text-secondary)]">
        Showing {from}–{to} of {total}
      </p>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-[var(--text-secondary)]">
        Showing {from}–{to} of {total}
        <span className="text-[var(--text-secondary)]">
          {" "}
          · Page {page} of {pageCount}
        </span>
      </p>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={!canPrev}
          onClick={onPrev}
        >
          Previous
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={!canNext}
          onClick={onNext}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
