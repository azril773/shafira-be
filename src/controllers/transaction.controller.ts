import { Transaction } from "@models/transaction.model";
import {
  Body,
  Middlewares,
  Post,
  Request,
  Res,
  Route,
  TsoaResponse,
} from "tsoa";
import { Request as ExRequest } from "express";
import { validationResult } from "express-validator";
import { TransactionBody, TransactionSchema } from "types/transaction_type";
import { TransactionService } from "@services/transaction.service";
import { checkRole } from "utils/middleware";
import { ADMIN, CASHIER } from "@constants/user";

@Route("transactions")
export class TransactionController {
  private transactionService = new TransactionService();

  // @Post("")
  // @Middlewares(TransactionSchema)
  // public async createTransaction(
  //   @Body() body: TransactionBody,
  //   @Request() req: ExRequest,
  //   @Res() defaultErrorResponse: TsoaResponse<500, { message: string }>,
  // ): Promise<Transaction> {
  //   try {
  //     validationResult(req);
  //     const { payload: _, user } = await checkRole(req, CASHIER);
  //     return await this.transactionService.createTransaction(body, user);
  //   } catch (error) {
  //     // @ts-expect-error TsoaResponse any return type
  //     return handleControllerError(error, { defaultErrorResponse });
  //   }
  // }
}
