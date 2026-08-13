"use client";

import { Label } from "@expense-tracker/ui/label";
import { Select } from "@expense-tracker/ui/select";
import type { ImportDateFormat } from "@expense-tracker/types";

const OPTIONS: { value: ImportDateFormat; label: string }[] = [
  { value: "iso", label: "YYYY-MM-DD (ISO)" },
  { value: "dmy", label: "DD/MM/YYYY" },
  { value: "mdy", label: "MM/DD/YYYY" },
];

interface ImportDateFormatSelectProps {
  value: ImportDateFormat | "";
  onChange: (value: ImportDateFormat) => void;
  samples: string[];
  suggested: ImportDateFormat | null;
}

/**
 * Confirmed date layout for this CSV (FR-IMP-001). Pre-selects a guess
 * when the file is unambiguous; preview stays disabled until the user
 * has a format selected.
 */
export function ImportDateFormatSelect({
  value,
  onChange,
  samples,
  suggested,
}: ImportDateFormatSelectProps) {
  return (
    <div className="flex flex-col gap-2 rounded-md border border-[var(--border-default)] p-3">
      <Label htmlFor="import-date-format">Date format in this file</Label>
      <Select
        id="import-date-format"
        required
        value={value}
        onChange={(e) => onChange(e.target.value as ImportDateFormat)}
      >
        <option value="" disabled>
          Select date format…
        </option>
        {OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
            {suggested === option.value ? " (suggested)" : ""}
          </option>
        ))}
      </Select>
      <p className="text-xs text-[var(--text-secondary)]">
        {samples.length > 0
          ? `Sample dates: ${samples.slice(0, 6).join(", ")}. `
          : null}
        Confirm before preview — a wrong format puts spend in the wrong month.
        Invalid dates for the selected format fail those rows.
      </p>
    </div>
  );
}
