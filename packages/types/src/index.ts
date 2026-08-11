/**
 * Shared types and Zod schemas for api + web/capture.
 */
export type WorkspaceHealth = "ok";

export const WORKSPACE_PLACEHOLDER = "expense-tracker" as const;

export * from "./schemas/household.schema";
export * from "./schemas/category.schema";
export * from "./schemas/transaction.schema";
