import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ClassificationExample } from "./entities/classification-example.entity";

@Injectable()
export class ClassificationRepository {
  constructor(
    @InjectRepository(ClassificationExample)
    private readonly examples: Repository<ClassificationExample>
  ) {}

  findRecentExamples(
    householdId: string,
    limit: number
  ): Promise<ClassificationExample[]> {
    return this.examples.find({
      where: { householdId },
      order: { createdAt: "DESC" },
      take: limit,
      relations: { category: true },
    });
  }

  createExample(data: {
    householdId: string;
    description: string;
    categoryId: string;
    userAccepted: boolean;
    suggestedCategoryId: string | null;
  }): Promise<ClassificationExample> {
    return this.examples.save(this.examples.create(data));
  }
}
