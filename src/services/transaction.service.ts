import dataSource from "@config/database";
import { AuditLog } from "@models/audit_log.model";
import { Product } from "@models/product.model";
import { Transaction } from "@models/transaction.model";
import { TransactionDetail } from "@models/transaction_detail.model";
import { TransactionPayment } from "@models/transaction_payment.model";
import { Uom } from "@models/uom.model";
import { User } from "@models/user.model";
import { PurchaseDetail } from "@models/purchase_detail.model";
import { Purchase } from "@models/purchase.model";
import {
  ALLOWED_PAYMENT_METHODS,
  CreateTransactionBody,
  PaymentInput,
  RefundTransactionBody,
  SPLIT_PAYMENT_LABEL,
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
      transaction.paymentMethod = body.paymentMethod || "Tunai";
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

        const resolvedUomId = d.uomId ?? product.uom_id ?? null;
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

      // Normalize payments: accept new payments[] array OR legacy single paymentMethod+cashAmount
      const rawPayments: PaymentInput[] = Array.isArray(body.payments) && body.payments.length
        ? body.payments
        : [
            {
              method: body.paymentMethod || "Tunai",
              amount: totalPrice,
              tendered:
                (body.paymentMethod || "Tunai") === "Tunai"
                  ? Number(body.cashAmount ?? totalPrice)
                  : totalPrice,
            },
          ];

      const paidAmount = rawPayments.reduce((s, p) => s + Number(p.amount || 0), 0);
      if (paidAmount + 0.001 < totalPrice) {
        throw new Error(
          `Total pembayaran (${paidAmount}) kurang dari total tagihan (${totalPrice}).`,
        );
      }
      for (const p of rawPayments) {
        if (!ALLOWED_PAYMENT_METHODS.includes(p.method)) {
          throw new Error(`Metode pembayaran tidak valid: ${p.method}`);
        }
      }

      // Build payment rows
      const paymentRows: TransactionPayment[] = rawPayments.map((p) => {
        const row = new TransactionPayment();
        row.transactionId = savedTransaction.id;
        row.method = p.method;
        row.amount = Number(p.amount || 0);
        row.tendered = Number(p.tendered ?? p.amount ?? 0);
        row.reference = p.reference ?? null;
        return row;
      });
      await manager.save(paymentRows);

      // Aggregate cash / change for backward compatibility
      const cashRow = paymentRows.find((p) => p.method === "Tunai");
      const cashTendered = cashRow ? Number(cashRow.tendered) : 0;
      const cashCharged = cashRow ? Number(cashRow.amount) : 0;
      savedTransaction.cashAmount = cashTendered;
      savedTransaction.changeAmount = Math.max(0, cashTendered - cashCharged);
      // Preserve overpayment from other methods as 0 change (non-cash never returns change)
      if (paymentRows.length > 1) {
        savedTransaction.paymentMethod = SPLIT_PAYMENT_LABEL;
      } else {
        savedTransaction.paymentMethod = paymentRows[0].method;
      }
      await manager.save(savedTransaction);

      return await manager.findOneOrFail(Transaction, {
        where: { id: savedTransaction.id },
        relations: { transactionDetails: true, cashier: true, payments: true },
      });
    });
  }

  public async getTransactionById(id: UUID): Promise<Transaction> {
    const trx = await dataSource.getRepository(Transaction).findOne({
      where: { id },
      relations: { transactionDetails: true, cashier: true, payments: true },
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
      .leftJoinAndSelect("trx.payments", "payments")
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
        relations: { transactionDetails: true, cashier: true, payments: true },
      });
    });
  }

  // ---------- REPORTS ----------

  private buildDateRange(from?: string, to?: string): { start: Date; end: Date } {
    const start = from ? new Date(from) : new Date(0);
    const end = to ? new Date(to) : new Date();
    if (to) {
      end.setHours(23, 59, 59, 999);
    }
    return { start, end };
  }

  /**
   * X Report — aggregate sales totals optionally filtered by payment method.
   * Returns totals and per-payment-method breakdown.
   */
  public async getXReport({
    from,
    to,
    paymentMethod,
    cashierId,
  }: {
    from?: string;
    to?: string;
    paymentMethod?: string;
    cashierId?: UUID;
  }): Promise<{
    period: { from: string; to: string };
    totalTransactions: number;
    totalQty: number;
    totalSales: number;
    totalReceived: number;
    totalChange: number;
    byPaymentMethod: Array<{
      method: string;
      transactions: number;
      qty: number;
      amount: number;
      received: number;
    }>;
    transactions: Array<{
      id: string;
      transactionNo: string;
      date: Date;
      cashier: string | null;
      totalPrice: number;
      totalQty: number;
      status: string;
      methods: string[];
      payments: Array<{ method: string; amount: number; tendered: number }>;
    }>;
  }> {
    const { start, end } = this.buildDateRange(from, to);
    const repo = dataSource.getRepository(Transaction);
    const qb = repo
      .createQueryBuilder("trx")
      .leftJoinAndSelect("trx.transactionDetails", "detail")
      .leftJoinAndSelect("trx.cashier", "cashier")
      .leftJoinAndSelect("trx.payments", "payments")
      .where("trx.createdAt BETWEEN :start AND :end", { start, end })
      .andWhere("trx.status = :status", { status: TRX_POSTED });

    if (cashierId) qb.andWhere("trx.cashierId = :cashierId", { cashierId });
    const all = await qb.getMany();

    // If filtered by payment method, only include transactions that contain that method.
    const transactions = paymentMethod
      ? all.filter((t) =>
          (t.payments ?? []).some((p) => p.method === paymentMethod),
        )
      : all;

    let totalSales = 0;
    let totalQty = 0;
    let totalReceived = 0;
    let totalChange = 0;
    const methodMap = new Map<
      string,
      { transactions: Set<string>; qty: number; amount: number; received: number }
    >();

    for (const t of transactions) {
      const trxQty = (t.transactionDetails ?? [])
        .filter((d) => !d.isRefund)
        .reduce((s, d) => s + Number(d.qty), 0);
      totalSales += Number(t.totalPrice);
      totalQty += trxQty;
      totalChange += Number(t.changeAmount || 0);
      for (const p of t.payments ?? []) {
        if (paymentMethod && p.method !== paymentMethod) continue;
        const key = p.method;
        if (!methodMap.has(key)) {
          methodMap.set(key, {
            transactions: new Set(),
            qty: 0,
            amount: 0,
            received: 0,
          });
        }
        const slot = methodMap.get(key)!;
        slot.transactions.add(t.id);
        slot.amount += Number(p.amount);
        slot.received += Number(p.tendered);
        // qty allocation: split qty proportional to share of payment within trx
        const trxPayTotal = (t.payments ?? []).reduce(
          (s, pp) => s + Number(pp.amount),
          0,
        );
        const share = trxPayTotal > 0 ? Number(p.amount) / trxPayTotal : 1;
        slot.qty += trxQty * share;
        totalReceived += Number(p.tendered);
      }
    }

    return {
      period: { from: start.toISOString(), to: end.toISOString() },
      totalTransactions: transactions.length,
      totalQty,
      totalSales,
      totalReceived,
      totalChange,
      byPaymentMethod: Array.from(methodMap.entries()).map(([method, v]) => ({
        method,
        transactions: v.transactions.size,
        qty: v.qty,
        amount: v.amount,
        received: v.received,
      })),
      transactions: transactions.map((t) => ({
        id: t.id,
        transactionNo: t.transactionNo,
        date: t.createdAt,
        cashier: t.cashier?.username ?? null,
        totalPrice: Number(t.totalPrice),
        totalQty: Number(t.totalQty),
        status: t.status,
        methods: Array.from(new Set((t.payments ?? []).map((p) => p.method))),
        payments: (t.payments ?? []).map((p) => ({
          method: p.method,
          amount: Number(p.amount),
          tendered: Number(p.tendered),
        })),
      })),
    };
  }

  /**
   * Margin report — calculates margin per item, per category, and totals.
   * Uses Product.hpp as the cost basis. Falls back to last PurchaseDetail.purchasePrice if hpp = 0.
   */
  public async getMarginReport({
    from,
    to,
    category,
  }: {
    from?: string;
    to?: string;
    category?: string;
  }): Promise<{
    period: { from: string; to: string };
    items: Array<{
      productId: string | null;
      barcode: string;
      name: string;
      category: string;
      qty: number;
      revenue: number;
      cost: number;
      margin: number;
      marginPct: number;
    }>;
    byCategory: Array<{
      category: string;
      qty: number;
      revenue: number;
      cost: number;
      margin: number;
      marginPct: number;
    }>;
    purchase: {
      totalQty: number;
      totalValue: number;
    };
    totals: {
      qty: number;
      revenue: number;
      cost: number;
      margin: number;
      marginPct: number;
    };
  }> {
    const { start, end } = this.buildDateRange(from, to);

    // Sales side
    const trxRepo = dataSource.getRepository(Transaction);
    const sales = await trxRepo
      .createQueryBuilder("trx")
      .leftJoinAndSelect("trx.transactionDetails", "detail")
      .where("trx.createdAt BETWEEN :start AND :end", { start, end })
      .andWhere("trx.status IN (:...statuses)", {
        statuses: [TRX_POSTED, TRX_REFUNDED],
      })
      .getMany();

    // Build cost lookup from products
    const productIds = new Set<string>();
    for (const t of sales) for (const d of t.transactionDetails ?? []) productIds.add(d.productId);
    const products = productIds.size
      ? await dataSource
          .getRepository(Product)
          .find({ where: { id: In(Array.from(productIds)) } })
      : [];
    const hppMap = new Map(products.map((p) => [p.id, Number(p.hpp || 0)]));

    // Latest purchase price fallback per product
    const purchaseDetailsLatest = productIds.size
      ? await dataSource
          .getRepository(PurchaseDetail)
          .createQueryBuilder("pd")
          .leftJoin("pd.purchase", "p")
          .where("pd.productId IN (:...ids)", { ids: Array.from(productIds) })
          .orderBy("p.purchaseDate", "DESC")
          .getMany()
      : [];
    const latestCost = new Map<string, number>();
    for (const pd of purchaseDetailsLatest) {
      if (!latestCost.has(pd.productId))
        latestCost.set(pd.productId, Number(pd.purchasePrice));
    }

    const itemMap = new Map<
      string,
      {
        productId: string | null;
        barcode: string;
        name: string;
        category: string;
        qty: number;
        revenue: number;
        cost: number;
      }
    >();
    for (const t of sales) {
      for (const d of t.transactionDetails ?? []) {
        if (d.isRefund) continue;
        if (category && d.historicalCategory !== category) continue;
        const key = d.productId || d.historicalBarcode || d.historicalName;
        const unitCost =
          hppMap.get(d.productId) ?? latestCost.get(d.productId) ?? 0;
        const qty = Number(d.qty);
        const rev = qty * Number(d.historicalPrice);
        const cost = qty * unitCost;
        const slot = itemMap.get(key) ?? {
          productId: d.productId || null,
          barcode: d.historicalBarcode,
          name: d.historicalName,
          category: d.historicalCategory,
          qty: 0,
          revenue: 0,
          cost: 0,
        };
        slot.qty += qty;
        slot.revenue += rev;
        slot.cost += cost;
        itemMap.set(key, slot);
      }
    }

    const items = Array.from(itemMap.values()).map((it) => {
      const margin = it.revenue - it.cost;
      const marginPct = it.revenue > 0 ? (margin / it.revenue) * 100 : 0;
      return { ...it, margin, marginPct };
    });

    const catAgg = new Map<
      string,
      { qty: number; revenue: number; cost: number }
    >();
    for (const it of items) {
      const slot = catAgg.get(it.category) ?? { qty: 0, revenue: 0, cost: 0 };
      slot.qty += it.qty;
      slot.revenue += it.revenue;
      slot.cost += it.cost;
      catAgg.set(it.category, slot);
    }
    const byCategory = Array.from(catAgg.entries()).map(([cat, v]) => {
      const margin = v.revenue - v.cost;
      const marginPct = v.revenue > 0 ? (margin / v.revenue) * 100 : 0;
      return { category: cat, ...v, margin, marginPct };
    });

    // Purchase side aggregate
    const purchases = await dataSource
      .getRepository(Purchase)
      .createQueryBuilder("p")
      .leftJoinAndSelect("p.purchaseDetails", "pd")
      .where("p.purchaseDate BETWEEN :start AND :end", { start, end })
      .andWhere("p.status = :status", { status: "POSTED" })
      .getMany();
    let purchaseQty = 0;
    let purchaseValue = 0;
    for (const p of purchases) {
      for (const pd of p.purchaseDetails ?? []) {
        purchaseQty += Number(pd.qty);
        purchaseValue += Number(pd.qty) * Number(pd.purchasePrice);
      }
    }

    const totalQty = items.reduce((s, i) => s + i.qty, 0);
    const totalRev = items.reduce((s, i) => s + i.revenue, 0);
    const totalCost = items.reduce((s, i) => s + i.cost, 0);
    const totalMargin = totalRev - totalCost;

    return {
      period: { from: start.toISOString(), to: end.toISOString() },
      items: items.sort((a, b) => b.margin - a.margin),
      byCategory: byCategory.sort((a, b) => b.margin - a.margin),
      purchase: { totalQty: purchaseQty, totalValue: purchaseValue },
      totals: {
        qty: totalQty,
        revenue: totalRev,
        cost: totalCost,
        margin: totalMargin,
        marginPct: totalRev > 0 ? (totalMargin / totalRev) * 100 : 0,
      },
    };
  }
}
