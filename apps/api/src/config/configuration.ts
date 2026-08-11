import { registerAs } from "@nestjs/config";

export default registerAs("database", () => ({
  host: process.env.DB_HOST ?? "localhost",
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USER ?? "postgres",
  password: process.env.DB_PASSWORD ?? "postgres",
  name: process.env.DB_NAME ?? "expense_tracker",
  /** Local only — prefer migrations in shared environments (impl plan §8.2). */
  synchronize: process.env.TYPEORM_SYNC === "true",
  logging: process.env.TYPEORM_LOGGING === "true",
}));
