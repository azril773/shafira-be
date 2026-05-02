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
import { checkSchema, param, query } from "express-validator";
import { TransactionService } from "@services/transaction.service";
import { AuthService } from "@services/auth.service";
import { Transaction } from "@models/transaction.model";
import {
  CreateTransactionBody,
  createTransactionSchema,
  RefundTransactionBody,
  refundTransactionSchema,
} from "types/transaction_type";
import { UUID } from "types/common_type";
import {
  handleControllerError,
  UnauthorizedError,
  validateRequest,
} from "@errors/custom_error";

@Route("transactions")
@Tags("Transactions")
export class TransactionController extends Controller {
  private transactionService = new TransactionService();
  private authService = new AuthService();

  @Post("")
  @Middlewares(checkSchema(createTransactionSchema))
  public async createTransaction(
    @Body() body: CreateTransactionBody,
    @Request() req: ExRequest,
    @Res() defaultErrorResponse: TsoaResponse<500, { message: string }>,
  ): Promise<Transaction> {
    try {
      validateRequest(req);
      const token = req.cookies.access_token;
      const user = await this.authService.getUserByToken(token as string);
      if (!user) throw new UnauthorizedError("user tidak ada");
      return await this.transactionService.createTransaction(body, user);
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
    query("transactionNo").trim().escape().optional({ values: "undefined" }),
    query("barcode").trim().escape().optional({ values: "undefined" }),
    query("date")
      .trim()
      .escape()
      .isISO8601()
      .optional({ values: "undefined" }),
  ])
  public async searchTransactions(
    @Request() req: ExRequest,
    @Res() defaultErrorResponse: TsoaResponse<500, { message: string }>,
    @Query() page?: string,
    @Query() status?: string,
    @Query() transactionNo?: string,
    @Query() date?: string,
    @Query() barcode?: string,
  ): Promise<{ transactions: Transaction[]; totalPages: number }> {
    try {
      validateRequest(req);
      const token = req.cookies.access_token;
      const user = await this.authService.getUserByToken(token as string);
      if (!user) throw new UnauthorizedError("user tidak ada");
      return await this.transactionService.searchTransactions({
        page: page ? parseInt(page, 10) : 1,
        status,
        transactionNo,
        date,
        barcode,
      });
    } catch (error) {
      // @ts-expect-error TsoaResponse any return type
      return handleControllerError(error, { defaultErrorResponse });
    }
  }

  @Get("{id}")
  @Middlewares([param("id").trim().escape().isUUID()])
  public async getTransactionById(
    @Path() id: UUID,
    @Request() req: ExRequest,
    @Res() defaultErrorResponse: TsoaResponse<500, { message: string }>,
  ): Promise<Transaction> {
    try {
      validateRequest(req);
      const token = req.cookies.access_token;
      const user = await this.authService.getUserByToken(token as string);
      if (!user) throw new UnauthorizedError("user tidak ada");
      return await this.transactionService.getTransactionById(id);
    } catch (error) {
      // @ts-expect-error TsoaResponse any return type
      return handleControllerError(error, { defaultErrorResponse });
    }
  }

  @Put("{id}/void")
  @Middlewares([param("id").trim().escape().isUUID()])
  public async voidTransaction(
    @Path() id: UUID,
    @Request() req: ExRequest,
    @Res() defaultErrorResponse: TsoaResponse<500, { message: string }>,
  ): Promise<Transaction> {
    try {
      validateRequest(req);
      const token = req.cookies.access_token;
      const user = await this.authService.getUserByToken(token as string);
      if (!user) throw new UnauthorizedError("user tidak ada");
      return await this.transactionService.voidTransaction(id, user);
    } catch (error) {
      // @ts-expect-error TsoaResponse any return type
      return handleControllerError(error, { defaultErrorResponse });
    }
  }

  @Put("{id}/refund")
  @Middlewares([
    param("id").trim().escape().isUUID(),
    checkSchema(refundTransactionSchema),
  ])
  public async refundTransaction(
    @Path() id: UUID,
    @Body() body: RefundTransactionBody,
    @Request() req: ExRequest,
    @Res() defaultErrorResponse: TsoaResponse<500, { message: string }>,
  ): Promise<Transaction> {
    try {
      validateRequest(req);
      const token = req.cookies.access_token;
      const user = await this.authService.getUserByToken(token as string);
      if (!user) throw new UnauthorizedError("user tidak ada");
      return await this.transactionService.refundTransaction(id, body, user);
    } catch (error) {
      // @ts-expect-error TsoaResponse any return type
      return handleControllerError(error, { defaultErrorResponse });
    }
  }
}
