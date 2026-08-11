import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from "@nestjs/core";
import { AuthGuard } from "./common/guards/auth.guard";
import { HouseholdScopeGuard } from "./common/guards/household-scope.guard";
import { HouseholdContextInterceptor } from "./common/interceptors/household-context.interceptor";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { ZodValidationPipe } from "./common/pipes/zod-validation.pipe";
import databaseConfig from "./config/configuration";
import { HealthController } from "./health.controller";
import { HouseholdsModule } from "./modules/households/households.module";
import { CategoriesModule } from "./modules/categories/categories.module";
import { Household } from "./modules/households/entities/household.entity";
import { HouseholdMember } from "./modules/households/entities/household-member.entity";
import { HouseholdInvite } from "./modules/households/entities/household-invite.entity";
import { User } from "./modules/households/entities/user.entity";
import { Category } from "./modules/categories/entities/category.entity";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: "postgres" as const,
        host: config.get<string>("database.host"),
        port: config.get<number>("database.port"),
        username: config.get<string>("database.username"),
        password: config.get<string>("database.password"),
        database: config.get<string>("database.name"),
        entities: [
          Household,
          HouseholdMember,
          HouseholdInvite,
          User,
          Category,
        ],
        migrations: [__dirname + "/database/migrations/*{.ts,.js}"],
        synchronize: config.get<boolean>("database.synchronize") ?? false,
        logging: config.get<boolean>("database.logging") ?? false,
      }),
    }),
    HouseholdsModule,
    CategoriesModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: HouseholdScopeGuard },
    { provide: APP_INTERCEPTOR, useClass: HouseholdContextInterceptor },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    { provide: APP_PIPE, useClass: ZodValidationPipe },
  ],
})
export class AppModule {}
