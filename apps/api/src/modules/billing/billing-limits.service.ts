import { ForbiddenException, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { TransactionsRepository } from "../transactions/transactions.repository";
import { BillingRepository } from "./billing.repository";
import {
  currentMonthKey,
  freePlanLimits,
  hasPaidAccess,
  monthDateBounds,
  proPlanLimits,
  type PlanLimits,
} from "./plan-catalog";
import { Subscription } from "./entities/subscription.entity";

/** FR-BILL-007 — free/pro limit resolution and enforcement. */
@Injectable()
export class BillingLimitsService {
  constructor(
    private readonly repo: BillingRepository,
    private readonly transactions: TransactionsRepository,
    private readonly config: ConfigService
  ) {}

  async resolveLimits(householdId: string): Promise<PlanLimits> {
    return this.limitsForSub(await this.repo.ensureFreeRow(householdId));
  }

  limitsForSub(sub: Subscription): PlanLimits {
    const freeTx =
      this.config.get<number>("stripe.freeMonthlyTransactions") ?? 100;
    const freeOcr = this.config.get<number>("stripe.freeMonthlyOcr") ?? 0;
    const proOcr = this.config.get<number>("stripe.proMonthlyOcr") ?? 200;
    if (
      hasPaidAccess({
        status: sub.status,
        currentPeriodEnd: sub.currentPeriodEnd,
      })
    ) {
      return proPlanLimits(proOcr);
    }
    return freePlanLimits(freeTx, freeOcr);
  }

  async assertCanCreateTransaction(householdId: string): Promise<void> {
    const limits = await this.resolveLimits(householdId);
    if (limits.monthlyTransactionLimit === null) return;

    const month = currentMonthKey();
    const { start, endInclusive } = monthDateBounds(month);
    const used = await this.transactions.countByHouseholdAndRange(
      householdId,
      start,
      endInclusive
    );
    if (used >= limits.monthlyTransactionLimit) {
      throw new ForbiddenException(
        `Free tier limit of ${limits.monthlyTransactionLimit} transactions this month reached. Upgrade to Pro to continue.`
      );
    }
  }

  async assertCanRunOcr(householdId: string): Promise<void> {
    const sub = await this.repo.ensureFreeRow(householdId);
    const limits = this.limitsForSub(sub);
    if (!limits.receiptOcr) {
      throw new ForbiddenException("Receipt OCR requires a Pro plan");
    }
    if (limits.monthlyOcrLimit === null) return;
    const month = currentMonthKey();
    const count = sub.ocrUsageMonth === month ? sub.ocrUsageCount : 0;
    if (count >= limits.monthlyOcrLimit) {
      throw new ForbiddenException(
        `OCR scan limit of ${limits.monthlyOcrLimit} for this month reached`
      );
    }
  }

  async recordOcrUse(householdId: string): Promise<void> {
    const sub = await this.repo.ensureFreeRow(householdId);
    const month = currentMonthKey();
    if (sub.ocrUsageMonth !== month) {
      sub.ocrUsageMonth = month;
      sub.ocrUsageCount = 0;
    }
    sub.ocrUsageCount += 1;
    await this.repo.saveSubscription(sub);
  }

  async usageSnapshot(sub: Subscription): Promise<{
    month: string;
    transactionsCreated: number;
    ocrScans: number;
  }> {
    const month = currentMonthKey();
    const { start, endInclusive } = monthDateBounds(month);
    const transactionsCreated =
      await this.transactions.countByHouseholdAndRange(
        sub.householdId,
        start,
        endInclusive
      );
    return {
      month,
      transactionsCreated,
      ocrScans: sub.ocrUsageMonth === month ? sub.ocrUsageCount : 0,
    };
  }
}
