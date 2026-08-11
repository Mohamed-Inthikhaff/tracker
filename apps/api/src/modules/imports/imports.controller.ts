import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import { CurrentHousehold } from "../../common/decorators/current-household.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import type { JwtUserClaims } from "../../common/interfaces/authenticated-request.interface";
import { CommitImportDto, PreviewImportDto } from "./dto/import.dto";
import { ImportsService } from "./imports.service";

type UploadedCsv = {
  buffer: Buffer;
  originalname: string;
};

@Controller("imports")
export class ImportsController {
  constructor(private readonly imports: ImportsService) {}

  /**
   * FR-IMP-001 — upload a CSV (multipart field `file` or JSON `{ csv, filename }`).
   */
  @Post()
  @UseInterceptors(
    FileInterceptor("file", {
      storage: memoryStorage(),
      limits: { fileSize: 15 * 1024 * 1024 },
    })
  )
  async upload(
    @CurrentHousehold() householdId: string,
    @CurrentUser() user: JwtUserClaims,
    @UploadedFile() file: UploadedCsv | undefined,
    @Body() body: { csv?: string; filename?: string }
  ) {
    const csvText = file
      ? file.buffer.toString("utf8")
      : (body.csv ?? "").toString();
    const filename = file?.originalname ?? body.filename;
    return this.imports.upload(householdId, user.userId, csvText, filename);
  }

  @Get(":id")
  get(
    @CurrentHousehold() householdId: string,
    @Param("id", ParseUUIDPipe) id: string
  ) {
    return this.imports.get(householdId, id);
  }

  /** FR-IMP-002 / FR-IMP-003 — preview with column mapping + category remaps. */
  @Post(":id/preview")
  preview(
    @CurrentHousehold() householdId: string,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: PreviewImportDto
  ) {
    return this.imports.preview(householdId, id, body);
  }

  /** FR-IMP-004 — commit ready rows as transactions with source csv_import. */
  @Post(":id/commit")
  commit(
    @CurrentHousehold() householdId: string,
    @CurrentUser() user: JwtUserClaims,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: CommitImportDto
  ) {
    return this.imports.commit(householdId, user.userId, id, body);
  }
}
