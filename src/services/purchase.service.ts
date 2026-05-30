import dataSource from "@config/database";
import {
  CANCELLED,
  PARTIAL_RETURNED,
  PENDING,
  POSTED,
  RETURNED,
} from "@constants/status";
import { ADMIN, VERIF_ADMIN } from "@constants/user";
import { AuditLog } from "@models/audit_log.model";
import { Product } from "@models/product.model";
import { Purchase } from "@models/purchase.model";
import { PurchaseDetail } from "@models/purchase_detail.model";
import { User } from "@models/user.model";
import { Vendor } from "@models/vendor.model";
import bcrypt from "bcrypt";
import { EntityManager, In } from "typeorm";
import { UUID } from "types/common_type";
import {
  ChangeStatusPurchase,
  CreatePurchase,
  PurchaseDetailInput,
  ReturnPurchaseItemsBody,
  UpdatePurchase,
} from "types/purchase.type";

const PURCHASE_RETURN_ACTION = "PURCHASE_RETURN_ITEMS";
const PURCHASE_ENTITY_TYPE = "purchase";

type PurchaseReturnPayloadItem = {
  purchaseDetailId: UUID;
  qty: number;
};

export class PurchaseService {
  private extractReturnItems(payload: unknown): PurchaseReturnPayloadItem[] {
    if (!payload || typeof payload !== "object") return [];

    const items = (payload as { items?: unknown }).items;
    if (!Array.isArray(items)) return [];

    return items.flatMap((item) => {
      if (!item || typeof item !== "object") return [];

      const purchaseDetailId = (item as { purchaseDetailId?: unknown }).purchaseDetailId;
      const qty = Number((item as { qty?: unknown }).qty);

      if (typeof purchaseDetailId !== "string" || !Number.isFinite(qty) || qty <= 0) {
        return [];
      }

      return [{ purchaseDetailId: purchaseDetailId as UUID, qty }];
    });
  }

  private async getReturnedQtyMaps(
    manager: EntityManager,
    purchaseIds: UUID[],
  ): Promise<Map<UUID, Map<UUID, number>>> {
    if (purchaseIds.length === 0) return new Map();

    const logs = await manager.find(AuditLog, {
      where: {
        action: PURCHASE_RETURN_ACTION,
        entityType: PURCHASE_ENTITY_TYPE,
        entityId: In(purchaseIds),
      },
      order: { createdAt: "ASC" },
    });

    const returnedQtyByPurchaseId = new Map<UUID, Map<UUID, number>>();

    for (const log of logs) {
      if (!log.entityId) continue;

      const detailQtyMap =
        returnedQtyByPurchaseId.get(log.entityId) ?? new Map<UUID, number>();

      for (const item of this.extractReturnItems(log.payload)) {
        detailQtyMap.set(
          item.purchaseDetailId,
          (detailQtyMap.get(item.purchaseDetailId) ?? 0) + item.qty,
        );
      }

      returnedQtyByPurchaseId.set(log.entityId, detailQtyMap);
    }

    return returnedQtyByPurchaseId;
  }

  private async resolveVerifier(
    manager: EntityManager,
    username?: string,
    password?: string,
  ): Promise<UUID> {
    if (!username || !password) {
      throw new Error("Persetujuan admin diperlukan untuk retur pembelian");
    }

    const verifier = await manager.findOne(User, {
      where: { username },
    });
    if (!verifier) throw new Error("Verifier tidak ditemukan");
    if (verifier.role !== ADMIN && verifier.role !== VERIF_ADMIN) {
      throw new Error("Verifier bukan admin");
    }

    const isValidPassword = await bcrypt.compare(password, verifier.password);
    if (!isValidPassword) throw new Error("Password verifier salah");

    return verifier.id;
  }

  private applyReturnedQty(
    purchase: Purchase,
    returnedQtyByDetailId: Map<UUID, number>,
  ): Purchase {
    for (const detail of purchase.purchaseDetails ?? []) {
      const returnedQty = returnedQtyByDetailId.get(detail.id) ?? 0;
      Object.assign(detail, {
        returnedQty,
        remainingReturnQty: Math.max(detail.qty - returnedQty, 0),
      });
    }

    return purchase;
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
    const manager = dataSource.manager;
    const purchase = await manager.findOne(Purchase, {
      where: { id },
      relations: {
        vendor: true,
        purchaseDetails: { product: { prices: true } },
      },
    });
    if (!purchase) throw new Error("purchase tidak ada");

    const returnedQtyMaps = await this.getReturnedQtyMaps(manager, [purchase.id]);
    return this.applyReturnedQty(
      purchase,
      returnedQtyMaps.get(purchase.id) ?? new Map<UUID, number>(),
    );
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

    const returnedQtyMaps = await this.getReturnedQtyMaps(dataSource.manager, ids);
    for (const purchase of purchases) {
      this.applyReturnedQty(
        purchase,
        returnedQtyMaps.get(purchase.id) ?? new Map<UUID, number>(),
      );
    }

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
        [POSTED]: [CANCELLED],
        [CANCELLED]: [],
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
          const oldStock = Number(product.stock);
          const oldHpp = Number(product.hpp);
          const purchasedQty = Number(detail.qty);
          const purchasePrice = Number(detail.purchasePrice);
          const newTotalQty = oldStock + purchasedQty;
          if (newTotalQty > 0) {
            product.hpp = (oldStock * oldHpp + purchasedQty * purchasePrice) / newTotalQty;
          }
          product.stock += purchasedQty;
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
        // Prevent stale relation data from being cascaded back after delete.
        purchase.purchaseDetails = [];
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

  public async returnPurchaseItems(
    user: User,
    id: UUID,
    body: ReturnPurchaseItemsBody,
  ): Promise<Purchase> {
    await dataSource.transaction(async (manager) => {
      const verifierId = await this.resolveVerifier(
        manager,
        body.verifierUsername,
        body.verifierPassword,
      );

      const purchase = await manager.findOne(Purchase, {
        where: { id },
        relations: { purchaseDetails: { product: true } },
      });
      if (!purchase) throw new Error("purchase tidak ada");

      if (![POSTED, PARTIAL_RETURNED].includes(purchase.status)) {
        throw new Error("Purchase ini tidak dapat diretur");
      }

      const returnedQtyMaps = await this.getReturnedQtyMaps(manager, [purchase.id]);
      const returnedQtyByDetailId =
        returnedQtyMaps.get(purchase.id) ?? new Map<UUID, number>();

      const details = purchase.purchaseDetails ?? [];
      const detailMap = new Map(details.map((detail) => [detail.id, detail]));
      const aggregatedItems = new Map<UUID, number>();

      for (const item of body.items) {
        if (!detailMap.has(item.purchaseDetailId)) {
          throw new Error("Item retur tidak ditemukan pada purchase ini");
        }

        aggregatedItems.set(
          item.purchaseDetailId,
          (aggregatedItems.get(item.purchaseDetailId) ?? 0) + item.qty,
        );
      }

      const productQtyToReturn = new Map<UUID, number>();

      for (const [purchaseDetailId, qty] of aggregatedItems) {
        const detail = detailMap.get(purchaseDetailId);
        if (!detail) throw new Error("Detail purchase tidak ditemukan");

        const returnedQty = returnedQtyByDetailId.get(purchaseDetailId) ?? 0;
        const remainingQty = detail.qty - returnedQty;

        if (qty > remainingQty) {
          throw new Error(
            `Qty retur untuk produk ${detail.product?.name ?? detail.productId} melebihi sisa qty purchase`,
          );
        }

        productQtyToReturn.set(
          detail.productId,
          (productQtyToReturn.get(detail.productId) ?? 0) + qty,
        );
      }

      const products = await manager.find(Product, {
        where: { id: In(Array.from(productQtyToReturn.keys())) },
      });
      const productMap = new Map(products.map((product) => [product.id, product]));

      for (const [productId, qty] of productQtyToReturn) {
        const product = productMap.get(productId);
        if (!product) throw new Error("product tidak ada");
        if (product.stock < qty) {
          throw new Error(
            `Stok produk ${product.name} tidak mencukupi untuk retur pembelian`,
          );
        }
        product.stock -= qty;
      }

      await manager.save(Array.from(productMap.values()));
      await manager.save(
        manager.create(AuditLog, {
          action: PURCHASE_RETURN_ACTION,
          actorId: user.id,
          verifiedById: verifierId,
          entityType: PURCHASE_ENTITY_TYPE,
          entityId: purchase.id,
          reason: body.reason ?? null,
          payload: {
            items: Array.from(aggregatedItems, ([purchaseDetailId, qty]) => ({
              purchaseDetailId,
              qty,
            })),
          },
        }),
      );

      let fullyReturned = true;
      for (const detail of details) {
        const currentReturnedQty = returnedQtyByDetailId.get(detail.id) ?? 0;
        const requestedReturnQty = aggregatedItems.get(detail.id) ?? 0;
        if (currentReturnedQty + requestedReturnQty < detail.qty) {
          fullyReturned = false;
          break;
        }
      }

      purchase.status = fullyReturned ? RETURNED : PARTIAL_RETURNED;
      purchase.updatedById = user.id;
      await manager.save(purchase);
    });

    return await this.getPurchaseById(id);
  }
}
