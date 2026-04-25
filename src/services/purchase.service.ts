import dataSource from "@config/database";
import { CANCELLED, PENDING, POSTED } from "@constants/status";
import { Product } from "@models/product.model";
import { Purchase } from "@models/purchase.model";
import { User } from "@models/user.model";
import { Vendor } from "@models/vendor.model";
import { UUID } from "types/common_type";
import {
  ChangeStatusPurchase,
  CreatePurchase,
  UpdatePurchase,
} from "types/purchase.type";

export class PurchaseService {
  public async createPurchase(
    user: User,
    body: CreatePurchase,
  ): Promise<Purchase> {
    return await dataSource.transaction(async (transactionalEntityManager) => {
      const product = await transactionalEntityManager.findOne(Product, {
        where: { id: body.productId },
      });
      if (!product) throw new Error("product tidak ada");
      const vendor = await transactionalEntityManager.findOne(Vendor, {
        where: { id: body.vendorId },
      });
      if (!vendor) throw new Error("vendor tidak ada");
      const purchase = new Purchase();
      purchase.productId = body.productId;
      purchase.vendorId = body.vendorId;
      purchase.purchaseDate = body.purchaseDate;
      purchase.status = PENDING;
      purchase.qty = body.qty;
      purchase.createdById = user.id;
      purchase.updatedById = user.id;
      return await transactionalEntityManager.save(purchase);
    });
  }

  // public async searchPurchases(query: any): Promise<Purchase[]> {
  //   return await dataSource.getRepository(Purchase).find({ where: query });
  // }

  public async updateStatus(
    user: User,
    body: ChangeStatusPurchase,
  ): Promise<Purchase> {
    return await dataSource.transaction(async (transactionalEntityManager) => {
      const purchase = await transactionalEntityManager.findOne(Purchase, {
        where: { id: body.id },
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

      const product = await transactionalEntityManager.findOne(Product, {
        where: { id: purchase.productId },
      });
      if (!product) throw new Error("product tidak ada");
      if (body.status === POSTED) {
        product.stock += purchase.qty;
        await transactionalEntityManager.save(product);
      } else if (purchase.status === POSTED && body.status === CANCELLED) {
        if (product.stock < purchase.qty) {
          throw new Error(
            "Tidak dapat membatalkan purchase karena stok produk tidak mencukupi",
          );
        }
        product.stock -= purchase.qty;
        await transactionalEntityManager.save(product);
      }
      purchase.status = body.status;
      purchase.updatedById = user.id;
      return await transactionalEntityManager.save(purchase);
    });
  }

  public async updatePurchase(
    user: User,
    id: UUID,
    body: UpdatePurchase,
  ): Promise<Purchase> {
    return await dataSource.transaction(async (transactionalEntityManager) => {
      const purchase = await transactionalEntityManager.findOne(Purchase, {
        where: { id: id },
      });
      if (!purchase) throw new Error("purchase tidak ada");

      if (purchase.status === POSTED)
        throw new Error("Purchase yang sudah diposting tidak bisa diubah");

      if (body.productId) {
        const product = await transactionalEntityManager.findOne(Product, {
          where: { id: body.productId },
        });
        if (!product) throw new Error("product tidak ada");
        purchase.productId = body.productId;
      }

      if (body.vendorId) {
        const vendor = await transactionalEntityManager.findOne(Vendor, {
          where: { id: body.vendorId },
        });
        if (!vendor) throw new Error("vendor tidak ada");
        purchase.vendorId = body.vendorId;
      }

      if (body.purchaseDate) purchase.purchaseDate = body.purchaseDate;
      if (body.qty) purchase.qty = body.qty;

      purchase.updatedById = user.id;
      return await transactionalEntityManager.save(purchase);
    });
  }
}
