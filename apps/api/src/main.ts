import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  // rawBody required for Stripe webhook signature verification (FR-BILL-003).
  const app = await NestFactory.create(AppModule, { rawBody: true });
  const port = process.env.PORT ? Number(process.env.PORT) : 3001;
  await app.listen(port);
  console.log(`API listening on http://localhost:${port}`);
}

void bootstrap();
