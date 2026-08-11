import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import type { DebtDirection } from "@expense-tracker/types";
import { Debt } from "./entities/debt.entity";
import type {
  CreateDebtData,
  UpdateDebtData,
} from "./interfaces/debt.interface";
import { normalizePersonName } from "./debt-window.util";

@Injectable()
export class DebtsRepository {
  constructor(
    @InjectRepository(Debt)
    private readonly repo: Repository<Debt>
  ) {}

  createOne(data: CreateDebtData): Promise<Debt> {
    return this.repo.save(this.repo.create(data));
  }

  findById(householdId: string, id: string): Promise<Debt | null> {
    return this.repo.findOne({ where: { id, householdId } });
  }

  listByHousehold(householdId: string): Promise<Debt[]> {
    return this.repo.find({
      where: { householdId },
      order: { openedDate: "DESC", createdAt: "DESC" },
    });
  }

  /**
   * Same household + normalized person + direction, ordered by open date ASC
   * (needed to compute FR-DEBT-004 windows).
   */
  findSeries(
    householdId: string,
    personName: string,
    direction: DebtDirection
  ): Promise<Debt[]> {
    // Postgres: order by date; filter by lower(trim) in service for series peers
    return this.repo
      .createQueryBuilder("d")
      .where("d.household_id = :householdId", { householdId })
      .andWhere("d.direction = :direction", { direction })
      .andWhere("LOWER(TRIM(d.person_name)) = :person", {
        person: normalizePersonName(personName),
      })
      .orderBy("d.opened_date", "ASC")
      .addOrderBy("d.created_at", "ASC")
      .getMany();
  }

  async updateOne(
    debt: Debt,
    data: UpdateDebtData
  ): Promise<Debt> {
    if (data.personName !== undefined) debt.personName = data.personName;
    if (data.principalAmount !== undefined) {
      debt.principalAmount = data.principalAmount;
    }
    if (data.notes !== undefined) debt.notes = data.notes;
    return this.repo.save(debt);
  }
}
