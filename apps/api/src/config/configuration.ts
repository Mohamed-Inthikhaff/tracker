import { registerAs } from "@nestjs/config";

export const databaseConfig = registerAs("database", () => ({
  host: process.env.DB_HOST ?? "localhost",
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USER ?? "postgres",
  password: process.env.DB_PASSWORD ?? "postgres",
  name: process.env.DB_NAME ?? "expense_tracker",
  /** Local only — prefer migrations in shared environments (impl plan §8.2). */
  synchronize: process.env.TYPEORM_SYNC === "true",
  logging: process.env.TYPEORM_LOGGING === "true",
}));

export const geminiConfig = registerAs("gemini", () => ({
  apiKey: process.env.GEMINI_API_KEY ?? "",
  /** Text category suggestion + Phase 2 receipt option. */
  model: process.env.GEMINI_MODEL ?? "gemini-2.5-flash-lite",
  /** FR-CAT-004 high-confidence preselect threshold. */
  highConfidenceThreshold: Number(
    process.env.CLASSIFICATION_HIGH_CONFIDENCE ?? 0.85
  ),
  fewShotLimit: Number(process.env.CLASSIFICATION_FEW_SHOT_LIMIT ?? 8),
}));

export default [databaseConfig, geminiConfig];
