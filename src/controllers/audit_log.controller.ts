import { handleControllerError, validateRequest } from "@errors/custom_error";
import { AuditLog } from "@models/audit_log.model";
import { AuditLogService } from "@services/audit_log.service";
import { ADMIN, CASHIER, INVENTORY_MANAGER, VERIF_ADMIN } from "@constants/user";
import { Request as ExRequest } from "express";
import { checkSchema } from "express-validator";
import {
  Body,
  Controller,
  Get,
  Middlewares,
  Post,
  Query,
  Request,
  Res,
  Route,
  Tags,
  TsoaResponse,
} from "tsoa";
import { CreateAuditLogBody, createAuditLogSchema } from "types/audit_log";
import { checkRole } from "utils/middleware";

@Route("audit-logs")
@Tags("AuditLog")
export class AuditLogController extends Controller {
  private service = new AuditLogService();

  @Post()
  @Middlewares(checkSchema(createAuditLogSchema))
  public async create(
    @Body() body: CreateAuditLogBody,
    @Request() req: ExRequest,
    @Res() defaultErrorResponse: TsoaResponse<500, { message: string }>,
  ): Promise<AuditLog> {
    try {
      validateRequest(req);
      const { user } = await checkRole(req, ADMIN, CASHIER, INVENTORY_MANAGER, VERIF_ADMIN);
      return await this.service.createLog(user, body);
    } catch (error) {
      // @ts-expect-error TsoaResponse any return type
      return handleControllerError(error, { defaultErrorResponse });
    }
  }

  @Get()
  public async list(
    @Request() req: ExRequest,
    @Res() defaultErrorResponse: TsoaResponse<500, { message: string }>,
    @Query() page = 1,
    @Query() action?: string,
  ): Promise<{ logs: AuditLog[]; totalPages: number }> {
    try {
      await checkRole(req, ADMIN, VERIF_ADMIN);
      return await this.service.listLogs({ page: Number(page) || 1, action });
    } catch (error) {
      // @ts-expect-error TsoaResponse any return type
      return handleControllerError(error, { defaultErrorResponse });
    }
  }
}
