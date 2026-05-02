import dataSource from "@config/database";
import { AuditLog } from "@models/audit_log.model";
import { Product } from "@models/product.model";
import { Transaction } from "@models/transaction.model";
import { TransactionDetail } from "@models/transaction_detail.model";
import { Uom } from "@models/uom.model";
import { User } from "@models/user.model";
import {
  CreateTransactionBody,
  RefundTransactionBody,
  VoidTransactionBody,
} from "types/transaction_type";
import { EntityManager, In } from "typeorm";
import { UUID } from "types/common_type";
import bcrypt from "bcrypt";
import { ADMIN, VERIF_ADMIN } from "@constants/user";

async function resolveVerifier(
  manager: EntityManager,
  username?: string,
  password?: string,
): Promise<UUID | null> {
  if (!username || !password) return null;
  const verifier = await manager.findOne(User, { where: { username } });
  if (!verifier) throw new Error("Verifier tidak ditemukan");
  if (verifier.role !== ADMIN && verifier.role !== VERIF_ADMIN)
    throw new Error("Verifier bukan admin");
  const ok = await bcrypt.compare(password, verifier.password);
  if (!ok) throw new Error("Password verifier salah");
  return verifier.id;
}

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
        relations: { prices: true, uom: true },
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

      const uomIds = Array.from(
        new Set(
          body.transactionDetails
            .map((d) => d.uomId)
            .filter((u): u is string => !!u),
        ),
      );
      const uomList = uomIds.length
        ? await manager.find(Uom, { where: { id: In(uomIds) } })
        : [];
      const uomMap = new Map(uomList.map((u) => [u.id, u]));

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

        const resolvedUomId = d.uomId ?? product.uomId ?? null;
        const resolvedUom = resolvedUomId
          ? (uomMap.get(resolvedUomId) ?? product.uom ?? null)
          : (product.uom ?? null);

        const detail = new TransactionDetail();
        detail.transactionId = savedTransaction.id;
        detail.productId = product.id;
        detail.historicalName = product.name;
        detail.historicalBarcode = product.barcode;
        detail.historicalCode = product.code;
        detail.historicalCategory = product.category;
        detail.historicalPriceName = priceOption.name;
        detail.historicalPrice = Number(priceOption.price);
        detail.uomId = resolvedUomId;
        detail.historicalUomCode = resolvedUom?.code ?? null;
        detail.historicalUomName = resolvedUom?.name ?? null;
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
    barcode,
  }: {
    page: number;
    status?: string;
    transactionNo?: string;
    date?: string;
    barcode?: string;
  }): Promise<{ transactions: Transaction[]; totalPages: number }> {
    const limit = 10;
    const offset = (page - 1) * limit;
    const repo = dataSource.getRepository(Transaction);
    const qb = repo
      .createQueryBuilder("trx")
      .leftJoinAndSelect("trx.transactionDetails", "detail")
      .leftJoinAndSelect("trx.cashier", "cashier")
      .orderBy("trx.createdAt", "DESC");

    if (status) qb.andWhere("trx.status = :status", { status });
    if (transactionNo)
      qb.andWhere("trx.transactionNo ILIKE :tn", { tn: `%${transactionNo}%` });
    if (date) {
      const start = new Date(date);
      const end = new Date(date);
      end.setDate(end.getDate() + 1);
      qb.andWhere("trx.createdAt BETWEEN :start AND :end", { start, end });
    }
    if (barcode) {
      const sub = repo
        .manager
        .getRepository(TransactionDetail)
        .createQueryBuilder("d")
        .select("d.transactionId")
        .where("d.historicalBarcode ILIKE :bc", { bc: `%${barcode}%` });
      qb.andWhere(`trx.id IN (${sub.getQuery()})`).setParameters(
        sub.getParameters(),
      );
    }

    const [transactions, total] = await qb
      .skip(offset)
      .take(limit)
      .getManyAndCount();
    return { transactions, totalPages: Math.ceil(total / limit) };
  }

  public async voidTransaction(
    id: UUID,
    user: User,
    body?: VoidTransactionBody,
  ): Promise<Transaction> {
    return await dataSource.transaction(async (manager) => {
      const trx = await manager.findOne(Transaction, {
        where: { id },
        relations: { transactionDetails: true },
      });
      if (!trx) throw new Error("Transaksi tidak ditemukan.");
      if (trx.status !== TRX_POSTED) {
        throw new Error("Hanya transaksi POSTED yang dapat dibatalkan.");
      }

      const verifiedById = await resolveVerifier(
        manager,
        body?.verifierUsername,
        body?.verifierPassword,
      );

      const details = trx.transactionDetails ?? [];
      const productIds = details.map((d) => d.productId);
      const products = await manager.find(Product, {
        where: { id: In(productIds) },
      });
      const productMap = new Map(products.map((p) => [p.id, p]));

      let restoredQty = 0;
      for (const detail of details) {
        if (detail.isRefund) continue;
        const product = productMap.get(detail.productId);
        if (product) product.stock += detail.qty;
        restoredQty += detail.qty;
      }
      await manager.save(Array.from(productMap.values()));

      trx.status = TRX_VOIDED;
      const saved = await manager.save(trx);

      const log = new AuditLog();
      log.action = "VOID_TRX";
      log.actorId = user.id;
      log.verifiedById = verifiedById;
      log.entityType = "Transaction";
      log.entityId = trx.id;
      log.reason = body?.reason ?? null;
      log.payload = {
        transactionNo: trx.transactionNo,
        totalPrice: trx.totalPrice,
        totalQty: restoredQty,
      };
      await manager.save(log);

      return saved;
    });
  }

  public async refundTransaction(
    id: UUID,
    body: RefundTransactionBody,
    user: User,
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

      const verifiedById = await resolveVerifier(
        manager,
        body.verifierUsername,
        body.verifierPassword,
      );

      const details = trx.transactionDetails ?? [];
      const detailMap = new Map(details.map((d) => [d.id, d]));

      // Aggregate per detailId in case the client sent duplicates
      const requestedQty = new Map<string, number>();
      for (const item of body.items) {
        requestedQty.set(
          item.detailId,
          (requestedQty.get(item.detailId) ?? 0) + item.qty,
        );
      }

      // Validate
      for (const [detailId, qty] of requestedQty) {
        const detail = detailMap.get(detailId);
        if (!detail) throw new Error("Item retur tidak ditemukan pada transaksi.");
        if (detail.isRefund)
          throw new Error("Beberapa item sudah pernah diretur.");
        if (qty < 1) throw new Error("Qty retur harus minimal 1.");
        if (qty > detail.qty)
          throw new Error(
            `Qty retur untuk produk ${detail.historicalName} melebihi qty pada transaksi.`,
          );
      }

      const productIds = Array.from(
        new Set(
          Array.from(requestedQty.keys()).map((did) => detailMap.get(did)!.productId),
        ),
      );
      const products = await manager.find(Product, {
        where: { id: In(productIds) },
      });
      const productMap = new Map(products.map((p) => [p.id, p]));

      let refundedAmount = 0;
      let refundedQty = 0;
      const refundedItems: Array<{
        detailId: string;
        productId: string;
        name: string;
        barcode: string;
        priceName: string;
        qty: number;
        price: number;
      }> = [];
      const toSave: TransactionDetail[] = [];

      for (const [detailId, qty] of requestedQty) {
        const detail = detailMap.get(detailId)!;
        const product = productMap.get(detail.productId);
        if (product) product.stock += qty;

        const lineAmount = Number(detail.historicalPrice) * qty;
        refundedAmount += lineAmount;
        refundedQty += qty;

        if (qty === detail.qty) {
          // Full refund of this line
          detail.isRefund = true;
          detail.refundReason = body.reason;
          toSave.push(detail);
          refundedItems.push({
            detailId: detail.id,
            productId: detail.productId,
            name: detail.historicalName,
            barcode: detail.historicalBarcode,
            priceName: detail.historicalPriceName,
            qty,
            price: Number(detail.historicalPrice),
          });
        } else {
          // Partial: shrink original detail and create a new refund detail
          detail.qty = detail.qty - qty;
          toSave.push(detail);

          const refundDetail = new TransactionDetail();
          refundDetail.transactionId = detail.transactionId;
          refundDetail.productId = detail.productId;
          refundDetail.historicalName = detail.historicalName;
          refundDetail.historicalBarcode = detail.historicalBarcode;
          refundDetail.historicalCode = detail.historicalCode;
          refundDetail.historicalCategory = detail.historicalCategory;
          refundDetail.historicalPriceName = detail.historicalPriceName;
          refundDetail.historicalPrice = Number(detail.historicalPrice);
          refundDetail.uomId = detail.uomId ?? null;
          refundDetail.historicalUomCode = detail.historicalUomCode ?? null;
          refundDetail.historicalUomName = detail.historicalUomName ?? null;
          refundDetail.qty = qty;
          refundDetail.isRefund = true;
          refundDetail.refundReason = body.reason;
          toSave.push(refundDetail);
          refundedItems.push({
            detailId: detail.id,
            productId: detail.productId,
            name: detail.historicalName,
            barcode: detail.historicalBarcode,
            priceName: detail.historicalPriceName,
            qty,
            price: Number(detail.historicalPrice),
          });
        }
      }

      await manager.save(Array.from(productMap.values()));
      // Save existing detail rows (UPDATE) and new refund detail rows (INSERT)
      // separately to avoid TypeORM mixing semantics on a heterogeneous array.
      const existingDetails = toSave.filter((d) => !!d.id);
      const newDetails = toSave.filter((d) => !d.id);
      if (existingDetails.length) await manager.save(existingDetails);
      if (newDetails.length) await manager.insert(TransactionDetail, newDetails);

      trx.totalPrice = Number(trx.totalPrice) - refundedAmount;
      trx.totalQty = trx.totalQty - refundedQty;

      // Determine if transaction is fully refunded
      const refreshed = await manager.find(TransactionDetail, {
        where: { transactionId: trx.id },
      });
      const remainingQty = refreshed
        .filter((d) => !d.isRefund)
        .reduce((sum, d) => sum + d.qty, 0);
      if (remainingQty === 0) trx.status = TRX_REFUNDED;
      // Avoid cascading the (now-mutated) details array which may confuse
      // TypeORM into nullifying FKs. We've persisted detail changes above.
      trx.transactionDetails = undefined;
      await manager.save(trx);

      const log = new AuditLog();
      log.action = "REFUND_TRX";
      log.actorId = user.id;
      log.verifiedById = verifiedById;
      log.entityType = "Transaction";
      log.entityId = trx.id;
      log.reason = body.reason ?? null;
      log.payload = {
        transactionNo: trx.transactionNo,
        refundedAmount,
        refundedQty,
        refundedItems,
      };
      await manager.save(log);

      return await manager.findOneOrFail(Transaction, {
        where: { id: trx.id },
        relations: { transactionDetails: true, cashier: true },
      });
    });
  }
}
