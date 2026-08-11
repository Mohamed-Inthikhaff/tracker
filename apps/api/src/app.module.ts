import { Module } from "@nestjs/common";
import { HealthController } from "./health.controller";

/**
 * Root Nest module. Feature modules (auth, households, transactions, …)
 * are added in later Phase 0 prompts — not in scaffold.
 */
@Module({
  controllers: [HealthController],
})
export class AppModule {}
