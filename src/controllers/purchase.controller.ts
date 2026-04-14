import { AuthService } from "@services/auth.service";
import { PurchaseService } from "@services/purchase.service";
import {
  Body,
  Controller,
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
import {
  handleControllerError,
  UnauthorizedError,
  validateRequest,
} from "@errors/custom_error";
import { checkSchema, param } from "express-validator";
import {
  ChangeStatusPurchase,
  changeStatusPurchaseSchema,
  CreatePurchase,
  createPurchaseSchema,
  UpdatePurchase,
  updatePurchaseSchema,
} from "types/purchase.type";
import { Purchase } from "@models/purchase.model";
import { UUID } from "types/common_type";

@Route("purchases")
@Tags("Purchases")
export class PurchaseController extends Controller {
  private purchaseService = new PurchaseService();
  private authService = new AuthService();

  @Post("")
  @Middlewares(checkSchema(createPurchaseSchema))
  public async createPurchase(
    @Body() body: CreatePurchase,
    @Request() req: ExRequest,
    @Res() defaultErrorResponse: TsoaResponse<500, { message: string }>,
  ): Promise<Purchase> {
    try {
      validateRequest(req);
      const token = req.cookies.access_token;
      const user = await this.authService.getUserByToken(token as string);
      if (!user) throw new UnauthorizedError("user tidak ada");
      return await this.purchaseService.createPurchase(user, body);
    } catch (error) {
      // @ts-expect-error TsoaResponse any return type
      return handleControllerError(error, { defaultErrorResponse });
    }
  }

  @Put("change-status")
  @Middlewares(checkSchema(changeStatusPurchaseSchema))
  public async updateStatus(
    @Body() body: ChangeStatusPurchase,
    @Request() req: ExRequest,
    @Res() defaultErrorResponse: TsoaResponse<500, { message: string }>,
  ): Promise<Purchase> {
    try {
      validateRequest(req);
      const token = req.cookies.access_token;
      const user = await this.authService.getUserByToken(token as string);
      if (!user) throw new UnauthorizedError("user tidak ada");
      return await this.purchaseService.updateStatus(user, body);
    } catch (error) {
      // @ts-expect-error TsoaResponse any return type
      return handleControllerError(error, { defaultErrorResponse });
    }
  }

  @Put("{id}")
  @Middlewares([
    param("id").trim().escape().isUUID(),
    checkSchema(updatePurchaseSchema),
  ])
  public async updatePurchase(
    @Path() id: UUID,
    @Body() body: UpdatePurchase,
    @Request() req: ExRequest,
    @Res() defaultErrorResponse: TsoaResponse<500, { message: string }>,
  ): Promise<Purchase> {
    try {
      validateRequest(req);
      const token = req.cookies.access_token;
      const user = await this.authService.getUserByToken(token as string);
      if (!user) throw new UnauthorizedError("user tidak ada");
      return await this.purchaseService.updatePurchase(user, id, body);
    } catch (error) {
      // @ts-expect-error TsoaResponse any return type
      return handleControllerError(error, { defaultErrorResponse });
    }
  }
}
