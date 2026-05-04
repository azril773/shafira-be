import { AuthService } from "@services/auth.service";
import { PurchaseService } from "@services/purchase.service";
import {
  Body,
  Controller,
  Get,
  Middlewares,
  Path,
  Post,
  Put,
  Query,
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
import { checkSchema, param, query } from "express-validator";
import {
  ChangeStatusPurchase,
  changeStatusPurchaseSchema,
  CreatePurchase,
  createPurchaseSchema,
  ReturnPurchaseItemsBody,
  returnPurchaseItemsSchema,
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
  @Get("")
  @Middlewares([
    query("page")
      .trim()
      .escape()
      .isInt({ min: 1 })
      .optional({ values: "undefined" }),
    query("status").trim().escape().optional({ values: "undefined" }),
    query("vendorId")
      .trim()
      .escape()
      .isUUID()
      .optional({ values: "undefined" }),
    query("productId")
      .trim()
      .escape()
      .isUUID()
      .optional({ values: "undefined" }),
    query("purchaseDate")
      .trim()
      .escape()
      .isISO8601()
      .optional({ values: "undefined" }),
  ])
  public async searchPurchase(
    @Request() req: ExRequest,
    @Res() defaultErrorResponse: TsoaResponse<500, { message: string }>,
    @Query() page?: string,
    @Query() status?: string,
    @Query() vendorId?: UUID,
    @Query() productId?: UUID,
    @Query() purchaseDate?: string,
  ): Promise<{ purchases: Purchase[]; totalPages: number }> {
    try {
      validateRequest(req);
      const token = req.cookies.access_token;
      const user = await this.authService.getUserByToken(token as string);
      if (!user) throw new UnauthorizedError("user tidak ada");
      return await this.purchaseService.searchPurchases({
        page: page ? parseInt(page, 10) : 1,
        status,
        vendorId,
        productId,
        purchaseDate,
      });
    } catch (error) {
      // @ts-expect-error TsoaResponse any return type
      return handleControllerError(error, { defaultErrorResponse });
    }
  }

  @Get("{id}")
  @Middlewares([param("id").trim().escape().isUUID()])
  public async getPurchaseById(
    @Path() id: UUID,
    @Request() req: ExRequest,
    @Res() defaultErrorResponse: TsoaResponse<500, { message: string }>,
  ): Promise<Purchase> {
    try {
      validateRequest(req);
      const token = req.cookies.access_token;
      const user = await this.authService.getUserByToken(token as string);
      if (!user) throw new UnauthorizedError("user tidak ada");
      return await this.purchaseService.getPurchaseById(id);
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

  @Put("{id}/return-items")
  @Middlewares([
    param("id").trim().escape().isUUID(),
    checkSchema(returnPurchaseItemsSchema),
  ])
  public async returnPurchaseItems(
    @Path() id: UUID,
    @Body() body: ReturnPurchaseItemsBody,
    @Request() req: ExRequest,
    @Res() defaultErrorResponse: TsoaResponse<500, { message: string }>,
  ): Promise<Purchase> {
    try {
      validateRequest(req);
      const token = req.cookies.access_token;
      const user = await this.authService.getUserByToken(token as string);
      if (!user) throw new UnauthorizedError("user tidak ada");
      return await this.purchaseService.returnPurchaseItems(user, id, body);
    } catch (error) {
      // @ts-expect-error TsoaResponse any return type
      return handleControllerError(error, { defaultErrorResponse });
    }
  }
}
