import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CategoriesModule } from "../categories/categories.module";
import { Household } from "./entities/household.entity";
import { HouseholdMember } from "./entities/household-member.entity";
import { HouseholdInvite } from "./entities/household-invite.entity";
import { User } from "./entities/user.entity";
import { HouseholdsController } from "./households.controller";
import { HouseholdsService } from "./households.service";
import { HouseholdsRepository } from "./households.repository";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Household,
      HouseholdMember,
      HouseholdInvite,
      User,
    ]),
    CategoriesModule,
  ],
  controllers: [HouseholdsController],
  providers: [HouseholdsService, HouseholdsRepository],
  exports: [HouseholdsService, HouseholdsRepository],
})
export class HouseholdsModule {}
