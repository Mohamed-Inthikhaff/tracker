import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  // rawBody required for Stripe webhook signature verification (FR-BILL-003).
  const app = await NestFactory.create(AppModule, { rawBody: true });

  // Browser apps (web :3000, capture :3002) call the API cross-origin.
  app.enableCors({
    origin: (
      process.env.CORS_ORIGINS ??
      "http://localhost:3000,http://localhost:3002"
    )
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    credentials: true,
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Household-Id",
      "Stripe-Signature",
    ],
  });

  const port = process.env.PORT ? Number(process.env.PORT) : 3001;
  await app.listen(port);
  console.log(`API listening on http://localhost:${port}`);
}

void bootstrap();
