import dataSource from "@config/database";
import { Product } from "@models/product.model";
import { Transaction } from "@models/transaction.model";
import { TransactionDetail } from "@models/transaction_detail.model";
import { User } from "@models/user.model";
import { TransactionBody } from "types/transaction_type";
import { In } from "typeorm";

export class TransactionService {
  public async createTransaction(
    body: TransactionBody,
    user: User,
  ): Promise<Transaction> {
    return await dataSource.transaction(async (transactionalEntityManager) => {
      const date = new Date();
      const transaction = new Transaction();
      const products = await transactionalEntityManager.find(Product, {
        where: {
          id: In(body.transactionDetails.map((detail) => detail.product_id)),
        },
      });
      transaction.cashierId = user.id;
      transaction.createdAt = date;
      transaction.updatedAt = date;
      transaction.transactionNo = `TRX-${Date.now()}`;
      const transactionDetails: TransactionDetail[] = [];
      for (const transactionDetail of body.transactionDetails) {
        const newTransactionDetail = new TransactionDetail();
        const product = products.find(
          (p) => p.id === transactionDetail.product_id,
        );
        if (!product) {
          throw new Error(
            `Product with id ${transactionDetail.product_id} not found`,
          );
        }
        if (product.stock < transactionDetail.qty) {
          throw new Error(`Insufficient stock for product ${product.name}`);
        }
        product.stock -= transactionDetail.qty;
        await transactionalEntityManager.save(product);
        newTransactionDetail.productId = product.id;
        newTransactionDetail.historicalName = product.name;
        newTransactionDetail.historicalBarcode = product.barcode;
        newTransactionDetail.historicalCode = product.code;
        newTransactionDetail.historicalPrice = 0;
        newTransactionDetail.historicalCategory = product.category;
        newTransactionDetail.qty = transactionDetail.qty;
        transactionDetails.push(newTransactionDetail);
      }
      transaction.transactionDetails = transactionDetails;
      transaction.totalPrice = transactionDetails.reduce(
        (total, detail) => total + detail.historicalPrice * detail.qty,
        0,
      );
      transaction.totalQty = transactionDetails.reduce(
        (total, detail) => total + detail.qty,
        0,
      );
      return await transactionalEntityManager.save(transaction);
    });
  }
}
