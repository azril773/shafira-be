import dataSource from "@config/database";
import {
  CANCELLED,
  PARTIAL_RETURNED,
  PENDING,
  POSTED,
  RETURNED,
} from "@constants/status";
import { AuditLog } from "@models/audit_log.model";
import { Product } from "@models/product.model";
import { Purchase } from "@models/purchase.model";
import { PurchaseDetail } from "@models/purchase_detail.model";
import { User } from "@models/user.model";
import { Vendor } from "@models/vendor.model";
import { In } from "typeorm";
import { UUID } from "types/common_type";
import { AUDIT_PURCHASE_RETURN_ITEM } from "types/audit_log";
import {
  ChangeStatusPurchase,
  CreatePurchase,
  PurchaseDetailInput,
  ReturnPurchaseItemsBody,
  UpdatePurchase,
} from "types/purchase.type";

export class PurchaseService {
  private async buildReturnedQtyMap(
    purchaseIds: UUID[],
  ): Promise<Map<UUID, Map<UUID, number>>> {
    const result = new Map<UUID, Map<UUID, number>>();
    if (!purchaseIds.length) return result;

    const logs = await dataSource.getRepository(AuditLog).find({
      where: {
        action: AUDIT_PURCHASE_RETURN_ITEM,
        entityType: "Purchase",
        entityId: In(purchaseIds),
      },
      order: { createdAt: "ASC" },
    });

    for (const log of logs) {
      if (!log.entityId) continue;
      const payload = (log.payload ?? {}) as {
        items?: Array<{ purchaseDetailId?: UUID; qty?: number }>;
      };
      const items = payload.items ?? [];
      if (!result.has(log.entityId)) result.set(log.entityId, new Map());
      const detailMap = result.get(log.entityId)!;
      for (const item of items) {
        if (!item.purchaseDetailId) continue;
        const qty = Number(item.qty ?? 0);
        if (qty <= 0) continue;
        detailMap.set(
          item.purchaseDetailId,
          (detailMap.get(item.purchaseDetailId) ?? 0) + qty,
        );
      }
    }

    return result;
  }

  private async enrichPurchaseReturnProgress(purchases: Purchase[]): Promise<void> {
    if (!purchases.length) return;
    const map = await this.buildReturnedQtyMap(purchases.map((p) => p.id));

    for (const purchase of purchases) {
      const detailMap = map.get(purchase.id) ?? new Map<UUID, number>();
      for (const detail of purchase.purchaseDetails ?? []) {
        const returnedQty = detailMap.get(detail.id) ?? 0;
        const withMeta = detail as PurchaseDetail & {
          returnedQty?: number;
          remainingReturnQty?: number;
        };
        withMeta.returnedQty = returnedQty;
        withMeta.remainingReturnQty = Math.max(0, (detail.qty ?? 0) - returnedQty);
      }
    }
  }

  public async createPurchase(
    user: User,
    body: CreatePurchase,
  ): Promise<Purchase> {
    return await dataSource.transaction(async (manager) => {
      const vendor = await manager.findOne(Vendor, {
        where: { id: body.vendorId },
      });
      if (!vendor) throw new Error("vendor tidak ada");

      if (!body.details || body.details.length === 0)
        throw new Error("Setidaknya harus ada satu produk pada pembelian.");

      // Validate uniqueness of products in details
      const productIds = body.details.map((d) => d.productId);
      const uniqueIds = new Set(productIds);
      if (uniqueIds.size !== productIds.length)
        throw new Error("Tidak boleh ada produk yang sama pada satu pembelian.");

      const products = await manager.find(Product, {
        where: { id: In(productIds) },
      });
      if (products.length !== productIds.length)
        throw new Error("Salah satu produk tidak ditemukan.");

      const purchase = new Purchase();
      purchase.vendorId = body.vendorId;
      purchase.purchaseDate = body.purchaseDate;
      purchase.status = PENDING;
      purchase.createdById = user.id;
      purchase.updatedById = user.id;
      const savedPurchase = await manager.save(purchase);

      const newDetails = body.details.map((d) => {
        const detail = new PurchaseDetail();
        detail.purchaseId = savedPurchase.id;
        detail.productId = d.productId;
        detail.qty = d.qty;
        detail.purchasePrice = Number(d.purchasePrice ?? 0);
        return detail;
      });
      savedPurchase.purchaseDetails = await manager.save(newDetails);
      return savedPurchase;
    });
  }

  public async getPurchaseById(id: UUID): Promise<Purchase> {
    const purchase = await dataSource.getRepository(Purchase).findOne({
      where: { id },
      relations: {
        vendor: true,
        purchaseDetails: { product: { prices: true } },
      },
    });
    if (!purchase) throw new Error("purchase tidak ada");
    await this.enrichPurchaseReturnProgress([purchase]);
    return purchase;
  }

  public async searchPurchases({
    page,
    status,
    vendorId,
    productId,
    purchaseDate,
  }: {
    page: number;
    status?: string;
    vendorId?: UUID;
    productId?: UUID;
    purchaseDate?: string;
  }): Promise<{ purchases: Purchase[]; totalPages: number }> {
    const limit = 10;
    const offset = (page - 1) * limit;
    const repo = dataSource.getRepository(Purchase);

    // Filter purchase IDs first if productId filter is applied (so pagination is correct)
    const idQb = repo
      .createQueryBuilder("purchase")
      .select("purchase.id", "id");

    if (status) idQb.andWhere("purchase.status = :status", { status });
    if (vendorId) idQb.andWhere("purchase.vendorId = :vendorId", { vendorId });
    if (purchaseDate) {
      const start = new Date(purchaseDate);
      const end = new Date(purchaseDate);
      end.setDate(end.getDate() + 1);
      idQb.andWhere(
        "purchase.purchaseDate >= :start AND purchase.purchaseDate < :end",
        { start, end },
      );
    }
    if (productId) {
      idQb
        .innerJoin("purchase_detail", "pd", "pd.purchaseId = purchase.id")
        .andWhere("pd.productId = :productId", { productId });
    }

    idQb.orderBy("purchase.purchaseDate", "DESC").skip(offset).take(limit);

    const idRows = await idQb.getRawMany<{ id: string }>();
    const total = await idQb.getCount();
    const ids = idRows.map((r) => r.id);

    if (ids.length === 0) {
      return { purchases: [], totalPages: Math.ceil(total / limit) };
    }

    const purchases = await repo.find({
      where: { id: In(ids) },
      relations: {
        vendor: true,
        purchaseDetails: { product: { prices: true } },
      },
      order: { purchaseDate: "DESC" },
    });

    await this.enrichPurchaseReturnProgress(purchases);

    return { purchases, totalPages: Math.ceil(total / limit) };
  }

  public async updateStatus(
    user: User,
    body: ChangeStatusPurchase,
  ): Promise<Purchase> {
    return await dataSource.transaction(async (manager) => {
      const purchase = await manager.findOne(Purchase, {
        where: { id: body.id },
        relations: { purchaseDetails: true },
      });
      if (!purchase) throw new Error("purchase tidak ada");
      const allowedChange: { [key: string]: string[] } = {
        [PENDING]: [POSTED, CANCELLED],
        [POSTED]: [CANCELLED, RETURNED],
        [CANCELLED]: [],
        [PARTIAL_RETURNED]: [],
        [RETURNED]: [],
      };
      if (!allowedChange[purchase.status]?.includes(body.status)) {
        throw new Error("Perubahan status tidak valid");
      }

      const details = purchase.purchaseDetails ?? [];
      const productIds = details.map((d) => d.productId);
      const products = await manager.find(Product, {
        where: { id: In(productIds) },
      });
      const productMap = new Map(products.map((p) => [p.id, p]));

      if (body.status === POSTED) {
        for (const detail of details) {
          const product = productMap.get(detail.productId);
          if (!product) throw new Error("product tidak ada");
          product.stock += detail.qty;
        }
        await manager.save(Array.from(productMap.values()));
      } else if (purchase.status === POSTED && body.status === RETURNED) {
        const returnedQtyMap = await this.buildReturnedQtyMap([purchase.id]);
        const detailReturned = returnedQtyMap.get(purchase.id) ?? new Map<UUID, number>();
        for (const detail of details) {
          const product = productMap.get(detail.productId);
          if (!product) throw new Error("product tidak ada");
          const alreadyReturned = detailReturned.get(detail.id) ?? 0;
          const remainingQty = Math.max(0, detail.qty - alreadyReturned);
          if (remainingQty <= 0) continue;
          if (product.stock < remainingQty) {
            throw new Error(
              `Tidak dapat retur purchase karena stok produk ${product.name} tidak mencukupi`,
            );
          }
          product.stock -= remainingQty;
        }
        await manager.save(Array.from(productMap.values()));
      } else if (purchase.status === POSTED && body.status === CANCELLED) {
        for (const detail of details) {
          const product = productMap.get(detail.productId);
          if (!product) throw new Error("product tidak ada");
          if (product.stock < detail.qty) {
            throw new Error(
              `Tidak dapat membatalkan purchase karena stok produk ${product.name} tidak mencukupi`,
            );
          }
          product.stock -= detail.qty;
        }
        await manager.save(Array.from(productMap.values()));
      }
      purchase.status = body.status;
      purchase.updatedById = user.id;
      return await manager.save(purchase);
    });
  }

  public async returnPurchaseItems(
    user: User,
    purchaseId: UUID,
    body: ReturnPurchaseItemsBody,
  ): Promise<Purchase> {
    return await dataSource.transaction(async (manager) => {
      const purchase = await manager.findOne(Purchase, {
        where: { id: purchaseId },
        relations: {
          vendor: true,
          purchaseDetails: { product: { prices: true } },
        },
      });
      if (!purchase) throw new Error("purchase tidak ada");
      if (![POSTED, PARTIAL_RETURNED].includes(purchase.status)) {
        throw new Error("Hanya pembelian berstatus POSTED/PARTIAL_RETURNED yang dapat diretur.");
      }

      const details = purchase.purchaseDetails ?? [];
      const detailMap = new Map(details.map((d) => [d.id, d]));

      const requestedQty = new Map<UUID, number>();
      for (const item of body.items ?? []) {
        requestedQty.set(
          item.purchaseDetailId,
          (requestedQty.get(item.purchaseDetailId) ?? 0) + Number(item.qty ?? 0),
        );
      }
      if (!requestedQty.size)
        throw new Error("Pilih minimal satu item untuk diretur.");

      const returnedMap = await this.buildReturnedQtyMap([purchase.id]);
      const alreadyReturned = returnedMap.get(purchase.id) ?? new Map<UUID, number>();

      const productIds: UUID[] = [];
      const returnPayloadItems: Array<{
        purchaseDetailId: UUID;
        productId: UUID;
        productName: string;
        qty: number;
        purchasePrice: number;
      }> = [];

      for (const [detailId, qty] of requestedQty) {
        const detail = detailMap.get(detailId);
        if (!detail) throw new Error("Item retur tidak ditemukan pada purchase.");
        if (qty < 1) throw new Error("Qty retur harus minimal 1.");

        const maxReturnable = Math.max(0, detail.qty - (alreadyReturned.get(detail.id) ?? 0));
        if (qty > maxReturnable) {
          throw new Error(
            `Qty retur untuk produk ${detail.product?.name || "-"} melebihi sisa yang bisa diretur (${maxReturnable}).`,
          );
        }

        productIds.push(detail.productId);
        returnPayloadItems.push({
          purchaseDetailId: detail.id,
          productId: detail.productId,
          productName: detail.product?.name || "-",
          qty,
          purchasePrice: Number(detail.purchasePrice ?? 0),
        });
      }

      const products = await manager.find(Product, {
        where: { id: In(Array.from(new Set(productIds))) },
      });
      const productMap = new Map(products.map((p) => [p.id, p]));

      for (const item of returnPayloadItems) {
        const product = productMap.get(item.productId);
        if (!product) throw new Error("product tidak ada");
        if (product.stock < item.qty) {
          throw new Error(
            `Tidak dapat retur purchase karena stok produk ${product.name} tidak mencukupi`,
          );
        }
      }

      for (const item of returnPayloadItems) {
        const product = productMap.get(item.productId)!;
        product.stock -= item.qty;
      }
      await manager.save(Array.from(productMap.values()));

      const cumulativeReturned = new Map<UUID, number>(alreadyReturned);
      for (const item of returnPayloadItems) {
        cumulativeReturned.set(
          item.purchaseDetailId,
          (cumulativeReturned.get(item.purchaseDetailId) ?? 0) + item.qty,
        );
      }

      const allFullyReturned = details.every((detail) => {
        const returned = cumulativeReturned.get(detail.id) ?? 0;
        return returned >= detail.qty;
      });

      purchase.status = allFullyReturned ? RETURNED : PARTIAL_RETURNED;
      purchase.updatedById = user.id;
      const saved = await manager.save(purchase);

      const totalQty = returnPayloadItems.reduce((sum, item) => sum + item.qty, 0);
      const totalValue = returnPayloadItems.reduce(
        (sum, item) => sum + item.qty * item.purchasePrice,
        0,
      );

      const log = new AuditLog();
      log.action = AUDIT_PURCHASE_RETURN_ITEM;
      log.actorId = user.id;
      log.entityType = "Purchase";
      log.entityId = purchase.id;
      log.reason = body.reason ?? null;
      log.payload = {
        purchaseId: purchase.id,
        purchaseDate: purchase.purchaseDate,
        vendorId: purchase.vendorId,
        vendorName: purchase.vendor?.name || null,
        totalQty,
        totalValue,
        items: returnPayloadItems,
      };
      await manager.save(log);

      await this.enrichPurchaseReturnProgress([saved]);
      return saved;
    });
  }

  public async updatePurchase(
    user: User,
    id: UUID,
    body: UpdatePurchase,
  ): Promise<Purchase> {
    return await dataSource.transaction(async (manager) => {
      const purchase = await manager.findOne(Purchase, {
        where: { id },
        relations: { purchaseDetails: true },
      });
      if (!purchase) throw new Error("purchase tidak ada");

      if (purchase.status === POSTED)
        throw new Error("Purchase yang sudah diposting tidak bisa diubah");

      if (body.vendorId) {
        const vendor = await manager.findOne(Vendor, {
          where: { id: body.vendorId },
        });
        if (!vendor) throw new Error("vendor tidak ada");
        purchase.vendorId = body.vendorId;
      }

      if (body.purchaseDate) purchase.purchaseDate = body.purchaseDate;

      if (body.details) {
        if (body.details.length === 0)
          throw new Error("Setidaknya harus ada satu produk pada pembelian.");
        const productIds = body.details.map((d: PurchaseDetailInput) => d.productId);
        if (new Set(productIds).size !== productIds.length)
          throw new Error("Tidak boleh ada produk yang sama pada satu pembelian.");
        const products = await manager.find(Product, {
          where: { id: In(productIds) },
        });
        if (products.length !== productIds.length)
          throw new Error("Salah satu produk tidak ditemukan.");

        // Replace details: delete existing, insert new
        if (purchase.purchaseDetails && purchase.purchaseDetails.length > 0) {
          await manager.delete(PurchaseDetail, {
            purchaseId: purchase.id,
          });
        }
        purchase.updatedById = user.id;
        const savedPurchase = await manager.save(purchase);
        const newDetails = body.details.map((d) => {
          const detail = new PurchaseDetail();
          detail.purchaseId = savedPurchase.id;
          detail.productId = d.productId;
          detail.qty = d.qty;
          detail.purchasePrice = Number(d.purchasePrice ?? 0);
          return detail;
        });
        savedPurchase.purchaseDetails = await manager.save(newDetails);
        return savedPurchase;
      }

      purchase.updatedById = user.id;
      return await manager.save(purchase);
    });
  }
}
