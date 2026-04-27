import dataSource from "@config/database";
import { Product } from "@models/product.model";
import { Transaction } from "@models/transaction.model";
import { TransactionDetail } from "@models/transaction_detail.model";
import { User } from "@models/user.model";
import {
  CreateTransactionBody,
  RefundTransactionBody,
} from "types/transaction_type";
import { Between, In } from "typeorm";
import { UUID } from "types/common_type";

export const TRX_POSTED = "POSTED";
export const TRX_VOIDED = "VOIDED";
export const TRX_REFUNDED = "REFUNDED";

export class TransactionService {
  public async createTransaction(
    body: CreateTransactionBody,
    user: User,
  ): Promise<Transaction> {
    return await dataSource.transaction(async (manager) => {
      if (!body.transactionDetails?.length) {
        throw new Error("Transaksi harus memiliki minimal satu produk.");
      }

      const productIds = Array.from(
        new Set(body.transactionDetails.map((d) => d.productId)),
      );
      const products = await manager.find(Product, {
        where: { id: In(productIds) },
        relations: { prices: true },
      });

      const aggregatedQty = new Map<string, number>();
      for (const d of body.transactionDetails) {
        aggregatedQty.set(
          d.productId,
          (aggregatedQty.get(d.productId) ?? 0) + d.qty,
        );
      }

      for (const [pid, totalQty] of aggregatedQty) {
        const product = products.find((p) => p.id === pid);
        if (!product) throw new Error("Produk tidak ditemukan.");
        if (product.stock < totalQty) {
          throw new Error(`Stok tidak cukup untuk produk ${product.name}.`);
        }
      }

      const transaction = new Transaction();
      transaction.cashierId = user.id;
      transaction.transactionNo = `TRX-${Date.now()}`;
      transaction.status = TRX_POSTED;
      transaction.paymentMethod = body.paymentMethod;
      transaction.totalPrice = 0;
      transaction.totalQty = 0;
      transaction.cashAmount = 0;
      transaction.changeAmount = 0;
      const savedTransaction = await manager.save(transaction);

      const details: TransactionDetail[] = [];
      let totalPrice = 0;
      let totalQty = 0;

      for (const d of body.transactionDetails) {
        const product = products.find((p) => p.id === d.productId)!;
        const priceOption = product.prices?.find(
          (p) => p.name === d.priceName,
        );
        if (!priceOption) {
          throw new Error(
            `Harga "${d.priceName}" tidak ditemukan untuk produk ${product.name}.`,
          );
        }

        const detail = new TransactionDetail();
        detail.transactionId = savedTransaction.id;
        detail.productId = product.id;
        detail.historicalName = product.name;
        detail.historicalBarcode = product.barcode;
        detail.historicalCode = product.code;
        detail.historicalCategory = product.category;
        detail.historicalPriceName = priceOption.name;
        detail.historicalPrice = Number(priceOption.price);
        detail.qty = d.qty;
        detail.isRefund = false;
        details.push(detail);

        totalPrice += Number(priceOption.price) * d.qty;
        totalQty += d.qty;
      }

      for (const [pid, qty] of aggregatedQty) {
        const product = products.find((p) => p.id === pid)!;
        product.stock -= qty;
      }
      await manager.save(products);
      await manager.save(details);

      savedTransaction.totalPrice = totalPrice;
      savedTransaction.totalQty = totalQty;
      savedTransaction.cashAmount = Number(body.cashAmount ?? 0);
      savedTransaction.changeAmount = Math.max(
        0,
        Number(body.cashAmount ?? 0) - totalPrice,
      );
      await manager.save(savedTransaction);

      return await manager.findOneOrFail(Transaction, {
        where: { id: savedTransaction.id },
        relations: { transactionDetails: true, cashier: true },
      });
    });
  }

  public async getTransactionById(id: UUID): Promise<Transaction> {
    const trx = await dataSource.getRepository(Transaction).findOne({
      where: { id },
      relations: { transactionDetails: true, cashier: true },
    });
    if (!trx) throw new Error("Transaksi tidak ditemukan.");
    return trx;
  }

  public async searchTransactions({
    page,
    status,
    transactionNo,
    date,
  }: {
    page: number;
    status?: string;
    transactionNo?: string;
    date?: string;
  }): Promise<{ transactions: Transaction[]; totalPages: number }> {
    const limit = 10;
    const offset = (page - 1) * limit;
    const repo = dataSource.getRepository(Transaction);
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (transactionNo) where.transactionNo = transactionNo;
    if (date) {
      const start = new Date(date);
      const end = new Date(date);
      end.setDate(end.getDate() + 1);
      where.createdAt = Between(start, end);
    }
    const [transactions, total] = await repo.findAndCount({
      where,
      order: { createdAt: "DESC" },
      relations: { transactionDetails: true, cashier: true },
      skip: offset,
      take: limit,
    });
    return { transactions, totalPages: Math.ceil(total / limit) };
  }

  public async voidTransaction(id: UUID): Promise<Transaction> {
    return await dataSource.transaction(async (manager) => {
      const trx = await manager.findOne(Transaction, {
        where: { id },
        relations: { transactionDetails: true },
      });
      if (!trx) throw new Error("Transaksi tidak ditemukan.");
      if (trx.status !== TRX_POSTED) {
        throw new Error("Hanya transaksi POSTED yang dapat dibatalkan.");
      }

      const details = trx.transactionDetails ?? [];
      const productIds = details.map((d) => d.productId);
      const products = await manager.find(Product, {
        where: { id: In(productIds) },
      });
      const productMap = new Map(products.map((p) => [p.id, p]));

      for (const detail of details) {
        if (detail.isRefund) continue;
        const product = productMap.get(detail.productId);
        if (product) product.stock += detail.qty;
      }
      await manager.save(Array.from(productMap.values()));

      trx.status = TRX_VOIDED;
      return await manager.save(trx);
    });
  }

  public async refundTransaction(
    id: UUID,
    body: RefundTransactionBody,
  ): Promise<Transaction> {
    return await dataSource.transaction(async (manager) => {
      const trx = await manager.findOne(Transaction, {
        where: { id },
        relations: { transactionDetails: true },
      });
      if (!trx) throw new Error("Transaksi tidak ditemukan.");
      if (trx.status === TRX_VOIDED) {
        throw new Error("Transaksi sudah dibatalkan.");
      }

      const details = trx.transactionDetails ?? [];
      const targets = details.filter((d) => body.detailIds.includes(d.id));
      if (targets.length !== body.detailIds.length) {
        throw new Error("Beberapa item retur tidak ditemukan pada transaksi.");
      }
      if (targets.some((d) => d.isRefund)) {
        throw new Error("Beberapa item sudah pernah diretur.");
      }

      const productIds = targets.map((d) => d.productId);
      const products = await manager.find(Product, {
        where: { id: In(productIds) },
      });
      const productMap = new Map(products.map((p) => [p.id, p]));

      let refundedAmount = 0;
      let refundedQty = 0;
      for (const detail of targets) {
        detail.isRefund = true;
        detail.refundReason = body.reason;
        const product = productMap.get(detail.productId);
        if (product) product.stock += detail.qty;
        refundedAmount += Number(detail.historicalPrice) * detail.qty;
        refundedQty += detail.qty;
      }
      await manager.save(Array.from(productMap.values()));
      await manager.save(targets);

      trx.totalPrice = Number(trx.totalPrice) - refundedAmount;
      trx.totalQty = trx.totalQty - refundedQty;

      const allRefunded = details.every(
        (d) => d.isRefund || body.detailIds.includes(d.id),
      );
      if (allRefunded) trx.status = TRX_REFUNDED;
      await manager.save(trx);

      return await manager.findOneOrFail(Transaction, {
        where: { id: trx.id },
        relations: { transactionDetails: true, cashier: true },
      });
    });
  }
}
