import {
  Route,
} from "tsoa";
import { TransactionService } from "@services/transaction.service";

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
