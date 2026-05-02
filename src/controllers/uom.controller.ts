import {
  Body,
  Controller,
  Delete,
  Get,
  Middlewares,
  Path,
  Post,
  Put,
  Request,
  Res,
  Route,
  Tags,
  TsoaResponse,
} from "tsoa";
import { Request as ExRequest } from "express";
import { checkSchema, param } from "express-validator";
import { Uom } from "@models/uom.model";
import { UomService } from "@services/uom.service";
import { UomBody, uomSchema } from "types/uom";
import { UUID } from "types/common_type";
import { handleControllerError, validateRequest } from "@errors/custom_error";
import { checkRole } from "utils/middleware";
import { ADMIN, CASHIER } from "@constants/user";

@Route("uoms")
@Tags("Uoms")
export class UomController extends Controller {
  private service = new UomService();

  @Get("")
  public async list(
    @Request() req: ExRequest,
    @Res() defaultErrorResponse: TsoaResponse<500, { message: string }>,
  ): Promise<Uom[]> {
    try {
      await checkRole(req, ADMIN, CASHIER);
      return await this.service.list();
    } catch (error) {
      // @ts-expect-error TsoaResponse any return type
      return handleControllerError(error, { defaultErrorResponse });
    }
  }

  @Post("")
  @Middlewares([checkSchema(uomSchema)])
  public async create(
    @Body() body: UomBody,
    @Request() req: ExRequest,
    @Res() defaultErrorResponse: TsoaResponse<500, { message: string }>,
  ): Promise<Uom> {
    try {
      validateRequest(req);
      await checkRole(req, ADMIN);
      return await this.service.create(body);
    } catch (error) {
      // @ts-expect-error TsoaResponse any return type
      return handleControllerError(error, { defaultErrorResponse });
    }
  }

  @Put("{id}")
  @Middlewares([param("id").trim().escape().isUUID(), checkSchema(uomSchema)])
  public async update(
    @Path() id: UUID,
    @Body() body: UomBody,
    @Request() req: ExRequest,
    @Res() defaultErrorResponse: TsoaResponse<500, { message: string }>,
  ): Promise<Uom> {
    try {
      validateRequest(req);
      await checkRole(req, ADMIN);
      return await this.service.update(id, body);
    } catch (error) {
      // @ts-expect-error TsoaResponse any return type
      return handleControllerError(error, { defaultErrorResponse });
    }
  }

  @Delete("{id}")
  @Middlewares([param("id").trim().escape().isUUID()])
  public async remove(
    @Path() id: UUID,
    @Request() req: ExRequest,
    @Res() defaultErrorResponse: TsoaResponse<500, { message: string }>,
  ): Promise<{ message: string }> {
    try {
      validateRequest(req);
      await checkRole(req, ADMIN);
      await this.service.remove(id);
      return { message: "UoM berhasil dihapus." };
    } catch (error) {
      // @ts-expect-error TsoaResponse any return type
      return handleControllerError(error, { defaultErrorResponse });
    }
  }
}
