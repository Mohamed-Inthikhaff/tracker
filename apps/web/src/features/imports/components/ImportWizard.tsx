"use client";

import { useMemo, useState } from "react";
import { Button } from "@expense-tracker/ui/button";
import { Input } from "@expense-tracker/ui/input";
import { Label } from "@expense-tracker/ui/label";
import { Select } from "@expense-tracker/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@expense-tracker/ui/card";
import type { CategoryRemap, ColumnMapping, ImportField } from "@expense-tracker/types";
import {
  useCommitImport,
  usePreviewImport,
  useUploadImport,
} from "../hooks/useImports";
import type { PreviewImportResult, UploadImportResult } from "../types/import.types";

const FIELDS: ImportField[] = [
  "date",
  "type",
  "category",
  "amount",
  "description",
  "payee",
  "notes",
  "skip",
];

type Step = "upload" | "map" | "preview" | "done";

/**
 * CSV import wizard: upload → map columns → preview/remap → commit (FR-IMP-001–004).
 */
export function ImportWizard() {
  const [step, setStep] = useState<Step>("upload");
  const [batch, setBatch] = useState<UploadImportResult | null>(null);
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [remaps, setRemaps] = useState<CategoryRemap[]>([]);
  const [preview, setPreview] = useState<PreviewImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [createdCount, setCreatedCount] = useState(0);

  const upload = useUploadImport();
  const runPreview = usePreviewImport(batch?.id ?? null);
  const commit = useCommitImport(batch?.id ?? null);

  const unmapped = preview?.unmappedCategories ?? [];

  async function onFile(file: File | null) {
    if (!file) return;
    setError(null);
    try {
      const text = await file.text();
      const result = await upload.mutateAsync({
        csv: text,
        filename: file.name,
      });
      setBatch(result);
      setMapping(result.suggestedMapping);
      setStep("map");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    }
  }

  async function onPreview() {
    setError(null);
    try {
      const result = await runPreview.mutateAsync({
        mapping,
        categoryRemaps: remaps,
      });
      setPreview(result);
      setStep("preview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Preview failed");
    }
  }

  async function onCommit() {
    setError(null);
    try {
      const result = await commit.mutateAsync({
        mapping,
        categoryRemaps: remaps,
      });
      setCreatedCount(result.createdCount);
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Commit failed");
    }
  }

  const canCommit = Boolean(preview?.canCommit);

  const remapSlots = useMemo(() => unmapped, [unmapped]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>CSV import</CardTitle>
        <CardDescription>
          Upload a Transactions export, map columns, resolve categories, then
          preview before commit.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <StepIndicator step={step} />

        {step === "upload" ? (
          <div className="flex flex-col gap-2">
            <Label htmlFor="csv">CSV file</Label>
            <Input
              id="csv"
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => onFile(e.target.files?.[0] ?? null)}
            />
            <p className="text-xs text-[var(--text-secondary)]">
              Expected headers (from spreadsheet): Date, Type, Category,
              Person/Payee, Description, Amount (Rs), Notes
            </p>
          </div>
        ) : null}

        {step === "map" && batch ? (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-[var(--text-secondary)]">
              {batch.rowCount} rows from{" "}
              <span className="font-medium text-[var(--text-primary)]">
                {batch.filename || "upload"}
              </span>
            </p>
            <div className="grid gap-3">
              {batch.headers.map((header) => (
                <div
                  key={header}
                  className="grid items-center gap-2 sm:grid-cols-[1fr_12rem]"
                >
                  <span className="text-sm truncate">{header || "(empty)"}</span>
                  <Select
                    value={mapping[header] ?? "skip"}
                    onChange={(e) =>
                      setMapping((m) => ({
                        ...m,
                        [header]: e.target.value as ImportField,
                      }))
                    }
                  >
                    {FIELDS.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </Select>
                </div>
              ))}
            </div>
            <Button onClick={onPreview} loading={runPreview.isPending}>
              Preview import
            </Button>
          </div>
        ) : null}

        {step === "preview" && preview ? (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-4 text-sm">
              <span>
                Ready:{" "}
                <strong className="text-[var(--type-income)]">
                  {preview.readyCount}
                </strong>
              </span>
              <span>
                Failed:{" "}
                <strong className="text-[var(--type-expense)]">
                  {preview.failedCount}
                </strong>
              </span>
            </div>

            {remapSlots.length > 0 ? (
              <div className="flex flex-col gap-3 rounded-md border border-[var(--border-default)] p-3">
                <p className="text-sm font-medium">
                  Unmapped categories (FR-IMP-002)
                </p>
                {remapSlots.map((u) => (
                  <div
                    key={`${u.type}:${u.sourceName}`}
                    className="flex flex-wrap items-center gap-2 text-sm"
                  >
                    <span className="min-w-[10rem]">
                      {u.sourceName}{" "}
                      <span className="text-[var(--text-secondary)]">
                        ({u.type} · {u.rowCount})
                      </span>
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setRemaps((list) => {
                          const exists = list.some(
                            (r) =>
                              r.sourceName === u.sourceName &&
                              r.type === u.type
                          );
                          if (exists) return list;
                          return [
                            ...list,
                            {
                              sourceName: u.sourceName,
                              type: u.type as CategoryRemap["type"],
                              createCategory: true,
                            },
                          ];
                        });
                      }}
                    >
                      Create category
                    </Button>
                  </div>
                ))}
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onPreview}
                  loading={runPreview.isPending}
                >
                  Re-run preview with remaps
                </Button>
              </div>
            ) : null}

            <div className="overflow-x-auto rounded-md border border-[var(--border-default)]">
              <table className="w-full min-w-[32rem] text-left text-sm">
                <thead className="bg-[var(--surface-base)] text-xs uppercase text-[var(--text-secondary)]">
                  <tr>
                    <th className="px-2 py-2">#</th>
                    <th className="px-2 py-2">Date</th>
                    <th className="px-2 py-2">Type</th>
                    <th className="px-2 py-2">Category</th>
                    <th className="px-2 py-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.sampleReady.map((row) => (
                    <tr
                      key={row.rowNumber}
                      className="border-t border-[var(--border-default)]"
                    >
                      <td className="px-2 py-1.5">{row.rowNumber}</td>
                      <td className="px-2 py-1.5">{row.date}</td>
                      <td className="px-2 py-1.5">{row.type}</td>
                      <td className="px-2 py-1.5">{row.categoryName}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums">
                        {row.amount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {preview.failed.length > 0 ? (
              <div className="text-sm">
                <p className="font-medium mb-1">Failed rows (sample)</p>
                <ul className="list-disc pl-5 text-[var(--text-secondary)] space-y-0.5">
                  {preview.failed.slice(0, 8).map((f) => (
                    <li key={`${f.rowNumber}-${f.reason}`}>
                      Row {f.rowNumber}: {f.reason}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                onClick={() => setStep("map")}
                type="button"
              >
                Back to mapping
              </Button>
              <Button
                onClick={onCommit}
                loading={commit.isPending}
                disabled={!canCommit}
              >
                Commit import
              </Button>
            </div>
          </div>
        ) : null}

        {step === "done" ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm">
              Imported{" "}
              <strong className="text-[var(--type-income)]">
                {createdCount}
              </strong>{" "}
              transactions with source <code>csv_import</code>.
            </p>
            <Button
              variant="secondary"
              onClick={() => {
                setStep("upload");
                setBatch(null);
                setPreview(null);
                setRemaps([]);
              }}
            >
              Import another file
            </Button>
          </div>
        ) : null}

        {error ? (
          <p className="text-sm text-[var(--budget-over)]">{error}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}

function StepIndicator({ step }: { step: Step }) {
  const steps: Step[] = ["upload", "map", "preview", "done"];
  return (
    <ol className="flex flex-wrap gap-2 text-xs">
      {steps.map((s) => (
        <li
          key={s}
          className={
            s === step
              ? "rounded-full bg-[var(--brand-primary)] px-2.5 py-1 text-white"
              : "rounded-full bg-[var(--surface-base)] border border-[var(--border-default)] px-2.5 py-1 text-[var(--text-secondary)]"
          }
        >
          {s}
        </li>
      ))}
    </ol>
  );
}
