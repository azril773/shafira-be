import dataSource from "@config/database";
import { CANCELLED, PENDING, POSTED } from "@constants/status";
import { Product } from "@models/product.model";
import { Purchase } from "@models/purchase.model";
import { PurchaseDetail } from "@models/purchase_detail.model";
import { User } from "@models/user.model";
import { Vendor } from "@models/vendor.model";
import { In } from "typeorm";
import { UUID } from "types/common_type";
import {
  ChangeStatusPurchase,
  CreatePurchase,
  PurchaseDetailInput,
  UpdatePurchase,
} from "types/purchase.type";

export class PurchaseService {
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
          product.stock += detail.qty;
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
        purchase.updatedById = user.id;
        const savedPurchase = await manager.save(purchase);
        const newDetails = body.details.map((d) => {
          const detail = new PurchaseDetail();
          detail.purchaseId = savedPurchase.id;
          detail.productId = d.productId;
          detail.qty = d.qty;
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
