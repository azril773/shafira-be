import {
  Body,
  Controller,
  Delete,
  Get,
  Middlewares,
  Path,
  Post,
  Request,
  Res,
  Route,
  Tags,
  TsoaResponse,
} from "tsoa";
import { Request as ExRequest } from "express";
import { checkSchema, param } from "express-validator";
import { ADMIN, CASHIER } from "@constants/user";
import { handleControllerError, validateRequest } from "@errors/custom_error";
import { SuspendedCart } from "@models/suspended_cart.model";
import {
  ResumeSuspendedCartResult,
  SuspendedCartService,
} from "@services/suspended_cart.service";
import { UUID } from "types/common_type";
import {
  CreateSuspendedCartBody,
  createSuspendedCartSchema,
  ResumeSuspendedCartBody,
  resumeSuspendedCartSchema,
} from "types/suspended_cart";
import { checkRole } from "utils/middleware";

@Route("suspended-carts")
@Tags("Suspended Carts")
export class SuspendedCartController extends Controller {
  private service = new SuspendedCartService();

  @Get("")
  public async list(
    @Request() req: ExRequest,
    @Res() defaultErrorResponse: TsoaResponse<500, { message: string }>,
  ): Promise<SuspendedCart[]> {
    try {
      const { user } = await checkRole(req, ADMIN, CASHIER);
      return await this.service.list(user);
    } catch (error) {
      // @ts-expect-error TsoaResponse any return type
      return handleControllerError(error, { defaultErrorResponse });
    }
  }

  @Post("")
  @Middlewares(checkSchema(createSuspendedCartSchema))
  public async create(
    @Body() body: CreateSuspendedCartBody,
    @Request() req: ExRequest,
    @Res() defaultErrorResponse: TsoaResponse<500, { message: string }>,
  ): Promise<SuspendedCart> {
    try {
      validateRequest(req);
      const { user } = await checkRole(req, ADMIN, CASHIER);
      return await this.service.create(body, user);
    } catch (error) {
      // @ts-expect-error TsoaResponse any return type
      return handleControllerError(error, { defaultErrorResponse });
    }
  }

  @Post("{id}/resume")
  @Middlewares([
    param("id").trim().escape().isUUID(),
    checkSchema(resumeSuspendedCartSchema),
  ])
  public async resume(
    @Path() id: UUID,
    @Body() body: ResumeSuspendedCartBody,
    @Request() req: ExRequest,
    @Res() defaultErrorResponse: TsoaResponse<500, { message: string }>,
  ): Promise<ResumeSuspendedCartResult> {
    try {
      validateRequest(req);
      const { user } = await checkRole(req, ADMIN, CASHIER);
      return await this.service.resume(id, body, user);
    } catch (error) {
      // @ts-expect-error TsoaResponse any return type
      return handleControllerError(error, { defaultErrorResponse });
    }
  }

  @Delete("{id}")
  @Middlewares(param("id").trim().escape().isUUID())
  public async remove(
    @Path() id: UUID,
    @Request() req: ExRequest,
    @Res() defaultErrorResponse: TsoaResponse<500, { message: string }>,
  ): Promise<{ message: string }> {
    try {
      validateRequest(req);
      const { user } = await checkRole(req, ADMIN, CASHIER);
      await this.service.remove(id, user);
      return { message: "Suspend berhasil dihapus." };
    } catch (error) {
      // @ts-expect-error TsoaResponse any return type
      return handleControllerError(error, { defaultErrorResponse });
    }
  }
}
